import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildProposalUrl,
  PROPOSAL_BUCKET,
  PROPOSAL_MAX_BYTES,
} from "@/lib/bidProposal";
import {
  createSupabaseMockState,
  type SupabaseMockState,
} from "@/test-utils/supabaseMock";

const VENDOR_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";
const STORAGE_NAME = "33333333-3333-3333-3333-333333333333";
const SIGNED_URL = `https://example.supabase.co/storage/v1/object/sign/${PROPOSAL_BUCKET}/doc.pdf?token=abc`;

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

// The route caches bucket bootstrap in a module-level promise, so every request
// loads a fresh copy of the module to start from a clean cache.
function loadRoute() {
  vi.resetModules();
  return import("@/app/api/bids/proposal/route");
}

const db = () => state.current!;

// Both handlers are typed as possibly returning nothing (the auth helper's
// inferred union makes TS keep an `undefined` branch), but they always respond.
function requireResponse<T extends Response>(response: T | undefined): T {
  if (!response) throw new Error("Route handler returned no response.");
  return response;
}

beforeEach(() => {
  state.current = createSupabaseMockState();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
});

function seedProfile(
  overrides: Record<string, unknown> = {},
  userId = VENDOR_ID,
) {
  db().authUser = { id: userId };
  db().rows.profiles = [
    {
      id: userId,
      role_type: "Vendor",
      approval_status: "approved",
      ...overrides,
    },
  ];
}

function uploadRequest(file?: File) {
  const form = new FormData();
  if (file) form.append("file", file);
  return new NextRequest("http://localhost/api/bids/proposal", {
    method: "POST",
    body: form,
  });
}

async function upload(file?: File) {
  const { POST } = await loadRoute();
  const response = requireResponse(await POST(uploadRequest(file)));
  return { status: response.status, body: await response.json() };
}

function proposalFile(name = "bid.pdf", type = "application/pdf") {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

function viewRequest(path: string | null) {
  const url = new URL("http://localhost/api/bids/proposal");
  if (path !== null) url.searchParams.set("path", path);
  return new NextRequest(url, { method: "GET" });
}

async function view(path: string | null) {
  const { GET } = await loadRoute();
  const response = requireResponse(await GET(viewRequest(path)));
  return {
    status: response.status,
    location: response.headers.get("location"),
    body: response.status === 307 ? null : await response.json(),
  };
}

describe("POST /api/bids/proposal configuration and permissions", () => {
  it("returns 500 when Supabase configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { status, body } = await upload(proposalFile());

    expect(status).toBe(500);
    expect(body.error).toBe("Server configuration error.");
  });

  it("returns 401 without a session", async () => {
    const { status, body } = await upload(proposalFile());

    expect(status).toBe(401);
    expect(body.error).toContain("Unauthenticated");
  });

  it("returns 401 for a client-side auth error", async () => {
    db().authError = { status: 403 };

    const { status } = await upload(proposalFile());

    expect(status).toBe(401);
  });

  it("returns 500 when the auth service is unavailable", async () => {
    db().authError = { status: 503 };

    const { status, body } = await upload(proposalFile());

    expect(status).toBe(500);
    expect(body.error).toBe("Authentication service unavailable.");
  });

  it("returns 500 when the profile lookup fails", async () => {
    db().authUser = { id: VENDOR_ID };
    db().errors["profiles:select"] = { code: "XX000" };

    const { status, body } = await upload(proposalFile());

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to verify bidder permissions.");
  });

  it("returns 403 for a non-vendor account", async () => {
    seedProfile({ role_type: "SK_Treasurer" });

    const { status, body } = await upload(proposalFile());

    expect(status).toBe(403);
    expect(body.error).toContain("Only registered vendors");
  });

  it("returns 403 for a vendor that is not approved", async () => {
    seedProfile({ approval_status: "pending" });

    const { status, body } = await upload(proposalFile());

    expect(status).toBe(403);
    expect(body.error).toContain("pending administrator approval");
    expect(db().storage.uploads).toEqual([]);
  });
});

describe("POST /api/bids/proposal validation", () => {
  beforeEach(() => seedProfile());

  it("returns 400 when the body is not multipart form data", async () => {
    const { POST } = await loadRoute();
    const response = requireResponse(
      await POST(
        new NextRequest("http://localhost/api/bids/proposal", {
          method: "POST",
          body: JSON.stringify({ file: "nope" }),
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(
      "Request body must be multipart form data.",
    );
  });

  it("returns 400 when no file field is present", async () => {
    const { status, body } = await upload();

    expect(status).toBe(400);
    expect(body.error).toBe("A proposal file is required.");
  });

  it("returns 400 when the body carries a non-file field", async () => {
    const { POST } = await loadRoute();
    const form = new FormData();
    form.append("file", "just a string");
    const response = requireResponse(
      await POST(
        new NextRequest("http://localhost/api/bids/proposal", {
          method: "POST",
          body: form,
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("A proposal file is required.");
  });

  it("returns 400 for an empty file", async () => {
    const { status, body } = await upload(
      new File([], "empty.pdf", { type: "application/pdf" }),
    );

    expect(status).toBe(400);
    expect(body.error).toBe("The proposal file is empty.");
  });

  it("returns 400 for a file over the size limit", async () => {
    const oversized = new File(
      [new Uint8Array(PROPOSAL_MAX_BYTES + 1)],
      "huge.pdf",
      { type: "application/pdf" },
    );

    const { status, body } = await upload(oversized);

    expect(status).toBe(400);
    expect(body.error).toBe("Proposal file must be 10 MB or smaller.");
  });

  it("returns 400 for an unsupported file type", async () => {
    const { status, body } = await upload(
      proposalFile("notes.txt", "text/plain"),
    );

    expect(status).toBe(400);
    expect(body.error).toBe(
      "Invalid file type. Upload a PDF, DOC, or DOCX document.",
    );
    expect(db().storage.uploads).toEqual([]);
  });
});

describe("POST /api/bids/proposal storage", () => {
  beforeEach(() => seedProfile());

  it("creates the private proposal bucket on first use", async () => {
    const { status } = await upload(proposalFile());

    expect(status).toBe(201);
    expect(db().storage.createdBuckets).toEqual([
      {
        name: PROPOSAL_BUCKET,
        options: expect.objectContaining({
          public: false,
          fileSizeLimit: PROPOSAL_MAX_BYTES,
        }),
      },
    ]);
  });

  it("skips bucket creation when the bucket already exists", async () => {
    db().storage.buckets = [PROPOSAL_BUCKET];

    const { status } = await upload(proposalFile());

    expect(status).toBe(201);
    expect(db().storage.createdBuckets).toEqual([]);
  });

  it("returns 500 when the bucket cannot be created", async () => {
    db().storage.createBucketError = { message: "permission denied" };

    const { status, body } = await upload(proposalFile());

    expect(status).toBe(500);
    expect(body.error).toBe("Internal server error.");
    expect(db().storage.uploads).toEqual([]);
  });

  it("uploads the document and returns its app URL", async () => {
    const file = proposalFile("Bid Proposal (final).pdf");

    const { status, body } = await upload(file);

    expect(status).toBe(201);
    const path = body.data.path as string;
    expect(path).toMatch(
      new RegExp(`^${VENDOR_ID}/[0-9a-f-]{36}-Bid-Proposal-final-\\.pdf$`, "i"),
    );
    expect(body.data.url).toBe(buildProposalUrl(path));

    const uploadEntry = db().storage.uploads[0];
    expect(uploadEntry.bucket).toBe(PROPOSAL_BUCKET);
    expect(uploadEntry.path).toBe(path);
    expect(uploadEntry.file).toMatchObject({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    expect(uploadEntry.options).toEqual({
      contentType: "application/pdf",
      upsert: false,
    });
  });

  it("scopes the storage path under the uploader", async () => {
    const { body } = await upload(proposalFile());

    expect((body.data.path as string).startsWith(`${VENDOR_ID}/`)).toBe(true);
  });

  it("returns 500 when the upload fails", async () => {
    db().storage.uploadError = { message: "quota exceeded" };

    const { status, body } = await upload(proposalFile());

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to upload the proposal document.");
  });
});

describe("GET /api/bids/proposal", () => {
  const ownerPath = `${VENDOR_ID}/${STORAGE_NAME}-bid.pdf`;
  const otherPath = `${OTHER_ID}/${STORAGE_NAME}-bid.pdf`;

  it("returns 401 without a session", async () => {
    const { status, body } = await view(ownerPath);

    expect(status).toBe(401);
    expect(body.error).toContain("Unauthenticated");
  });

  it("returns 400 when the path parameter is missing", async () => {
    seedProfile();

    const { status, body } = await view(null);

    expect(status).toBe(400);
    expect(body.error).toBe("Invalid proposal reference.");
  });

  it("returns 400 for a path outside the storage layout", async () => {
    seedProfile();

    const { status, body } = await view("../../etc/passwd");

    expect(status).toBe(400);
    expect(body.error).toBe("Invalid proposal reference.");
  });

  it("returns 500 when the profile lookup fails", async () => {
    db().authUser = { id: VENDOR_ID };
    db().errors["profiles:select"] = { code: "XX000" };

    const { status, body } = await view(ownerPath);

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to verify document permissions.");
  });

  it("returns 403 when the caller has no registered role", async () => {
    db().authUser = { id: VENDOR_ID };
    db().rows.profiles = [
      { id: VENDOR_ID, role_type: null, approval_status: "approved" },
    ];

    const { status, body } = await view(ownerPath);

    expect(status).toBe(403);
    expect(body.error).toBe("Forbidden. A registered profile is required.");
  });

  it("returns 403 when a vendor requests another vendor's document", async () => {
    seedProfile();

    const { status, body } = await view(otherPath);

    expect(status).toBe(403);
    expect(body.error).toBe(
      "Forbidden. You may not view this proposal document.",
    );
    expect(db().storage.signedUrlRequests).toEqual([]);
  });

  it("returns 403 when a reviewer is not approved", async () => {
    seedProfile({ role_type: "COA", approval_status: "pending" });

    const { status, body } = await view(otherPath);

    expect(status).toBe(403);
    expect(body.error).toBe(
      "Forbidden. You may not view this proposal document.",
    );
  });

  it("lets the owner view their own document", async () => {
    seedProfile();
    db().storage.signedUrls[ownerPath] = SIGNED_URL;

    const { status, location } = await view(ownerPath);

    expect(status).toBe(307);
    expect(location).toBe(SIGNED_URL);
    expect(db().storage.signedUrlRequests).toEqual([
      { bucket: PROPOSAL_BUCKET, path: ownerPath, expiresIn: 600 },
    ]);
  });

  it("lets an approved reviewer view any document", async () => {
    seedProfile({ role_type: "COA" }, OTHER_ID);
    db().storage.signedUrls[otherPath] = SIGNED_URL;

    const { status, location } = await view(otherPath);

    expect(status).toBe(307);
    expect(location).toBe(SIGNED_URL);
  });

  it("returns 404 when storage cannot sign the URL", async () => {
    seedProfile();
    db().storage.signedUrlError = { message: "object not found" };

    const { status, body } = await view(ownerPath);

    expect(status).toBe(404);
    expect(body.error).toBe("Proposal document was not found.");
  });

  it("returns 404 when storage returns no signed URL", async () => {
    seedProfile();

    const { status, body } = await view(ownerPath);

    expect(status).toBe(404);
    expect(body.error).toBe("Proposal document was not found.");
  });
});
