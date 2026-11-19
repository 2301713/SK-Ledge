import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { RECEIPT_BUCKET } from "@/lib/receipts";

export const runtime = "nodejs";

const VIEW_ROLES = new Set([
  "Admin",
  "COA",
  "SK_Federation",
  "SK_Chairperson",
  "SK_Treasurer",
]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

async function getAuthenticatedUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return { error: errorResponse("Server configuration error.", 500) };
  }

  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return {
      error: errorResponse(
        "Unauthenticated. Valid session cookie required.",
        401
      ),
    };
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return { user, admin };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!UUID_RE.test(id)) {
      return errorResponse("Invalid receipt reference.", 400);
    }

    const auth = await getAuthenticatedUser();
    if ("error" in auth) return auth.error;

    const { user, admin } = auth;
    const { data: document, error: documentError } = await admin
      .from("documents")
      .select("id, uploaded_by, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (documentError) {
      console.error("Failed to load receipt metadata.", {
        code: documentError.code,
      });
      return errorResponse("Failed to load the receipt.", 500);
    }

    if (!document) {
      return errorResponse("Receipt not found.", 404);
    }

    if (document.uploaded_by !== user.id) {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("role_type, approval_status")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to load receipt viewer profile.", {
          code: profileError.code,
        });
        return errorResponse("Failed to verify receipt permissions.", 500);
      }

      if (
        !profile ||
        profile.approval_status !== "approved" ||
        !VIEW_ROLES.has(profile.role_type)
      ) {
        return errorResponse(
          "Forbidden. You may not view this receipt.",
          403
        );
      }
    }

    const { data, error } = await admin.storage
      .from(RECEIPT_BUCKET)
      .createSignedUrl(document.storage_path, 600);

    if (error || !data?.signedUrl) {
      console.error("Failed to sign receipt URL.", {
        message: error?.message ?? "No signed URL returned",
      });
      return errorResponse("Receipt file was not found.", 404);
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Unexpected receipt lookup failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
