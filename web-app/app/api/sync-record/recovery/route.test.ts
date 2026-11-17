import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseMockState,
  type SupabaseMockState,
} from "@/test-utils/supabaseMock";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";
const FAILURE_ID = "33333333-3333-3333-3333-333333333333";
const TX_HASH = `0x${"ab".repeat(32)}`;

const state = vi.hoisted(() => ({
  current: null as SupabaseMockState | null,
  sync: { status: 201, body: {} as Record<string, unknown> },
  syncCalls: [] as {
    body: unknown;
    secret: string | null;
    userId: string | null;
  }[],
}));

vi.mock("@supabase/supabase-js", async () => {
  const { buildSupabaseModule: build } = await import(
    "@/test-utils/supabaseMock"
  );
  return { createClient: () => build(state.current!).createClient() };
});

vi.mock("@supabase/ssr", async () => {
  const { buildSupabaseServerModule: build } = await import(
    "@/test-utils/supabaseMock"
  );
  return { createServerClient: () => build(state.current!).createServerClient() };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

// The route's contract is "replay the stored payload through sync-record and
// record the outcome", so the sync handler is stubbed to keep these tests
// focused on the queue bookkeeping.
vi.mock("@/app/api/sync-record/route", () => ({
  POST: async (req: NextRequest) => {
    const { NextResponse: Response } = await import("next/server");
    state.syncCalls.push({
      body: await req.json(),
      secret: req.headers.get("x-skledge-recovery-secret"),
      userId: req.headers.get("x-skledge-recovery-user-id"),
    });
    return Response.json(state.sync.body, { status: state.sync.status });
  },
}));

import { GET, POST } from "@/app/api/sync-record/recovery/route";

const db = () => state.current!;

const pendingPayload = {
  type: "expense",
  blockchain_tx_hash: TX_HASH,
  amount: 500000,
  contract_address: "0x1111111111111111111111111111111111111111",
  official_address: "0x2222222222222222222222222222222222222222",
  barangay: "Adia, Agoncillo",
  purpose: "Barangay hall repair",
};

function seedAdmin() {
  db().authUser = { id: ADMIN_ID };
  db().rows.profiles = [{ id: ADMIN_ID, role_type: "Admin" }];
}

function seedFailure(overrides: Record<string, unknown> = {}) {
  db().rows.blockchain_sync_failures = [
    {
      id: FAILURE_ID,
      user_id: OTHER_ID,
      record_type: "expense",
      blockchain_tx_hash: TX_HASH,
      payload: pendingPayload,
      status: "pending",
      attempts: 2,
      created_at: "2026-01-01T00:00:00.000Z",
      ...overrides,
    },
  ];
}

function postRequest(body: unknown, method = "POST") {
  return new NextRequest("http://localhost/api/sync-record/recovery", {
    method,
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function retry(body: unknown) {
  const response = await POST(postRequest(body));
  return { status: response.status, body: await response.json() };
}

async function list() {
  const response = await GET();
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  state.current = createSupabaseMockState();
  state.sync = { status: 201, body: { message: "ok" } };
  state.syncCalls = [];
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("SYNC_RECOVERY_SECRET", "recovery-secret");
});

describe("GET /api/sync-record/recovery access control", () => {
  it("returns 403 without a session", async () => {
    const { status, body } = await list();

    expect(status).toBe(403);
    expect(body.error).toBe("Administrator access required.");
  });

  it("returns 403 for a non-admin profile", async () => {
    db().authUser = { id: OTHER_ID };
    db().rows.profiles = [{ id: OTHER_ID, role_type: "Vendor" }];

    const { status } = await list();

    expect(status).toBe(403);
  });

  it("returns 403 when the caller has no profile", async () => {
    db().authUser = { id: ADMIN_ID };
    db().rows.profiles = [];

    const { status } = await list();

    expect(status).toBe(403);
  });

  it("returns 500 when the profile lookup fails", async () => {
    db().authUser = { id: ADMIN_ID };
    db().errors["profiles:select"] = { code: "XX000" };

    const { status, body } = await list();

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to load recovery queue.");
  });

  it("returns 500 when Supabase configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { status, body } = await list();

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to load recovery queue.");
  });
});

describe("GET /api/sync-record/recovery queue", () => {
  it("returns only pending items", async () => {
    seedAdmin();
    seedFailure({ id: FAILURE_ID });
    db().rows.blockchain_sync_failures.push({
      id: "44444444-4444-4444-4444-444444444444",
      user_id: OTHER_ID,
      status: "resolved",
    });

    const { status, body } = await list();

    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe(FAILURE_ID);
  });

  it("returns an empty list when nothing is pending", async () => {
    seedAdmin();
    db().rows.blockchain_sync_failures = [];

    const { status, body } = await list();

    expect(status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("returns 500 when the queue query fails", async () => {
    seedAdmin();
    db().errors["blockchain_sync_failures:select"] = { code: "XX000" };

    const { status, body } = await list();

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to load recovery queue.");
  });
});

describe("POST /api/sync-record/recovery validation", () => {
  it("returns 403 for a non-admin caller", async () => {
    db().authUser = { id: OTHER_ID };
    db().rows.profiles = [{ id: OTHER_ID, role_type: "COA" }];

    const { status, body } = await retry({ id: FAILURE_ID });

    expect(status).toBe(403);
    expect(body.error).toBe("Administrator access required.");
    expect(state.syncCalls).toEqual([]);
  });

  it("returns 400 when the id is missing", async () => {
    seedAdmin();

    const { status, body } = await retry({});

    expect(status).toBe(400);
    expect(body.error).toBe("A valid recovery item id is required.");
  });

  it("returns 400 when the id is not a UUID", async () => {
    seedAdmin();

    const { status, body } = await retry({ id: "not-a-uuid" });

    expect(status).toBe(400);
    expect(body.error).toBe("A valid recovery item id is required.");
  });

  it("returns 404 when the item does not exist", async () => {
    seedAdmin();
    db().rows.blockchain_sync_failures = [];

    const { status, body } = await retry({ id: FAILURE_ID });

    expect(status).toBe(404);
    expect(body.error).toBe("Recovery item was not found.");
    expect(state.syncCalls).toEqual([]);
  });

  it("returns 404 when the item is already resolved", async () => {
    seedAdmin();
    seedFailure({ status: "resolved" });

    const { status } = await retry({ id: FAILURE_ID });

    expect(status).toBe(404);
    expect(state.syncCalls).toEqual([]);
  });

  it("returns 500 when the item lookup fails", async () => {
    seedAdmin();
    db().errors["blockchain_sync_failures:select"] = { code: "XX000" };

    const { status, body } = await retry({ id: FAILURE_ID });

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to reconcile blockchain sync item.");
  });

  it("returns 500 when the recovery secret is not configured", async () => {
    seedAdmin();
    seedFailure();
    vi.stubEnv("SYNC_RECOVERY_SECRET", "");

    const { status, body } = await retry({ id: FAILURE_ID });

    expect(status).toBe(500);
    expect(body.error).toBe("Recovery service is not configured.");
    expect(state.syncCalls).toEqual([]);
  });
});

describe("POST /api/sync-record/recovery replay", () => {
  beforeEach(() => {
    seedAdmin();
    seedFailure();
  });

  it("replays the stored payload with internal recovery headers", async () => {
    const { status, body } = await retry({ id: FAILURE_ID });

    expect(status).toBe(200);
    expect(body.message).toBe("Recovery item resolved.");
    expect(state.syncCalls).toEqual([
      {
        body: pendingPayload,
        secret: "recovery-secret",
        userId: OTHER_ID,
      },
    ]);
  });

  it("marks the item resolved and counts the attempt", async () => {
    const { status } = await retry({ id: FAILURE_ID });

    expect(status).toBe(200);
    const update = db().updated.find(
      (entry) => entry.table === "blockchain_sync_failures",
    );
    expect(update?.patch).toMatchObject({
      status: "resolved",
      attempts: 3,
      last_error: null,
    });
    expect(typeof update?.patch.resolved_at).toBe("string");
    expect(typeof update?.patch.updated_at).toBe("string");
  });

  it("records a failed attempt and mirrors the sync status", async () => {
    state.sync = {
      status: 422,
      body: { error: "Transaction receipt not found on Sepolia network." },
    };

    const { status, body } = await retry({ id: FAILURE_ID });

    expect(status).toBe(422);
    expect(body.error).toBe(
      "Transaction receipt not found on Sepolia network.",
    );
    const update = db().updated.find(
      (entry) => entry.table === "blockchain_sync_failures",
    );
    expect(update?.patch).toMatchObject({
      attempts: 3,
      last_error: "Transaction receipt not found on Sepolia network.",
    });
    expect(update?.patch).not.toHaveProperty("status");
  });

  it("uses a fallback message when the sync error is empty", async () => {
    state.sync = { status: 500, body: {} };

    const { status } = await retry({ id: FAILURE_ID });

    expect(status).toBe(500);
    const update = db().updated.find(
      (entry) => entry.table === "blockchain_sync_failures",
    );
    expect(update?.patch.last_error).toBe("Recovery attempt failed.");
  });

  it("still returns the sync status when recording the attempt fails", async () => {
    state.sync = { status: 503, body: { error: "unavailable" } };
    db().errors["blockchain_sync_failures:update"] = { code: "XX000" };

    const { status, body } = await retry({ id: FAILURE_ID });

    expect(status).toBe(503);
    expect(body.error).toBe("unavailable");
  });

  it("returns 500 when the item cannot be marked resolved", async () => {
    db().errors["blockchain_sync_failures:update"] = { code: "XX000" };

    const { status, body } = await retry({ id: FAILURE_ID });

    expect(status).toBe(500);
    expect(body.error).toBe(
      "Failed to reconcile blockchain sync item.",
    );
  });
});
