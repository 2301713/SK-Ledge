import { createServerClient } from "@supabase/ssr";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  AUDIT_COMPLIANCE_LABELS,
  normalizeFindings,
  validateAuditReview,
  type AuditStatus,
} from "@/lib/audits";

export const runtime = "nodejs";

const AUDIT_ROLES = new Set(["COA"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      console.error("Failed to load audit reviewer profile.", {
        code: profileError.code,
      });
      return errorResponse("Failed to verify audit permissions.", 500);
    }

    if (!profile || !AUDIT_ROLES.has(profile.role_type)) {
      return errorResponse(
        "Forbidden. Only COA auditors may record audit findings.",
        403,
      );
    }

    if (profile.approval_status !== "approved") {
      return errorResponse(
        "Forbidden. Your account must be approved before auditing vouchers.",
        403,
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return errorResponse("Request body must be valid JSON.", 400);
    }

    const expenseId = String(body.expense_id ?? "");
    if (!UUID_RE.test(expenseId)) {
      return errorResponse("Invalid expense reference.", 400);
    }

    const validationError = validateAuditReview(body.status, body.findings);
    if (validationError) {
      return errorResponse(validationError, 400);
    }

    const status = body.status as AuditStatus;
    const findings = normalizeFindings(body.findings);

    const { data: expense, error: expenseError } = await admin
      .from("expenses")
      .select("id, voided")
      .eq("id", expenseId)
      .maybeSingle();

    if (expenseError) {
      console.error("Failed to load expense for audit.", {
        code: expenseError.code,
      });
      return errorResponse("Failed to load the voucher.", 500);
    }

    if (!expense) {
      return errorResponse("Voucher not found.", 404);
    }

    if (expense.voided) {
      return errorResponse("Voided vouchers cannot be audited.", 409);
    }

    const { data: audit, error: insertError } = await admin
      .from("expense_audits")
      .insert({
        expense_id: expenseId,
        reviewed_by: user.id,
        status,
        findings,
      })
      .select("id, expense_id, reviewed_by, status, findings, created_at")
      .single();

    if (insertError) {
      console.error("Failed to record audit findings.", {
        code: insertError.code,
      });
      return errorResponse("Failed to record the audit review.", 500);
    }

    // Keep the voucher's off-chain compliance label aligned with the latest
    // review. The audit row itself is the authoritative history.
    const { error: updateError } = await admin
      .from("expenses")
      .update({ compliance_status: AUDIT_COMPLIANCE_LABELS[status] })
      .eq("id", expenseId);

    if (updateError) {
      console.error("Failed to update expense compliance status.", {
        code: updateError.code,
      });
    }

    return NextResponse.json(
      {
        data: {
          id: audit.id,
          expenseId: audit.expense_id,
          reviewedBy: audit.reviewed_by,
          status: audit.status,
          findings: audit.findings,
          createdAt: audit.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected audit submission failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
