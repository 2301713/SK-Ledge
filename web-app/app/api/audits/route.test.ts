import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: null as { id: string } | null,
  authError: null as { status?: number } | null,
  profile: null as Record<string, unknown> | null,
  profileError: null as { code?: string } | null,
  expense: null as Record<string, unknown> | null,
  expenseError: null as { code?: string } | null,
  inserted: null as Record<string, unknown> | null,
  insertResult: null as Record<string, unknown> | null,
  insertError: null as { code?: string } | null,
  update: null as Record<string, unknown> | null,
  updatedExpenseId: null as string | null,
  updateError: null as { code?: string } | null,
}));

vi.mock("@supabase/supabase-js", () => {
  const profilesBuilder = {
    select: () => profilesBuilder,
    eq: () => profilesBuilder,
    maybeSingle: async () => ({
      data: mocks.profile,
      error: mocks.profileError,
    }),
  };

  const expensesBuilder = {
    select: () => expensesBuilder,
    eq: () => expensesBuilder,
    maybeSingle: async () => ({
      data: mocks.expense,
      error: mocks.expenseError,
    }),
    update: (payload: Record<string, unknown>) => {
      mocks.update = payload;
      return {
        eq: async (_column: string, value: string) => {
          mocks.updatedExpenseId = value;
          return { error: mocks.updateError };
        },
      };
    },
  };

  const auditsBuilder = {
    insert: (payload: Record<string, unknown>) => {
      mocks.inserted = payload;
      return {
        select: () => ({
          single: async () => ({
            data: mocks.insertResult,
            error: mocks.insertError,
          }),
        }),
      };
    },
  };

  const makeClient = () => ({
    from: (table: string) => {
      if (table === "profiles") return profilesBuilder;
      if (table === "expenses") return expensesBuilder;
      return auditsBuilder;
    },
  });

  return { createClient: () => makeClient() };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: mocks.currentUser },
        error: mocks.authError,
      }),
    },
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

import { POST } from "@/app/api/audits/route";

const EXPENSE_ID = "3f6d6f5e-2b4a-4c8e-9f10-1234567890ab";
const AUDIT_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/audits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function call(body: unknown) {
  const response = await POST(request(body));
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

  mocks.currentUser = { id: "coa-user-1" };
  mocks.authError = null;
  mocks.profile = { role_type: "COA", approval_status: "approved" };
  mocks.profileError = null;
  mocks.expense = { id: EXPENSE_ID, voided: false };
  mocks.expenseError = null;
  mocks.inserted = null;
  mocks.insertError = null;
  mocks.update = null;
  mocks.updatedExpenseId = null;
  mocks.updateError = null;
  mocks.insertResult = {
    id: AUDIT_ID,
    expense_id: EXPENSE_ID,
    reviewed_by: "coa-user-1",
    status: "clean",
    findings: "",
    created_at: "2026-11-19T10:00:00.000Z",
  };
});

describe("POST /api/audits auth and permissions", () => {
  it("requires a session", async () => {
    mocks.currentUser = null;

    const { status, body } = await call({
      expense_id: EXPENSE_ID,
      status: "clean",
      findings: "",
    });

    expect(status).toBe(401);
    expect(body.error).toContain("Unauthenticated");
  });

  it("returns 500 when Supabase configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { status, body } = await call({});

    expect(status).toBe(500);
    expect(body.error).toBe("Server configuration error.");
  });

  it.each(["SK_Chairperson", "SK_Treasurer", "Admin", "SK_Federation"])(
    "rejects the non-COA role %s",
    async (role) => {
      mocks.profile = { role_type: role, approval_status: "approved" };

      const { status, body } = await call({
        expense_id: EXPENSE_ID,
        status: "clean",
        findings: "",
      });

      expect(status).toBe(403);
      expect(body.error).toContain("Only COA auditors");
      expect(mocks.inserted).toBeNull();
    },
  );

  it("rejects an unapproved COA account", async () => {
    mocks.profile = { role_type: "COA", approval_status: "pending" };

    const { status, body } = await call({
      expense_id: EXPENSE_ID,
      status: "clean",
      findings: "",
    });

    expect(status).toBe(403);
    expect(body.error).toContain("must be approved");
    expect(mocks.inserted).toBeNull();
  });

  it("returns 500 when the reviewer profile cannot be read", async () => {
    mocks.profileError = { code: "XX000" };

    const { status, body } = await call({});

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to verify audit permissions.");
  });
});

describe("POST /api/audits validation", () => {
  it("rejects a non-JSON body", async () => {
    const { status, body } = await call("not json");

    expect(status).toBe(400);
    expect(body.error).toContain("valid JSON");
  });

  it("rejects a malformed expense reference", async () => {
    const { status, body } = await call({
      expense_id: "expense-1",
      status: "clean",
      findings: "",
    });

    expect(status).toBe(400);
    expect(body.error).toBe("Invalid expense reference.");
  });

  it("rejects an unknown audit outcome", async () => {
    const { status, body } = await call({
      expense_id: EXPENSE_ID,
      status: "approved",
      findings: "Looks fine",
    });

    expect(status).toBe(400);
    expect(body.error).toBe("Select a valid audit outcome.");
  });

  it.each(["flagged", "incomplete"])(
    "requires findings for a %s outcome",
    async (status) => {
      const result = await call({
        expense_id: EXPENSE_ID,
        status,
        findings: "   ",
      });

      expect(result.status).toBe(400);
      expect(result.body.error).toContain("Findings are required");
      expect(mocks.inserted).toBeNull();
    },
  );

  it("rejects findings over the character limit", async () => {
    const { status, body } = await call({
      expense_id: EXPENSE_ID,
      status: "flagged",
      findings: "x".repeat(4001),
    });

    expect(status).toBe(400);
    expect(body.error).toContain("4000 characters");
  });

  it("returns 404 when the voucher does not exist", async () => {
    mocks.expense = null;

    const { status, body } = await call({
      expense_id: EXPENSE_ID,
      status: "clean",
      findings: "",
    });

    expect(status).toBe(404);
    expect(body.error).toBe("Voucher not found.");
  });

  it("returns 500 when the voucher lookup fails", async () => {
    mocks.expenseError = { code: "XX000" };

    const { status, body } = await call({
      expense_id: EXPENSE_ID,
      status: "clean",
      findings: "",
    });

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to load the voucher.");
  });

  it("rejects a voided voucher", async () => {
    mocks.expense = { id: EXPENSE_ID, voided: true };

    const { status, body } = await call({
      expense_id: EXPENSE_ID,
      status: "clean",
      findings: "",
    });

    expect(status).toBe(409);
    expect(body.error).toBe("Voided vouchers cannot be audited.");
    expect(mocks.inserted).toBeNull();
  });
});

describe("POST /api/audits persistence", () => {
  it("records a clean review and marks the expense clean", async () => {
    const { status, body } = await call({
      expense_id: EXPENSE_ID,
      status: "clean",
      findings: "  Receipts complete.  ",
    });

    expect(status).toBe(201);
    expect(mocks.inserted).toEqual({
      expense_id: EXPENSE_ID,
      reviewed_by: "coa-user-1",
      status: "clean",
      findings: "Receipts complete.",
    });
    expect(mocks.update).toEqual({ compliance_status: "Clean" });
    expect(mocks.updatedExpenseId).toBe(EXPENSE_ID);
    expect(body.data).toMatchObject({
      id: AUDIT_ID,
      expenseId: EXPENSE_ID,
      reviewedBy: "coa-user-1",
      status: "clean",
      findings: "",
      createdAt: "2026-11-19T10:00:00.000Z",
    });
  });

  it("records a flagged review and marks the expense flagged", async () => {
    mocks.insertResult = { ...mocks.insertResult, status: "flagged" };

    const { status } = await call({
      expense_id: EXPENSE_ID,
      status: "flagged",
      findings: "Amount exceeds the approved ceiling.",
    });

    expect(status).toBe(201);
    expect(mocks.inserted).toMatchObject({ status: "flagged" });
    expect(mocks.update).toEqual({ compliance_status: "Flagged" });
  });

  it("records an incomplete review and maps it to Pending Docs", async () => {
    mocks.insertResult = { ...mocks.insertResult, status: "incomplete" };

    const { status } = await call({
      expense_id: EXPENSE_ID,
      status: "incomplete",
      findings: "Official receipt is missing.",
    });

    expect(status).toBe(201);
    expect(mocks.update).toEqual({ compliance_status: "Pending Docs" });
  });

  it("returns 500 and skips the status update when the audit insert fails", async () => {
    mocks.insertError = { code: "XX000" };

    const { status, body } = await call({
      expense_id: EXPENSE_ID,
      status: "clean",
      findings: "",
    });

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to record the audit review.");
    expect(mocks.update).toBeNull();
  });

  it("still returns 201 when only the compliance label update fails", async () => {
    mocks.updateError = { code: "XX000" };

    const { status } = await call({
      expense_id: EXPENSE_ID,
      status: "clean",
      findings: "",
    });

    expect(status).toBe(201);
    expect(mocks.inserted).not.toBeNull();
  });
});
