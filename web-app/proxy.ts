import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Server-side route guard. The dashboards still perform their own client-side
 * role checks for UI state, but unauthorized users must never receive the page
 * in the first place.
 */
const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  // Scope split: projects are Chairperson-only, financial controls are
  // Treasurer-only. These specific prefixes must precede /sk_dashboard so
  // `rolesForPath` matches the narrowest rule first.
  { prefix: "/sk_dashboard/projects", roles: ["SK_Chairperson"] },
  { prefix: "/sk_dashboard/ceiling", roles: ["SK_Treasurer"] },
  { prefix: "/sk_dashboard/allocations", roles: ["SK_Treasurer"] },
  { prefix: "/sk_dashboard/expenses", roles: ["SK_Treasurer"] },
  { prefix: "/sk_dashboard", roles: ["SK_Chairperson", "SK_Treasurer"] },
  { prefix: "/coa_dashboard", roles: ["COA"] },
  { prefix: "/skfed_dashboard", roles: ["SK_Federation"] },
  { prefix: "/admin_dashboard", roles: ["Admin"] },
];

function rolesForPath(pathname: string): string[] | null {
  const match = ROUTE_ROLES.find(
    (route) =>
      pathname === route.prefix || pathname.startsWith(`${route.prefix}/`)
  );
  return match ? match.roles : null;
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Proxy cannot guard routes: Supabase env is missing.");
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session (if needed) before deciding anything.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const redirectTo = (path: string, reason?: string) => {
    const url = new URL(path, request.url);
    if (reason) {
      url.searchParams.set("reason", reason);
    }
    url.searchParams.set("next", request.nextUrl.pathname);

    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (authError && authError.status !== 400) {
    console.error("Proxy session lookup failed.", {
      status: authError.status ?? "unknown",
    });
  }

  if (!user) {
    return redirectTo("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role_type, approval_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Proxy profile lookup failed.", {
      code: profileError.code,
    });
    return redirectTo("/unauthorized", "profile_unavailable");
  }

  if (!profile) {
    return redirectTo("/auth/complete-profile");
  }

  if (profile.approval_status !== "approved") {
    return redirectTo("/unauthorized", "approval_pending");
  }

  const allowedRoles = rolesForPath(request.nextUrl.pathname);
  if (allowedRoles && !allowedRoles.includes(profile.role_type ?? "")) {
    return redirectTo("/unauthorized", "role");
  }

  return response;
}

export const config = {
  matcher: [
    "/sk_dashboard/:path*",
    "/coa_dashboard/:path*",
    "/skfed_dashboard/:path*",
    "/admin_dashboard/:path*",
  ],
};
