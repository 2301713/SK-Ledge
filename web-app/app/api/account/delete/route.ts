import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

/**
 * Deletes the signed-in user's own account. The browser cannot remove an auth
 * user, so this runs with the service role: `profiles.id` references
 * `auth.users(id)` with ON DELETE CASCADE, which removes the profile with it.
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return errorResponse("Server configuration error.", 500);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return errorResponse("Authentication service unavailable.", 503);
  }

  if (!user) {
    return errorResponse("Unauthorized.", 401);
  }

  let body: { confirm?: unknown } = {};
  try {
    body = (await request.json()) as { confirm?: unknown };
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, username, role_type")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load profile for account deletion.", {
      code: profileError.code,
    });
    return errorResponse("Failed to load your profile.", 500);
  }

  if (!profile) {
    return errorResponse("Profile not found.", 404);
  }

  const expectedConfirmation = (profile.username ?? "").trim().toLowerCase();
  const providedConfirmation =
    typeof body.confirm === "string" ? body.confirm.trim().toLowerCase() : "";

  if (!expectedConfirmation || providedConfirmation !== expectedConfirmation) {
    return errorResponse(
      "Type your username exactly to confirm account deletion.",
      400,
    );
  }

  // Never let the last administrator delete the only account that can restore
  // access to the platform.
  if (profile.role_type === "Admin") {
    const { count, error: countError } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role_type", "Admin");

    if (countError) {
      console.error("Failed to count administrators.", {
        code: countError.code,
      });
      return errorResponse("Failed to verify administrator accounts.", 500);
    }

    if ((count ?? 0) <= 1) {
      return errorResponse(
        "The last administrator account cannot be deleted.",
        409,
      );
    }
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    user.id,
  );

  if (deleteError) {
    console.error("Failed to delete account.", { code: deleteError.status });
    return errorResponse(
      "Failed to delete your account. Please contact an administrator.",
      500,
    );
  }

  return NextResponse.json({ message: "Account deleted." });
}
