import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { POST as syncRecord } from "@/app/api/sync-record/route";

export const runtime = "nodejs";

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

async function getAdminContext() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration.");
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  } = await authClient.auth.getUser();
  if (authError || !user) return null;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role_type")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return profile?.role_type === "Admin" ? { admin, user } : null;
}

export async function GET() {
  try {
    const context = await getAdminContext();
    if (!context) return errorResponse("Administrator access required.", 403);

    const { data, error } = await context.admin
      .from("blockchain_sync_failures")
      .select(
        "id, user_id, record_type, blockchain_tx_hash, status, attempts, last_error, created_at, updated_at",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to load blockchain sync recovery queue.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Failed to load recovery queue.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getAdminContext();
    if (!context) return errorResponse("Administrator access required.", 403);

    const body = (await req.json()) as { id?: string };
    if (!body.id || !/^[0-9a-f-]{36}$/i.test(body.id)) {
      return errorResponse("A valid recovery item id is required.", 400);
    }

    const { data: failure, error: loadError } = await context.admin
      .from("blockchain_sync_failures")
      .select("id, user_id, payload, attempts")
      .eq("id", body.id)
      .eq("status", "pending")
      .maybeSingle();
    if (loadError) throw loadError;
    if (!failure) return errorResponse("Recovery item was not found.", 404);

    const secret = process.env.SYNC_RECOVERY_SECRET;
    if (!secret) {
      console.error("SYNC_RECOVERY_SECRET is not configured.");
      return errorResponse("Recovery service is not configured.", 500);
    }

    const syncRequest = new NextRequest("http://internal/api/sync-record", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-skledge-recovery-secret": secret,
        "x-skledge-recovery-user-id": failure.user_id,
      },
      body: JSON.stringify(failure.payload),
    });
    const syncResponse = await syncRecord(syncRequest);
    const responseBody = await syncResponse.json();

    if (!syncResponse.ok) {
      await context.admin
        .from("blockchain_sync_failures")
        .update({
          attempts: failure.attempts + 1,
          last_error: responseBody.error || "Recovery attempt failed.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", failure.id);
      return NextResponse.json(responseBody, { status: syncResponse.status });
    }

    const { error: resolveError } = await context.admin
      .from("blockchain_sync_failures")
      .update({
        status: "resolved",
        attempts: failure.attempts + 1,
        last_error: null,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", failure.id);
    if (resolveError) throw resolveError;

    return NextResponse.json({ message: "Recovery item resolved." });
  } catch (error) {
    console.error("Failed to reconcile blockchain sync item.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Failed to reconcile blockchain sync item.", 500);
  }
}
