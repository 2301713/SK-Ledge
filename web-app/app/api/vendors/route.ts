import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const COMPANY_NAME_MIN = 2;
const COMPANY_NAME_MAX = 120;
const USERNAME_MAX = 60;
const INCOMPLETE_ROLES = new Set(["Vendor", "pending"]);

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("Vendor registration is missing required Supabase configuration.");
      return errorResponse("Server configuration error.", 500);
    }

    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError) {
      if (authError.status && authError.status < 500) {
        return errorResponse("Unauthenticated. Valid session cookie required.", 401);
      }

      console.error("Vendor registration authentication failed.", {
        status: authError.status ?? "unknown",
      });
      return errorResponse("Authentication service unavailable.", 500);
    }

    if (!user) {
      return errorResponse("Unauthenticated. Valid session cookie required.", 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Request body must contain valid JSON.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Request body must be a JSON object.", 400);
    }

    const payload = body as Record<string, unknown>;
    const companyName = (readString(payload.company_name) ?? "").trim();
    const requestedUsername = (readString(payload.username) ?? "").trim();

    if (
      companyName.length < COMPANY_NAME_MIN ||
      companyName.length > COMPANY_NAME_MAX
    ) {
      return errorResponse(
        `Invalid company_name. It must contain ${COMPANY_NAME_MIN} to ${COMPANY_NAME_MAX} characters.`,
        400,
      );
    }

    if (requestedUsername.length > USERNAME_MAX) {
      return errorResponse(
        `Invalid username. It must contain at most ${USERNAME_MAX} characters.`,
        400,
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role_type, approval_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load vendor registration profile.", {
        code: profileError.code,
      });
      return errorResponse("Failed to verify account state.", 500);
    }

    if (
      existingProfile?.role_type &&
      !INCOMPLETE_ROLES.has(existingProfile.role_type)
    ) {
      return errorResponse(
        `This account is already registered as ${existingProfile.role_type}.`,
        409,
      );
    }

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const username =
      requestedUsername ||
      (readString(metadata.username) ?? "").trim() ||
      user.email?.split("@")[0] ||
      `vendor-${user.id.slice(0, 8)}`;
    const fullName =
      (readString(metadata.full_name) ?? "").trim() || companyName;
    const avatarUrl =
      readString(metadata.avatar_url) ?? readString(metadata.picture);

    if (existingProfile) {
      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({
          username,
          full_name: fullName,
          avatar_url: avatarUrl,
          role_type: "Vendor",
          barangay: "N/A",
          company_name: companyName,
        })
        .eq("id", user.id);

      if (updateProfileError) {
        console.error("Failed to update vendor profile.", {
          code: updateProfileError.code,
        });
        return errorResponse("Failed to save vendor profile.", 500);
      }
    } else {
      const { error: insertProfileError } = await supabaseAdmin
        .from("profiles")
        .insert([
          {
            id: user.id,
            email: user.email,
            username,
            full_name: fullName,
            role_type: "Vendor",
            barangay: "N/A",
            approval_status: "pending",
            avatar_url: avatarUrl,
            company_name: companyName,
          },
        ]);

      if (insertProfileError) {
        if (insertProfileError.code === "23505") {
          return errorResponse(
            "This account has already been registered. Sign in to continue.",
            409,
          );
        }

        console.error("Failed to create vendor profile.", {
          code: insertProfileError.code,
        });
        return errorResponse("Failed to save vendor profile.", 500);
      }
    }

    return NextResponse.json(
      {
        data: {
          id: user.id,
          company_name: companyName,
          approval_status:
            existingProfile?.approval_status ?? "pending",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected vendor registration failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
