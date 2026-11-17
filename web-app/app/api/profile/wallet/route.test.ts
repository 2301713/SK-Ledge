import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAddress } from "viem";
import {
  createSupabaseMockState,
  type SupabaseMockState,
} from "@/test-utils/supabaseMock";

const state = vi.hoisted(() => ({
  current: null as SupabaseMockState | null,
  verifyResult: true,
  verifyThrows: false,
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

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    verifyMessage: async () => {
      if (state.verifyThrows) throw new Error("verification blew up");
      return state.verifyResult;
    },
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

import { POST } from "@/app/api/profile/wallet/route";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const RAW_ADDRESS = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const CHECKSUM_ADDRESS = getAddress(RAW_ADDRESS);
const SIGNATURE = `0x${"ab".repeat(65)}`;
const db = () => state.current!;

function bindingMessage(timestamp: number, userId = USER_ID) {
  return [
    "SK-Ledge wallet binding",
    `User: ${userId}`,
    `Address: ${CHECKSUM_ADDRESS}`,
    `Timestamp: ${timestamp}`,
  ].join("\n");
}

function body(overrides: Record<string, unknown> = {}) {
  const timestamp = Date.now();
  return {
    address: RAW_ADDRESS,
    message: bindingMessage(timestamp),
    signature: SIGNATURE,
    timestamp,
    ...overrides,
  };
}

function request(payload: unknown) {
  return new NextRequest("http://localhost/api/profile/wallet", {
    method: "POST",
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
    headers: { "content-type": "application/json" },
  });
}

async function call(payload: unknown) {
  const response = await POST(request(payload));
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  state.current = createSupabaseMockState();
  state.verifyResult = true;
  state.verifyThrows = false;
  state.current.authUser = { id: USER_ID };
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
});

describe("POST /api/profile/wallet configuration and authentication", () => {
  it("returns 500 when Supabase configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { status, body: responseBody } = await call(body());

    expect(status).toBe(500);
    expect(responseBody.error).toBe("Server configuration error.");
  });

  it("returns 401 without a session", async () => {
    db().authUser = null;

    const { status } = await call(body());

    expect(status).toBe(401);
  });

  it("returns 401 when the auth lookup errors", async () => {
    db().authError = { status: 400 };

    const { status } = await call(body());

    expect(status).toBe(401);
  });
});

describe("POST /api/profile/wallet input validation", () => {
  it("rejects malformed JSON", async () => {
    const { status, body: responseBody } = await call("{");

    expect(status).toBe(400);
    expect(responseBody.error).toContain("valid JSON");
  });

  it.each([
    ["an array", "[1,2]"],
    ["null", "null"],
  ])("rejects %s as the body", async (_label, payload) => {
    const { status, body: responseBody } = await call(payload);

    expect(status).toBe(400);
    expect(responseBody.error).toContain("JSON object");
  });

  it.each([
    ["a non-address", { address: "not-an-address" }],
    ["a non-string message", { message: 42 }],
    ["a short signature", { signature: "0xdeadbeef" }],
    ["a non-integer timestamp", { timestamp: 1.5 }],
    ["a string timestamp", { timestamp: String(Date.now()) }],
  ])("rejects %s", async (_label, override) => {
    const { status, body: responseBody } = await call(body(override));

    expect(status).toBe(400);
    expect(responseBody.error).toBe("Invalid wallet binding request.");
  });

  it("rejects a stale timestamp", async () => {
    const timestamp = Date.now() - 6 * 60 * 1000;

    const { status, body: responseBody } = await call(
      body({ timestamp, message: bindingMessage(timestamp) }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toContain("expired");
  });

  it("rejects a message signed for another user", async () => {
    const timestamp = Date.now();

    const { status, body: responseBody } = await call(
      body({
        timestamp,
        message: bindingMessage(
          timestamp,
          "22222222-2222-2222-2222-222222222222",
        ),
      }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toBe("Wallet binding message is invalid.");
    expect(db().updated).toEqual([]);
  });

  it("rejects a message containing a different address", async () => {
    const timestamp = Date.now();
    const otherMessage = bindingMessage(timestamp).replace(
      CHECKSUM_ADDRESS,
      getAddress("0x2222222222222222222222222222222222222222"),
    );

    const { status, body: responseBody } = await call(
      body({ timestamp, message: otherMessage }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toBe("Wallet binding message is invalid.");
  });
});

describe("POST /api/profile/wallet signature verification", () => {
  it("rejects an invalid signature", async () => {
    state.verifyResult = false;

    const { status, body: responseBody } = await call(body());

    expect(status).toBe(400);
    expect(responseBody.error).toBe("Wallet signature could not be verified.");
    expect(db().updated).toEqual([]);
  });

  it("returns 400 when signature verification throws", async () => {
    state.verifyThrows = true;

    const { status, body: responseBody } = await call(body());

    expect(status).toBe(400);
    expect(responseBody.error).toBe("Wallet signature could not be verified.");
  });
});

describe("POST /api/profile/wallet persistence", () => {
  it("returns 409 when the wallet is bound to another profile", async () => {
    db().errors["profiles:update"] = { code: "23505" };

    const { status, body: responseBody } = await call(body());

    expect(status).toBe(409);
    expect(responseBody.error).toContain("already bound");
  });

  it("returns 500 when the profile update fails", async () => {
    db().errors["profiles:update"] = { code: "XX000" };

    const { status, body: responseBody } = await call(body());

    expect(status).toBe(500);
    expect(responseBody.error).toBe("Failed to save wallet binding.");
  });

  it("stores the checksummed address for the signed-in user", async () => {
    const { status, body: responseBody } = await call(body());

    expect(status).toBe(200);
    expect(responseBody.wallet_address).toBe(CHECKSUM_ADDRESS);
    expect(db().updated).toEqual([
      {
        table: "profiles",
        patch: { wallet_address: CHECKSUM_ADDRESS },
      },
    ]);
  });
});
