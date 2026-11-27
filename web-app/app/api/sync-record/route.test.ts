import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  encodeAbiParameters,
  encodeEventTopics,
  encodeFunctionData,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
} from "viem";
import { SK_LEDGE_ABI } from "@/lib/contractConfig";
import {
  createSupabaseMockState,
  type SupabaseMockState,
} from "@/test-utils/supabaseMock";

const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const OFFICIAL = "0x2222222222222222222222222222222222222222" as const;
const OTHER_ADDRESS = "0x3333333333333333333333333333333333333333" as const;
// MetaMask Delegation Manager: how smart-account wallets submit the call.
const DELEGATOR = "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3" as const;
const USER_ID = "11111111-1111-1111-1111-111111111111";
const BARANGAY = "Adia, Agoncillo";
const OTHER_BARANGAY = "Bagong Sikat, Agoncillo";
const PURPOSE = "Barangay hall repair";
const TX_HASH = `0x${"ab".repeat(32)}`;

const state = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS =
    "0x1111111111111111111111111111111111111111";
  return {
    current: null as SupabaseMockState | null,
    chain: {
      transaction: {} as Record<string, unknown>,
      receipt: {} as Record<string, unknown>,
      error: null as unknown,
    },
  };
});

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
  return {
    createServerClient: () => build(state.current!).createServerClient(),
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: () => ({
      getTransaction: async () => {
        if (state.chain.error) throw state.chain.error;
        return state.chain.transaction;
      },
      getTransactionReceipt: async () => {
        if (state.chain.error) throw state.chain.error;
        return state.chain.receipt;
      },
    }),
  };
});

import { POST } from "@/app/api/sync-record/route";

const db = () => state.current!;

type ChainOptions = {
  type?: "Expense" | "Award" | "Allocation";
  barangay?: string;
  amount?: bigint;
  purpose?: string;
  from?: `0x${string}`;
  to?: `0x${string}`;
  /** Smart-account router that submits the outer transaction. */
  routedThrough?: `0x${string}`;
  official?: `0x${string}`;
};

function buildChain(options: ChainOptions = {}) {
  const {
    type = "Expense",
    barangay = BARANGAY,
    amount = BigInt(500000),
    purpose = PURPOSE,
    from = OFFICIAL,
    to = CONTRACT,
    routedThrough,
    official = OFFICIAL,
  } = options;

  const recipient = routedThrough ?? to;

  const input = encodeFunctionData({
    abi: SK_LEDGE_ABI,
    functionName: "addRecord",
    args: [barangay, amount, purpose, type],
  });

  const topics = encodeEventTopics({
    abi: SK_LEDGE_ABI,
    eventName: "RecordAdded",
    args: { id: BigInt(1), official },
  });

  const data = encodeAbiParameters(
    [
      { type: "string" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "string" },
    ],
    [barangay, amount, BigInt(1700000000), type],
  );

  state.chain.transaction = {
    from,
    to: recipient,
    // Routed calls wrap addRecord in the router's own calldata.
    input: routedThrough ? "0x12345678" : input,
  };
  state.chain.receipt = {
    status: "success",
    from,
    to: recipient,
    logs: [{ address: to, data, topics }],
  };
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    type: "expense",
    blockchain_tx_hash: TX_HASH,
    amount: 500000,
    contract_address: CONTRACT,
    official_address: OFFICIAL,
    barangay: BARANGAY,
    purpose: PURPOSE,
    ...overrides,
  };
}

function request(
  body: unknown,
  headers: Record<string, string> = {},
  method = "POST",
) {
  return new NextRequest("http://localhost/api/sync-record", {
    method,
    body:
      method === "GET"
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

async function call(
  body: unknown,
  headers: Record<string, string> = {},
  method = "POST",
) {
  const response = await POST(request(body, headers, method));
  return { status: response.status, body: await response.json() };
}

const defaultProfile = {
  id: USER_ID,
  role_type: "SK_Treasurer",
  approval_status: "approved",
  barangay: BARANGAY,
  wallet_address: OFFICIAL,
};

beforeEach(() => {
  state.current = createSupabaseMockState();
  state.current.authUser = { id: USER_ID };
  state.current.rows.profiles = [{ ...defaultProfile }];
  state.chain.error = null;
  buildChain();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("SYNC_RECOVERY_SECRET", "");
});

describe("POST /api/sync-record configuration and authentication", () => {
  it("returns 500 when Supabase configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(500);
    expect(responseBody.error).toBe("Server configuration error.");
  });

  it("returns 401 without a session", async () => {
    db().authUser = null;

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(401);
    expect(responseBody.error).toContain("Unauthenticated");
  });

  it("returns 401 for a client-side auth error", async () => {
    db().authError = { status: 400 };

    const { status } = await call(payload());

    expect(status).toBe(401);
  });

  it("returns 500 when the auth service is unavailable", async () => {
    db().authError = { status: 503 };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(500);
    expect(responseBody.error).toBe("Authentication service unavailable.");
  });

  it("accepts the internal recovery headers in place of a session", async () => {
    vi.stubEnv("SYNC_RECOVERY_SECRET", "recovery-secret");
    db().authUser = null;

    const { status, body: responseBody } = await call(payload(), {
      "x-skledge-recovery-user-id": USER_ID,
      "x-skledge-recovery-secret": "recovery-secret",
    });

    expect(status).toBe(201);
    expect(responseBody.data.user_id).toBe(USER_ID);
  });

  it("ignores recovery headers with the wrong secret", async () => {
    vi.stubEnv("SYNC_RECOVERY_SECRET", "recovery-secret");
    db().authUser = null;

    const { status } = await call(payload(), {
      "x-skledge-recovery-user-id": USER_ID,
      "x-skledge-recovery-secret": "wrong-secret",
    });

    expect(status).toBe(401);
  });
});

describe("POST /api/sync-record profile authorization", () => {
  it("returns 500 when the profile lookup fails", async () => {
    db().errors["profiles:select"] = { code: "XX000" };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(500);
    expect(responseBody.error).toBe("Failed to verify user permissions.");
  });

  it("returns 403 when the profile is not approved", async () => {
    db().rows.profiles = [{ ...defaultProfile, approval_status: "pending" }];

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(403);
    expect(responseBody.error).toContain("approved user profile");
  });

  it("returns 403 when the profile has no role", async () => {
    db().rows.profiles = [{ ...defaultProfile, role_type: null }];

    const { status } = await call(payload());

    expect(status).toBe(403);
  });

  it("returns 403 when no wallet is bound", async () => {
    db().rows.profiles = [{ ...defaultProfile, wallet_address: null }];

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(403);
    expect(responseBody.error).toContain("Bind your blockchain wallet");
  });
});

describe("POST /api/sync-record payload validation", () => {
  it("rejects malformed JSON", async () => {
    const { status, body: responseBody } = await call("{");

    expect(status).toBe(400);
    expect(responseBody.error).toContain("valid JSON");
  });

  it.each([
    ["an array", "[1,2]"],
    ["null", "null"],
    ["a string", '"expense"'],
  ])("rejects %s as the body", async (_label, raw) => {
    const { status, body: responseBody } = await call(raw);

    expect(status).toBe(400);
    expect(responseBody.error).toContain("JSON object");
  });

  it("rejects an unknown record type", async () => {
    const { status, body: responseBody } = await call(payload({ type: "void" }));

    expect(status).toBe(400);
    expect(responseBody.error).toContain("Invalid record type");
  });

  it("returns 403 when the role cannot record that type", async () => {
    db().rows.profiles = [{ ...defaultProfile, role_type: "SK_Secretary" }];

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(403);
    expect(responseBody.error).toContain("SK_Secretary");
  });

  it.each([
    ["a short hash", "0x1234"],
    ["a hash without prefix", "ab".repeat(32)],
    ["a hash with non-hex characters", `0x${"zz".repeat(32)}`],
    ["a non-string hash", 42],
  ])("rejects %s", async (_label, blockchain_tx_hash) => {
    const { status, body: responseBody } = await call(
      payload({ blockchain_tx_hash }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toContain("Invalid blockchain_tx_hash");
  });

  it.each([
    ["zero", 0],
    ["negative", -5],
    ["fractional", 1.5],
    ["a string", "500000"],
    ["unsafe", Number.MAX_SAFE_INTEGER + 2],
    ["missing", undefined],
  ])("rejects an amount that is %s", async (_label, amount) => {
    const { status, body: responseBody } = await call(payload({ amount }));

    expect(status).toBe(400);
    expect(responseBody.error).toContain("Invalid amount");
  });

  it("rejects a malformed contract address", async () => {
    const { status, body: responseBody } = await call(
      payload({ contract_address: "0xnot-contract" }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toBe("Invalid contract_address format.");
  });

  it("rejects a malformed official address", async () => {
    const { status, body: responseBody } = await call(
      payload({ official_address: "0xnot-official" }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toBe("Invalid official_address format.");
  });

  it("returns 403 when the signing wallet is not the bound wallet", async () => {
    const { status, body: responseBody } = await call(
      payload({ official_address: OTHER_ADDRESS }),
    );

    expect(status).toBe(403);
    expect(responseBody.error).toContain("signing wallet");
  });

  it("rejects an over-long barangay", async () => {
    const { status, body: responseBody } = await call(
      payload({ barangay: "x".repeat(121) }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toContain("Invalid barangay");
  });

  it("rejects a barangay outside the canonical registry", async () => {
    const { status, body: responseBody } = await call(
      payload({ barangay: "Atlantis" }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toContain("Invalid or ambiguous barangay");
  });

  it("returns 403 when the barangay differs from the profile", async () => {
    const { status, body: responseBody } = await call(
      payload({ barangay: OTHER_BARANGAY }),
    );

    expect(status).toBe(403);
    expect(responseBody.error).toContain("does not match your approved profile");
  });

  it.each([
    ["empty", ""],
    ["whitespace only", "   "],
    ["over 1000 characters", "x".repeat(1001)],
  ])("rejects a purpose that is %s", async (_label, purpose) => {
    const { status, body: responseBody } = await call(payload({ purpose }));

    expect(status).toBe(400);
    expect(responseBody.error).toContain("Invalid purpose");
  });

  it("rejects project_id on an allocation record", async () => {
    const { status, body: responseBody } = await call(
      payload({ type: "allocation", project_id: "project-1" }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toContain(
      "only valid for award and expense records",
    );
  });

  it("rejects a non-string expense category", async () => {
    const { status, body: responseBody } = await call(
      payload({ category: 42 }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toContain("Invalid category");
  });

  it("requires project_id on award records", async () => {
    const { status, body: responseBody } = await call(
      payload({ type: "award" }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toContain("project_id is required");
  });

  it("rejects a contract address that differs from the configured target", async () => {
    const { status, body: responseBody } = await call(
      payload({ contract_address: OTHER_ADDRESS }),
    );

    expect(status).toBe(400);
    expect(responseBody.error).toContain("does not match system target");
  });

  it("accepts a lowercase transaction hash and stores it lowercased", async () => {
    const { status, body: responseBody } = await call(
      payload({ blockchain_tx_hash: TX_HASH.toUpperCase().replace("0X", "0x") }),
    );

    expect(status).toBe(201);
    expect(responseBody.data.blockchain_tx_hash).toBe(TX_HASH);
  });
});

describe("POST /api/sync-record award project lookup", () => {
  const award = () =>
    payload({ type: "award", project_id: "project-1" });

  beforeEach(() => {
    buildChain({ type: "Award" });
  });

  it("returns 500 when the project lookup fails", async () => {
    db().errors["projects:select"] = { code: "XX000" };

    const { status, body: responseBody } = await call(award());

    expect(status).toBe(500);
    expect(responseBody.error).toBe("Failed to verify linked project.");
  });

  it("returns 400 when the project does not exist", async () => {
    const { status, body: responseBody } = await call(award());

    expect(status).toBe(400);
    expect(responseBody.error).toBe("Linked project was not found.");
  });

  it("records the award when the project exists", async () => {
    db().rows.projects = [{ id: "project-1" }];

    const { status, body: responseBody } = await call(award());

    expect(status).toBe(201);
    expect(responseBody.data.project_id).toBe("project-1");
    expect(responseBody.data.blockchain_tx_hash).toBe(TX_HASH);
  });
});

describe("POST /api/sync-record expense project link", () => {
  it("records an expense against a project in the same barangay", async () => {
    db().rows.projects = [
      { id: "project-1", barangay: BARANGAY, category: "Education" },
    ];

    const { status, body: responseBody } = await call(
      payload({ project_id: "project-1" }),
    );

    expect(status).toBe(201);
    expect(responseBody.data.project_id).toBe("project-1");
    expect(responseBody.data.category).toBe("Education");
  });

  it("keeps an explicitly submitted category", async () => {
    db().rows.projects = [
      { id: "project-1", barangay: BARANGAY, category: "Education" },
    ];

    const { status, body: responseBody } = await call(
      payload({ project_id: "project-1", category: "Health" }),
    );

    expect(status).toBe(201);
    expect(responseBody.data.category).toBe("Health");
  });

  it("rejects a project from another barangay", async () => {
    db().rows.projects = [
      {
        id: "project-1",
        barangay: OTHER_BARANGAY,
        category: "Education",
      },
    ];

    const { status, body: responseBody } = await call(
      payload({ project_id: "project-1" }),
    );

    expect(status).toBe(403);
    expect(responseBody.error).toContain("different barangay");
  });
});

describe("POST /api/sync-record blockchain verification", () => {
  it("returns 422 when the transaction is not found", async () => {
    state.chain.error = Object.create(TransactionNotFoundError.prototype);

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(422);
    expect(responseBody.error).toContain("not found on Sepolia");
  });

  it("returns 422 when the receipt is not found", async () => {
    state.chain.error = Object.create(
      TransactionReceiptNotFoundError.prototype,
    );

    const { status } = await call(payload());

    expect(status).toBe(422);
  });

  it("returns 503 for other RPC failures", async () => {
    state.chain.error = new Error("rpc down");

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(503);
    expect(responseBody.error).toBe(
      "Blockchain verification service unavailable.",
    );
  });

  it("returns 422 when the transaction reverted", async () => {
    state.chain.receipt = { ...state.chain.receipt, status: "reverted" };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(422);
    expect(responseBody.error).toContain("failed or has not been confirmed");
  });

  it("returns 422 when the transaction targets another contract", async () => {
    buildChain({ to: OTHER_ADDRESS });

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(422);
    expect(responseBody.error).toContain("recipient does not match");
  });

  it("accepts an award routed through MetaMask's delegation manager", async () => {
    buildChain({ routedThrough: DELEGATOR });

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(201);
    expect(responseBody.message).toBe(
      "Record synchronized and verified successfully.",
    );
  });

  it("rejects a routed call that does not emit the contract's RecordAdded", async () => {
    buildChain({ routedThrough: DELEGATOR });
    state.chain.receipt = {
      ...state.chain.receipt,
      logs: (state.chain.receipt.logs as { address: string }[]).map((log) => ({
        ...log,
        address: OTHER_ADDRESS,
      })),
    };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(422);
    expect(responseBody.error).toContain("RecordAdded event");
  });

  it("rejects a routed call whose on-chain amount differs", async () => {
    buildChain({ routedThrough: DELEGATOR, amount: BigInt(999) });

    const { status } = await call(payload());

    expect(status).toBe(422);
  });

  it("returns 422 when transaction and receipt senders differ", async () => {
    state.chain.receipt = { ...state.chain.receipt, from: OTHER_ADDRESS };

    const { status } = await call(payload());

    expect(status).toBe(422);
  });

  it("returns 422 when the call data cannot be decoded", async () => {
    state.chain.transaction = {
      ...state.chain.transaction,
      input: "0xdeadbeef",
    };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(422);
    expect(responseBody.error).toContain("call data");
  });

  it("returns 422 when the transaction calls another function", async () => {
    state.chain.transaction = {
      ...state.chain.transaction,
      input: encodeFunctionData({
        abi: SK_LEDGE_ABI,
        functionName: "acceptOwnership",
      }),
    };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(422);
    expect(responseBody.error).toContain("record submission function");
  });

  it("returns 422 when the on-chain amount differs from the payload", async () => {
    buildChain({ amount: BigInt(999) });

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(422);
    expect(responseBody.error).toContain("does not match the submitted record");
  });

  it("returns 422 when the on-chain record type differs", async () => {
    buildChain({ type: "Allocation" });

    const { status } = await call(payload());

    expect(status).toBe(422);
  });

  it("returns 422 when the receipt has no RecordAdded event", async () => {
    state.chain.receipt = { ...state.chain.receipt, logs: [] };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(422);
    expect(responseBody.error).toContain("RecordAdded event");
  });

  it("ignores logs emitted by other contracts", async () => {
    state.chain.receipt = {
      ...state.chain.receipt,
      logs: (state.chain.receipt.logs as { address: string }[]).map((log) => ({
        ...log,
        address: OTHER_ADDRESS,
      })),
    };

    const { status } = await call(payload());

    expect(status).toBe(422);
  });

  it("returns 422 when the event official differs from the payload", async () => {
    buildChain({ official: OTHER_ADDRESS });

    const { status } = await call(payload());

    expect(status).toBe(422);
  });
});

describe("POST /api/sync-record persistence", () => {
  it("returns 500 when the duplicate check fails", async () => {
    db().errors["expenses:select"] = { code: "XX000" };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(500);
    expect(responseBody.error).toBe(
      "Failed to check for duplicate transactions.",
    );
  });

  it("returns 409 when the transaction hash already exists", async () => {
    db().rows.expenses = [{ id: "existing", blockchain_tx_hash: TX_HASH }];

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(409);
    expect(responseBody.error).toContain("Duplicate transaction");
    expect(db().inserted).toEqual([]);
  });

  it("inserts the verified expense and returns 201", async () => {
    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(201);
    expect(responseBody.message).toBe(
      "Record synchronized and verified successfully.",
    );

    const insert = db().inserted.find((entry) => entry.table === "expenses");
    expect(insert?.rows[0]).toMatchObject({
      user_id: USER_ID,
      blockchain_tx_hash: TX_HASH,
      contract_address: CONTRACT,
      official_address: OFFICIAL,
      barangay: BARANGAY,
      amount: 500000,
      purpose: PURPOSE,
    });
    expect(typeof insert?.rows[0].created_at).toBe("string");
  });

  it("queues a recovery row when the insert fails", async () => {
    db().errors["expenses:insert"] = { code: "XX000", message: "insert boom" };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(500);
    expect(responseBody.error).toBe("Failed to insert record into database.");

    const failure = db().upserted.find(
      (entry) => entry.table === "blockchain_sync_failures",
    );
    expect(failure?.row).toMatchObject({
      user_id: USER_ID,
      record_type: "expense",
      blockchain_tx_hash: TX_HASH,
      status: "pending",
      last_error: "insert boom",
    });
  });

  it("queues a recovery row for a duplicate-key insert failure", async () => {
    db().errors["expenses:insert"] = { code: "23505", message: "duplicate key" };

    const { status } = await call(payload());

    expect(status).toBe(500);
    expect(
      db().upserted.some(
        (entry) => entry.table === "blockchain_sync_failures",
      ),
    ).toBe(true);
  });

  it("returns 409 when the insert conflict came from a concurrent duplicate", async () => {
    db().errors["expenses:insert"] = { code: "23505", message: "duplicate key" };
    db().onQuery = ({ table, operation }) => {
      if (table === "expenses" && operation === "insert") {
        db().rows.expenses = [
          { id: "concurrent", blockchain_tx_hash: TX_HASH },
        ];
      }
    };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(409);
    expect(responseBody.error).toContain("Duplicate transaction");
    expect(db().upserted).toEqual([]);
  });

  it("returns 500 when the post-conflict duplicate check fails", async () => {
    db().errors["expenses:insert"] = { code: "23505", message: "duplicate key" };
    db().onQuery = ({ table, operation, call }) => {
      if (table === "expenses" && operation === "select" && call === 2) {
        db().errors["expenses:select"] = { code: "XX000" };
      }
    };

    const { status, body: responseBody } = await call(payload());

    expect(status).toBe(500);
    expect(responseBody.error).toBe("Failed to verify duplicate transaction.");
    expect(db().upserted).toEqual([]);
  });
});
