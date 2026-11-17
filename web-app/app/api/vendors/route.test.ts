import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseMockState,
  type SupabaseMockState,
} from "@/test-utils/supabaseMock";

const state = vi.hoisted(() => ({
  current: null as SupabaseMockState | null,
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

import { POST } from "@/app/api/vendors/route";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const db = () => state.current!;

function request(body: unknown) {
  return new NextRequest("http://localhost/api/vendors", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function call(body: unknown) {
  const response = await POST(request(body));
  return { status: response.status, body: await response.json() };
}

function seedNewVendorUser() {
  db().authUser = {
    id: USER_ID,
    email: "acme@example.com",
    user_metadata: { username: "acme", full_name: "Acme Trading" },
  };
}

beforeEach(() => {
  state.current = createSupabaseMockState();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
});

describe("POST /api/vendors configuration and authentication", () => {
  it("returns 500 when Supabase configuration is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const { status, body } = await call({ company_name: "Acme Trading" });

    expect(status).toBe(500);
    expect(body.error).toBe("Server configuration error.");
  });

  it("returns 401 without a session", async () => {
    const { status, body } = await call({ company_name: "Acme Trading" });

    expect(status).toBe(401);
    expect(body.error).toContain("Unauthenticated");
  });

  it("returns 401 for an expired session", async () => {
    db().authError = { status: 401 };

    const { status } = await call({ company_name: "Acme Trading" });

    expect(status).toBe(401);
  });

  it("returns 500 when the auth service is unavailable", async () => {
    db().authError = { status: 502 };

    const { status, body } = await call({ company_name: "Acme Trading" });

    expect(status).toBe(500);
    expect(body.error).toBe("Authentication service unavailable.");
  });
});

describe("POST /api/vendors body validation", () => {
  beforeEach(seedNewVendorUser);

  it("rejects malformed JSON", async () => {
    const { status, body } = await call("{oops");

    expect(status).toBe(400);
    expect(body.error).toContain("valid JSON");
  });

  it("rejects a non-object body", async () => {
    const { status, body } = await call("[1,2,3]");

    expect(status).toBe(400);
    expect(body.error).toContain("JSON object");
  });

  it.each([[""], [" "], ["A"], ["x".repeat(121)]])(
    "rejects the invalid company name %j",
    async (companyName) => {
      const { status, body } = await call({ company_name: companyName });

      expect(status).toBe(400);
      expect(body.error).toContain("company_name");
    },
  );

  it("rejects an oversized username", async () => {
    const { status, body } = await call({
      company_name: "Acme Trading",
      username: "u".repeat(61),
    });

    expect(status).toBe(400);
    expect(body.error).toContain("username");
  });
});

describe("POST /api/vendors account state", () => {
  beforeEach(seedNewVendorUser);

  it("returns 500 when the profile lookup fails", async () => {
    db().errors["profiles:select"] = { code: "XX000" };

    const { status, body } = await call({ company_name: "Acme Trading" });

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to verify account state.");
  });

  it.each(["SK_Chairperson", "SK_Treasurer", "Admin"])(
    "returns 409 for an account already registered as %s",
    async (role) => {
      db().rows.profiles = [
        { id: USER_ID, role_type: role, approval_status: "approved" },
      ];

      const { status, body } = await call({ company_name: "Acme Trading" });

      expect(status).toBe(409);
      expect(body.error).toContain(`already registered as ${role}`);
      expect(db().upserted).toEqual([]);
    },
  );

  it.each(["Vendor", "pending"])(
    "allows an incomplete %s profile to finish registration",
    async (role) => {
      db().rows.profiles = [
        { id: USER_ID, role_type: role, approval_status: "pending" },
      ];

      const { status } = await call({ company_name: "Acme Trading" });

      expect(status).toBe(201);
    },
  );
});

describe("POST /api/vendors profile persistence", () => {
  beforeEach(seedNewVendorUser);

  it("creates a pending vendor profile with metadata fallbacks", async () => {
    db().authUser = {
      id: USER_ID,
      email: "owner@acme.example",
      user_metadata: {
        avatar_url: "https://cdn.example/logo.png",
        full_name: "Acme Trading Co.",
      },
    };

    const { status, body } = await call({
      company_name: "  Acme Trading  ",
      username: "  acme-ph  ",
    });

    expect(status).toBe(201);
    expect(body.data).toMatchObject({
      company_name: "Acme Trading",
      approval_status: "pending",
    });

    const profile = db().inserted.find((entry) => entry.table === "profiles");
    expect(profile?.rows[0]).toEqual({
      id: USER_ID,
      email: "owner@acme.example",
      username: "acme-ph",
      full_name: "Acme Trading Co.",
      role_type: "Vendor",
      barangay: "N/A",
      approval_status: "pending",
      avatar_url: "https://cdn.example/logo.png",
    });

    const vendor = db().upserted.find((entry) => entry.table === "vendors");
    expect(vendor?.row).toEqual({ id: USER_ID, company_name: "Acme Trading" });
  });

  it("falls back to the email prefix and company name", async () => {
    db().authUser = { id: USER_ID, email: "hello@acme.example" };

    await call({ company_name: "Acme Trading" });

    const profile = db().inserted.find((entry) => entry.table === "profiles");
    expect(profile?.rows[0]).toMatchObject({
      username: "hello",
      full_name: "Acme Trading",
      avatar_url: null,
    });
  });

  it("falls back to a generated username when no email exists", async () => {
    db().authUser = { id: USER_ID };

    await call({ company_name: "Acme Trading" });

    const profile = db().inserted.find((entry) => entry.table === "profiles");
    expect(profile?.rows[0].username).toBe(`vendor-${USER_ID.slice(0, 8)}`);
  });

  it("returns 409 when the profile insert races an existing row", async () => {
    db().errors["profiles:insert"] = { code: "23505" };

    const { status, body } = await call({ company_name: "Acme Trading" });

    expect(status).toBe(409);
    expect(body.error).toContain("already been registered");
    expect(db().upserted).toEqual([]);
  });

  it("returns 500 when the profile insert fails", async () => {
    db().errors["profiles:insert"] = { code: "XX000" };

    const { status, body } = await call({ company_name: "Acme Trading" });

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to save vendor profile.");
  });

  it("updates an existing incomplete profile instead of inserting", async () => {
    db().rows.profiles = [
      { id: USER_ID, role_type: "pending", approval_status: "approved" },
    ];

    const { status, body } = await call({ company_name: "Acme Trading" });

    expect(status).toBe(201);
    expect(body.data).toMatchObject({ approval_status: "approved" });
    expect(db().inserted).toEqual([]);
    expect(db().updated).toEqual([
      {
        table: "profiles",
        patch: {
          username: "acme",
          full_name: "Acme Trading",
          avatar_url: null,
          role_type: "Vendor",
          barangay: "N/A",
        },
      },
    ]);
  });

  it("returns 500 when the profile update fails", async () => {
    db().rows.profiles = [{ id: USER_ID, role_type: "pending" }];
    db().errors["profiles:update"] = { code: "XX000" };

    const { status, body } = await call({ company_name: "Acme Trading" });

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to save vendor profile.");
  });

  it("returns 500 when the vendor company cannot be saved", async () => {
    db().errors["vendors:upsert"] = { code: "XX000" };

    const { status, body } = await call({ company_name: "Acme Trading" });

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to save vendor company.");
  });
});
