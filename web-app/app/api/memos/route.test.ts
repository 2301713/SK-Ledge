import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: null as { id: string } | null,
  authError: null as { status?: number } | null,
  profile: null as Record<string, unknown> | null,
  profileError: null as { code?: string } | null,
  inserted: null as Record<string, unknown> | null,
  insertResult: null as Record<string, unknown> | null,
  insertError: null as { code?: string } | null,
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

  const memosBuilder = {
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
    from: (table: string) =>
      table === "profiles" ? profilesBuilder : memosBuilder,
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

import { POST } from "@/app/api/memos/route";

const MEMO_ID = "8d0b3c76-1a2b-4c3d-8e9f-0123456789ab";

const validMemo = {
  subject: "City-wide CBYDP submission",
  body: "Submit your amended CBYDP by Friday.",
  priority: "standard",
  audience: "all",
};

function request(body: unknown) {
  return new NextRequest("http://localhost/api/memos", {
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

  mocks.currentUser = { id: "fed-user-1" };
  mocks.authError = null;
  mocks.profile = { role_type: "SK_Federation", approval_status: "approved" };
  mocks.profileError = null;
  mocks.inserted = null;
  mocks.insertError = null;
  mocks.insertResult = {
    id: MEMO_ID,
    sender_id: "fed-user-1",
    subject: validMemo.subject,
    body: validMemo.body,
    priority: "standard",
    audience: "all",
    created_at: "2026-11-19T11:00:00.000Z",
  };
});

describe("POST /api/memos auth and permissions", () => {
  it("requires a session", async () => {
    mocks.currentUser = null;

    const { status, body } = await call(validMemo);

    expect(status).toBe(401);
    expect(body.error).toContain("Unauthenticated");
  });

  it("returns 500 when Supabase configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { status, body } = await call(validMemo);

    expect(status).toBe(500);
    expect(body.error).toBe("Server configuration error.");
  });

  it.each(["COA", "Admin", "SK_Chairperson", "SK_Treasurer"])(
    "rejects the non-federation role %s",
    async (role) => {
      mocks.profile = { role_type: role, approval_status: "approved" };

      const { status, body } = await call(validMemo);

      expect(status).toBe(403);
      expect(body.error).toContain("Only SK Federation");
      expect(mocks.inserted).toBeNull();
    },
  );

  it("rejects an unapproved federation account", async () => {
    mocks.profile = { role_type: "SK_Federation", approval_status: "pending" };

    const { status, body } = await call(validMemo);

    expect(status).toBe(403);
    expect(body.error).toContain("must be approved");
    expect(mocks.inserted).toBeNull();
  });

  it("returns 500 when the sender profile cannot be read", async () => {
    mocks.profileError = { code: "XX000" };

    const { status, body } = await call(validMemo);

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to verify memo permissions.");
  });
});

describe("POST /api/memos validation", () => {
  it("rejects a non-JSON body", async () => {
    const { status, body } = await call("not json");

    expect(status).toBe(400);
    expect(body.error).toContain("valid JSON");
  });

  it.each([
    ["", "A subject is required."],
    ["x".repeat(201), "Subject must be 200 characters or fewer."],
  ])("rejects the subject %s", async (subject, expected) => {
    const { status, body } = await call({ ...validMemo, subject });

    expect(status).toBe(400);
    expect(body.error).toContain(expected);
  });

  it.each([
    ["", "A message body is required."],
    ["x".repeat(5001), "Message body must be 5000 characters or fewer."],
  ])("rejects the body %s", async (bodyText, expected) => {
    const { status, body } = await call({ ...validMemo, body: bodyText });

    expect(status).toBe(400);
    expect(body.error).toContain(expected);
  });

  it("rejects an unknown priority", async () => {
    const { status, body } = await call({
      ...validMemo,
      priority: "emergency",
    });

    expect(status).toBe(400);
    expect(body.error).toBe("Select a valid memo priority.");
  });

  it("rejects an unknown audience", async () => {
    const { status, body } = await call({
      ...validMemo,
      audience: "everyone",
    });

    expect(status).toBe(400);
    expect(body.error).toBe("Select a valid audience.");
  });
});

describe("POST /api/memos persistence", () => {
  it("publishes a trimmed memo and returns it", async () => {
    const { status, body } = await call({
      subject: "  City-wide CBYDP submission  ",
      body: "  Submit your amended CBYDP by Friday.  ",
      priority: "urgent",
      audience: "chairpersons",
    });

    expect(status).toBe(201);
    expect(mocks.inserted).toEqual({
      sender_id: "fed-user-1",
      subject: "City-wide CBYDP submission",
      body: "Submit your amended CBYDP by Friday.",
      priority: "urgent",
      audience: "chairpersons",
    });
    expect(body.data).toMatchObject({
      id: MEMO_ID,
      senderId: "fed-user-1",
      subject: validMemo.subject,
      priority: "standard",
      audience: "all",
      createdAt: "2026-11-19T11:00:00.000Z",
    });
  });

  it("returns 500 when the memo insert fails", async () => {
    mocks.insertError = { code: "XX000" };

    const { status, body } = await call(validMemo);

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to publish the memo.");
  });
});
