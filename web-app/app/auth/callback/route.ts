import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // 1. Log the exact URL so we can see if there is a hash (#) or an error
  console.log("CALLBACK HIT! Full URL received:", request.url);

  // 2. Catch actual OAuth errors sent by Supabase/Google
  if (error) {
    console.error("OAuth Error from Provider:", error_description || error);
    return NextResponse.redirect(
      new URL(`/login?error=${error_description || error}`, request.url),
    );
  }

  // 3. Our original check
  if (!code) {
    console.error("No code and no error parameter found in URL.");
    return NextResponse.redirect(
      new URL("/login?error=No code provided", request.url),
    );
  }

  // In modern Next.js, cookies() must be awaited
  const cookieStore = await cookies();

  // Initialize the new SSR client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore if called from a Server Component that cannot write cookies
          }
        },
      },
    },
  );

  // 1. Exchange the Google code for a Supabase session
  const { data: authData, error: authError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (authError || !authData.user) {
    // This will print the EXACT reason it failed to your VSCode terminal
    console.error(
      "Exchange Error Details:",
      authError?.message || "No user returned",
    );

    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(authError?.message || "Authentication failed")}`,
        request.url,
      ),
    );
  }

  // 2. Fetch the user's profile data
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role_type, approval_status")
    .eq("id", authData.user.id)
    .single();

  // 3. If no profile exists, they are genuinely new. Send to complete-profile.
  if (profileError || !profileData) {
    return NextResponse.redirect(
      new URL("/auth/complete-profile", request.url),
    );
  }

  // 4. If they exist but are pending, log them out and send back to login with an error.
  if (profileData.approval_status === "pending") {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        "/login?error=Your account is pending administrator approval.",
        request.url,
      ),
    );
  }

  // 5. Update their timestamp (just like you did in the email login logic)
  await supabase
    .from("profiles")
    .update({ created_at: new Date().toISOString() })
    .eq("id", authData.user.id);

  // 6. Route them to the correct dashboard based on their role
  switch (profileData.role_type) {
    case "SK_Chairperson":
    case "SK_Treasurer":
      return NextResponse.redirect(new URL("/sk_dashboard", request.url));
    case "COA":
      return NextResponse.redirect(new URL("/coa_dashboard", request.url));
    case "BMO":
      return NextResponse.redirect(new URL("/bmo_dashboard", request.url));
    case "SK_Federation":
      return NextResponse.redirect(new URL("/skfed_dashboard", request.url));
    default:
      return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
