import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  tableData: {} as Record<string, unknown[]>,
  selects: [] as { table: string; columns: string }[],
  currentUser: null as { id: string } | null,
  profile: null as Record<string, unknown> | null,
  authError: null as { status?: number } | null,
}));

vi.mock("@supabase/supabase-js", () => {
  const makeBuilder = (table: string) => {
    const builder: Record<string, unknown> = {
      select: (columns: string) => {
        mocks.selects.push({ table, columns });
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      eq: () => builder,
      maybeSingle: async () => ({ data: mocks.profile, error: null }),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({
          data: mocks.tableData[table] ?? [],
          error: null,
        }).then(resolve),
    };
    return builder;
  };

  const makeClient = () => ({
    from: (table: string) => makeBuilder(table),
    auth: {
      getUser: async () => ({
        data: { user: mocks.currentUser },
        error: mocks.authError,
      }),
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

import { GET } from "@/app/api/records/route";

function request(query: string) {
  return new NextRequest(`http://localhost/api/records${query}`);
}

async function call(query: string) {
  const response = await GET(request(query));
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  mocks.tableData = {};
  mocks.selects = [];
  mocks.currentUser = null;
  mocks.profile = null;
  mocks.authError = null;
});

describe("GET /api/records input validation", () => {
  it("rejects an unsupported record type", async () => {
    mocks.currentUser = { id: "user-1" };

    const { status, body } = await call("?type=expenses");

    expect(status).toBe(400);
    expect(body.error).toContain("Invalid type");
  });

  it.each(["0", "abc", "501", "-1", "1.5"])(
    "rejects the invalid limit %s",
    async (limit) => {
      mocks.currentUser = { id: "user-1" };

      const { status, body } = await call(`?limit=${limit}`);

      expect(status).toBe(400);
      expect(body.error).toContain("Invalid limit");
    },
  );

  it("rejects an ambiguous barangay filter", async () => {
    mocks.currentUser = { id: "user-1" };

    const { status, body } = await call("?barangay=Poblacion");

    expect(status).toBe(400);
    expect(body.error).toContain("Invalid barangay filter");
  });

  it("requires a session for authenticated scope", async () => {
    const { status, body } = await call("");

    expect(status).toBe(401);
    expect(body.error).toContain("Unauthenticated");
  });

  it("returns 500 when Supabase configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { status, body } = await call("");

    expect(status).toBe(500);
    expect(body.error).toBe("Server configuration error.");
  });
});

describe("GET /api/records public scope", () => {
  it("selects only public columns and sorts newest first", async () => {
    mocks.tableData = {
      expenses: [
        { amount: 100, created_at: "2026-01-01T00:00:00.000Z", barangay: "Adia, Agoncillo" },
        { amount: 300, created_at: "2026-03-01T00:00:00.000Z", barangay: "Adia, Agoncillo" },
      ],
      allocations: [
        { amount: 900, created_at: "2026-02-01T00:00:00.000Z", barangay: "Adia, Agoncillo" },
      ],
      awards: [],
    };

    const { status, body } = await call("?scope=public&limit=10");

    expect(status).toBe(200);
    expect(body.meta).toMatchObject({
      count: 3,
      scope: "public",
      limit: 10,
    });
    expect(body.data.map((row: { amount: number }) => row.amount)).toEqual([
      300, 900, 100,
    ]);
    expect(body.data.map((row: { record_type: string }) => row.record_type)).toEqual([
      "expense",
      "allocation",
      "expense",
    ]);
    expect(mocks.selects).toEqual(
      expect.arrayContaining([
        { table: "allocations", columns: "amount, created_at, barangay" },
        { table: "expenses", columns: "amount, created_at, barangay" },
        { table: "awards", columns: "amount, created_at, barangay" },
      ]),
    );
  });

  it("does not require a session", async () => {
    mocks.tableData = { allocations: [], expenses: [], awards: [] };

    const { status } = await call("?scope=public");

    expect(status).toBe(200);
  });
});

describe("GET /api/records authenticated scope", () => {
  it("returns 403 when the user has no approved profile role", async () => {
    mocks.currentUser = { id: "user-1" };
    mocks.profile = null;

    // The mocked admin client returns no profile row.
    const { status, body } = await call("");

    expect(status).toBe(403);
    expect(body.error).toContain("approved user profile");
  });
});
