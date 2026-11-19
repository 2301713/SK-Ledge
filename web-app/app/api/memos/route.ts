import { createServerClient } from "@supabase/ssr";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  normalizeMemoText,
  validateMemo,
  type MemoAudience,
  type MemoPriority,
} from "@/lib/memos";

export const runtime = "nodejs";

const MEMO_ROLES = new Set(["SK_Federation"]);

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

type AuthContext =
  | { error: NextResponse }
  | { user: User; admin: SupabaseClient };

async function getAuthenticatedUser(): Promise<AuthContext> {
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
          cookieStore.set(name, value, options),
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
        401,
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

export async function POST(req: NextRequest) {
  try {
    const context = await getAuthenticatedUser();
    if ("error" in context) return context.error;

    const { user, admin } = context;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role_type, approval_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load memo sender profile.", {
        code: profileError.code,
      });
      return errorResponse("Failed to verify memo permissions.", 500);
    }

    if (!profile || !MEMO_ROLES.has(profile.role_type)) {
      return errorResponse(
        "Forbidden. Only SK Federation officials may publish memos.",
        403,
      );
    }

    if (profile.approval_status !== "approved") {
      return errorResponse(
        "Forbidden. Your account must be approved before publishing memos.",
        403,
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return errorResponse("Request body must be valid JSON.", 400);
    }

    const validationError = validateMemo(
      body.subject,
      body.body,
      body.priority,
      body.audience,
    );
    if (validationError) {
      return errorResponse(validationError, 400);
    }

    const { data: memo, error: insertError } = await admin
      .from("federation_memos")
      .insert({
        sender_id: user.id,
        subject: normalizeMemoText(body.subject),
        body: normalizeMemoText(body.body),
        priority: body.priority as MemoPriority,
        audience: body.audience as MemoAudience,
      })
      .select(
        "id, sender_id, subject, body, priority, audience, created_at",
      )
      .single();

    if (insertError) {
      console.error("Failed to publish federation memo.", {
        code: insertError.code,
      });
      return errorResponse("Failed to publish the memo.", 500);
    }

    return NextResponse.json(
      {
        data: {
          id: memo.id,
          senderId: memo.sender_id,
          subject: memo.subject,
          body: memo.body,
          priority: memo.priority,
          audience: memo.audience,
          createdAt: memo.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected memo publishing failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
