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
  uploadError: null as { message: string } | null,
  uploads: [] as {
    bucket: string;
    path: string;
    bytes: number;
    contentType: unknown;
    upsert: unknown;
  }[],
  removals: [] as string[],
  bucketExists: true,
  bucketCreates: 0,
}));

vi.mock("@supabase/supabase-js", () => {
  const profileBuilder = {
    select: () => profileBuilder,
    eq: () => profileBuilder,
    maybeSingle: async () => ({
      data: mocks.profile,
      error: mocks.profileError,
    }),
  };

  const documentsBuilder = {
    insert: (payload: Record<string, unknown>) => {
      mocks.inserted = payload;
      return documentsBuilder;
    },
    select: () => documentsBuilder,
    single: async () => ({
      data: mocks.insertResult,
      error: mocks.insertError,
    }),
  };

  const makeClient = () => ({
    from: (table: string) =>
      table === "profiles" ? profileBuilder : documentsBuilder,
    storage: {
      getBucket: async () => ({
        data: mocks.bucketExists ? { name: "receipts" } : null,
        error: null,
      }),
      createBucket: async () => {
        mocks.bucketCreates += 1;
        return { error: null };
      },
      from: (bucket: string) => ({
        upload: async (
          path: string,
          bytes: Uint8Array,
          options: { contentType?: unknown; upsert?: unknown },
        ) => {
          mocks.uploads.push({
            bucket,
            path,
            bytes: bytes.byteLength,
            contentType: options.contentType,
            upsert: options.upsert,
          });
          return { data: { path }, error: mocks.uploadError };
        },
        remove: async (paths: string[]) => {
          mocks.removals.push(...paths);
          return { data: [], error: null };
        },
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

import { POST } from "@/app/api/documents/route";

const CONTRACT = "0xAFDF26a80aE1D87bc26d5902287108587A8eD4D6";
const TX_HASH = `0x${"a".repeat(64)}`;
const EXPENSE_ID = "3f6d6f5e-2b4a-4c8e-9f10-1234567890ab";

function documentFile(
  contents: BlobPart[] = ["receipt bytes"],
  name = "receipt.pdf",
  type = "application/pdf",
) {
  return new File(contents, name, { type });
}

function uploadForm(
  overrides: Record<string, string> = {},
  file: File | null = documentFile(),
) {
  const form = new FormData();
  if (file) {
    form.append("file", file);
  }
  for (const [key, value] of Object.entries(overrides)) {
    form.append(key, value);
  }
  return form;
}

async function call(form: FormData) {
  const response = await POST(
    new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: form,
    }),
  );
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("NEXT_PUBLIC_CONTRACT_ADDRESS", CONTRACT);

  mocks.currentUser = { id: "user-1" };
  mocks.authError = null;
  mocks.profile = { role_type: "SK_Chairperson", approval_status: "approved" };
  mocks.profileError = null;
  mocks.inserted = null;
  mocks.insertError = null;
  mocks.uploadError = null;
  mocks.uploads = [];
  mocks.removals = [];
  mocks.bucketExists = true;
  mocks.bucketCreates = 0;
  mocks.insertResult = {
    id: "4a0e1f2d-1111-4222-8333-444455556666",
    file_name: "receipt.pdf",
    mime_type: "application/pdf",
    size_bytes: 13,
    sha256: "b".repeat(64),
    document_kind: "receipt",
    record_type: null,
    blockchain_tx_hash: null,
    blockchain_record_id: null,
    expense_id: null,
    created_at: "2026-11-19T08:00:00.000Z",
  };
});

describe("POST /api/documents auth and configuration", () => {
  it("requires a session", async () => {
    mocks.currentUser = null;

    const { status, body } = await call(uploadForm());

    expect(status).toBe(401);
    expect(body.error).toContain("Unauthenticated");
    expect(mocks.uploads).toHaveLength(0);
  });

  it("returns 500 when Supabase configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { status, body } = await call(uploadForm());

    expect(status).toBe(500);
    expect(body.error).toBe("Server configuration error.");
  });

  it("returns 500 when the contract address is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONTRACT_ADDRESS", "");

    const { status, body } = await call(uploadForm());

    expect(status).toBe(500);
    expect(body.error).toBe("Server configuration error.");
  });
});

describe("POST /api/documents permissions", () => {
  it.each(["COA", "SK_Federation", "Admin"])(
    "rejects the non-upload role %s",
    async (role) => {
      mocks.profile = { role_type: role, approval_status: "approved" };

      const { status, body } = await call(uploadForm());

      expect(status).toBe(403);
      expect(body.error).toContain("Only SK officials");
      expect(mocks.uploads).toHaveLength(0);
    },
  );

  it("rejects an unapproved SK official", async () => {
    mocks.profile = {
      role_type: "SK_Treasurer",
      approval_status: "pending",
    };

    const { status, body } = await call(uploadForm());

    expect(status).toBe(403);
    expect(body.error).toContain("must be approved");
    expect(mocks.uploads).toHaveLength(0);
  });
});

describe("POST /api/documents validation", () => {
  it("requires a file", async () => {
    const { status, body } = await call(uploadForm({}, null));

    expect(status).toBe(400);
    expect(body.error).toContain("document file is required");
  });

  it("rejects an unsupported file type", async () => {
    const { status, body } = await call(
      uploadForm({}, documentFile(["hello"], "notes.txt", "text/plain")),
    );

    expect(status).toBe(400);
    expect(body.error).toContain("PDF, JPEG, PNG, or WebP");
  });

  it("rejects an empty file", async () => {
    const { status, body } = await call(
      uploadForm({}, documentFile([], "empty.pdf")),
    );

    expect(status).toBe(400);
    expect(body.error).toContain("is empty");
  });

  it("rejects an unknown document kind", async () => {
    const { status, body } = await call(
      uploadForm({ document_kind: "blueprint" }),
    );

    expect(status).toBe(400);
    expect(body.error).toBe("Invalid document kind.");
    expect(mocks.inserted).toBeNull();
  });

  it("rejects an unknown record type", async () => {
    const { status, body } = await call(
      uploadForm({ document_kind: "receipt", record_type: "payroll" }),
    );

    expect(status).toBe(400);
    expect(body.error).toBe("Invalid record type.");
  });

  it("rejects a malformed transaction hash", async () => {
    const { status, body } = await call(
      uploadForm({
        document_kind: "receipt",
        record_type: "expense",
        blockchain_tx_hash: "0x1234",
        contract_address: CONTRACT,
      }),
    );

    expect(status).toBe(400);
    expect(body.error).toBe("Invalid blockchain transaction hash.");
  });

  it("rejects a transaction hash from a different deployment", async () => {
    const { status, body } = await call(
      uploadForm({
        document_kind: "receipt",
        record_type: "expense",
        blockchain_tx_hash: TX_HASH,
        contract_address: "0x0000000000000000000000000000000000000001",
      }),
    );

    expect(status).toBe(400);
    expect(body.error).toContain("Contract address does not match");
    expect(mocks.uploads).toHaveLength(0);
  });

  it("rejects a malformed expense reference", async () => {
    const { status, body } = await call(
      uploadForm({ document_kind: "receipt", expense_id: "expense-1" }),
    );

    expect(status).toBe(400);
    expect(body.error).toBe("Invalid expense reference.");
  });

  it("rejects a non-positive blockchain record id", async () => {
    const { status, body } = await call(
      uploadForm({ document_kind: "receipt", blockchain_record_id: "0" }),
    );

    expect(status).toBe(400);
    expect(body.error).toBe("Invalid blockchain record id.");
  });
});

describe("POST /api/documents vault uploads", () => {
  it("stores an unlinked vault receipt with a server-computed hash", async () => {
    mocks.insertResult = {
      ...mocks.insertResult,
      document_kind: "receipt",
    };

    const { status, body } = await call(
      uploadForm({ document_kind: "receipt" }),
    );

    expect(status).toBe(201);
    expect(mocks.inserted).toMatchObject({
      uploaded_by: "user-1",
      document_kind: "receipt",
      record_type: null,
      contract_address: null,
      blockchain_tx_hash: null,
      blockchain_record_id: null,
      expense_id: null,
      file_name: "receipt.pdf",
      mime_type: "application/pdf",
      size_bytes: 13,
    });
    expect(mocks.inserted?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.uploads).toHaveLength(1);
    expect(mocks.uploads[0].bucket).toBe("receipts");
    expect(mocks.uploads[0].bytes).toBe(13);
    expect(mocks.uploads[0].path).toMatch(/^user-1\/[0-9a-f-]+-receipt\.pdf$/);
    expect(mocks.uploads[0].contentType).toBe("application/pdf");
    expect(mocks.uploads[0].upsert).toBe(false);
    expect(body.data).toMatchObject({
      id: mocks.insertResult?.id,
      documentKind: "receipt",
      recordType: null,
      blockchainTxHash: null,
      url: `/api/documents/${mocks.insertResult?.id}`,
    });
  });

  it("stores an unlinked liquidation report", async () => {
    mocks.insertResult = {
      ...mocks.insertResult,
      document_kind: "liquidation_report",
      file_name: "liquidation-2026-Q1.pdf",
    };

    const { status, body } = await call(
      uploadForm(
        { document_kind: "liquidation_report" },
        documentFile(["quarterly"], "liquidation-2026-Q1.pdf"),
      ),
    );

    expect(status).toBe(201);
    expect(mocks.inserted).toMatchObject({
      document_kind: "liquidation_report",
      record_type: null,
      blockchain_tx_hash: null,
      contract_address: null,
    });
    expect(body.data.documentKind).toBe("liquidation_report");
  });

  it("defaults the document kind to receipt when omitted", async () => {
    const { status } = await call(uploadForm());

    expect(status).toBe(201);
    expect(mocks.inserted).toMatchObject({ document_kind: "receipt" });
  });
});

describe("POST /api/documents chain-linked receipts", () => {
  it("keeps the full on-chain linkage for expense receipts", async () => {
    mocks.insertResult = {
      ...mocks.insertResult,
      record_type: "expense",
      blockchain_tx_hash: TX_HASH,
      blockchain_record_id: 7,
      expense_id: EXPENSE_ID,
    };

    const { status, body } = await call(
      uploadForm({
        document_kind: "receipt",
        record_type: "expense",
        blockchain_tx_hash: TX_HASH,
        contract_address: CONTRACT.toLowerCase(),
        blockchain_record_id: "7",
        expense_id: EXPENSE_ID,
      }),
    );

    expect(status).toBe(201);
    expect(mocks.inserted).toMatchObject({
      record_type: "expense",
      blockchain_tx_hash: TX_HASH,
      contract_address: CONTRACT,
      blockchain_record_id: 7,
      expense_id: EXPENSE_ID,
    });
    expect(body.data).toMatchObject({
      recordType: "expense",
      blockchainTxHash: TX_HASH,
      blockchainRecordId: 7,
      expenseId: EXPENSE_ID,
    });
  });
});

describe("POST /api/documents failure cleanup", () => {
  it("removes the stored object when the metadata insert conflicts", async () => {
    mocks.insertError = { code: "23505" };

    const { status, body } = await call(uploadForm());

    expect(status).toBe(409);
    expect(body.error).toContain("already filed");
    expect(mocks.uploads).toHaveLength(1);
    expect(mocks.removals).toEqual([mocks.uploads[0].path]);
  });

  it("removes the stored object when the metadata insert fails", async () => {
    mocks.insertError = { code: "XX000" };

    const { status, body } = await call(uploadForm());

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to record the receipt.");
    expect(mocks.removals).toEqual([mocks.uploads[0].path]);
  });

  it("does not insert metadata when the storage upload fails", async () => {
    mocks.uploadError = { message: "storage offline" };

    const { status, body } = await call(uploadForm());

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to upload the receipt file.");
    expect(mocks.inserted).toBeNull();
    expect(mocks.removals).toHaveLength(0);
  });
});
