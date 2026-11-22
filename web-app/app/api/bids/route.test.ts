import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildProposalUrl } from "@/lib/bidProposal";
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

import { POST } from "@/app/api/bids/route";

const VENDOR_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";
const PROJECT_ID = "project-1";
const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const db = () => state.current!;

const validBody = () => ({
  project_id: PROJECT_ID,
  amount_php: 1500.555,
  timeline: "30 days",
  notes: "Materials and labor",
  proposal_url: "",
});

function request(body: unknown) {
  return new NextRequest("http://localhost/api/bids", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function call(body: unknown) {
  const response = await POST(request(body));
  return { status: response.status, body: await response.json() };
}

function seedApprovedVendor() {
  db().authUser = { id: VENDOR_ID };
  db().rows.profiles = [
    {
      id: VENDOR_ID,
      role_type: "Vendor",
      approval_status: "approved",
      company_name: "Acme Trading",
    },
  ];
  db().rows.projects = [
    {
      id: PROJECT_ID,
      name: "Barangay road repair",
      budget: 5000,
      status: "Approved",
      is_open_for_bidding: true,
      bid_deadline: FUTURE,
    },
  ];
  db().rows.bids = [];
  db().insertResults.bids = { id: "bid-1", status: "pending" };
}

beforeEach(() => {
  state.current = createSupabaseMockState();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
});

describe("POST /api/bids configuration and authentication", () => {
  it("returns 500 when Supabase configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { status, body } = await call(validBody());

    expect(status).toBe(500);
    expect(body.error).toBe("Server configuration error.");
  });

  it("returns 401 when there is no session", async () => {
    const { status, body } = await call(validBody());

    expect(status).toBe(401);
    expect(body.error).toContain("Unauthenticated");
  });

  it("returns 401 for a client-side auth error", async () => {
    db().authError = { status: 403 };

    const { status } = await call(validBody());

    expect(status).toBe(401);
  });

  it("returns 500 when the auth service itself fails", async () => {
    db().authError = { status: 503 };

    const { status, body } = await call(validBody());

    expect(status).toBe(500);
    expect(body.error).toBe("Authentication service unavailable.");
  });

  it("does not read the body before authenticating", async () => {
    db().authUser = { id: VENDOR_ID };

    const { status } = await call("{not json");

    expect(status).toBe(400);
    expect(db().inserted).toEqual([]);
  });
});

describe("POST /api/bids body validation", () => {
  beforeEach(seedApprovedVendor);

  it("rejects malformed JSON", async () => {
    const { status, body } = await call("{not json");

    expect(status).toBe(400);
    expect(body.error).toContain("valid JSON");
  });

  it.each([
    ["an array", []],
    ["a string", '"bid"'],
    ["null", null],
  ])("rejects %s as the request body", async (_label, payload) => {
    const { status, body } = await call(payload);

    expect(status).toBe(400);
    expect(body.error).toContain("JSON object");
  });

  it("rejects a missing project id", async () => {
    const { status, body } = await call({ ...validBody(), project_id: "" });

    expect(status).toBe(400);
    expect(body.error).toContain("project_id");
  });

  it("rejects an oversized project id", async () => {
    const { status, body } = await call({
      ...validBody(),
      project_id: "p".repeat(129),
    });

    expect(status).toBe(400);
    expect(body.error).toContain("project_id");
  });

  it.each([["1500"], [0], [-1], [Number.NaN], [Number.POSITIVE_INFINITY]])(
    "rejects the invalid amount %s",
    async (amount) => {
      const { status, body } = await call({
        ...validBody(),
        amount_php: amount,
      });

      expect(status).toBe(400);
      expect(body.error).toContain("amount_php");
    },
  );

  it.each([[""], ["t".repeat(121)]])(
    "rejects an invalid timeline",
    async (timeline) => {
      const { status, body } = await call({ ...validBody(), timeline });

      expect(status).toBe(400);
      expect(body.error).toContain("timeline");
    },
  );

  it("rejects notes over 1000 characters", async () => {
    const { status, body } = await call({
      ...validBody(),
      notes: "n".repeat(1001),
    });

    expect(status).toBe(400);
    expect(body.error).toContain("notes");
  });

  it("rejects an oversized proposal URL", async () => {
    const { status, body } = await call({
      ...validBody(),
      proposal_url: `https://example.com/${"a".repeat(2048)}`,
    });

    expect(status).toBe(400);
    expect(body.error).toContain("too long");
  });

  it("rejects a malformed uploaded proposal reference", async () => {
    const { status, body } = await call({
      ...validBody(),
      proposal_url: "/api/bids/proposal?path=not-a-storage-path",
    });

    expect(status).toBe(400);
    expect(body.error).toContain("malformed");
  });

  it("rejects an uploaded proposal owned by another account", async () => {
    const otherPath = `${OTHER_ID}/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-proposal.pdf`;

    const { status, body } = await call({
      ...validBody(),
      proposal_url: buildProposalUrl(otherPath),
    });

    expect(status).toBe(403);
    expect(body.error).toContain("does not belong to your account");
  });

  it("rejects a non-http external proposal URL", async () => {
    const { status, body } = await call({
      ...validBody(),
      proposal_url: "ftp://example.com/proposal.pdf",
    });

    expect(status).toBe(400);
    expect(body.error).toContain("http(s)");
  });
});

describe("POST /api/bids bidder eligibility", () => {
  it("returns 500 when the profile lookup fails", async () => {
    seedApprovedVendor();
    db().errors["profiles:select"] = { code: "XX000" };

    const { status, body } = await call(validBody());

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to verify bidder permissions.");
  });

  it("rejects a non-vendor account", async () => {
    seedApprovedVendor();
    db().rows.profiles = [
      { id: VENDOR_ID, role_type: "SK_Chairperson", approval_status: "approved" },
    ];

    const { status, body } = await call(validBody());

    expect(status).toBe(403);
    expect(body.error).toContain("Only registered vendors");
  });

  it("rejects a vendor that is not approved", async () => {
    seedApprovedVendor();
    db().rows.profiles = [
      { id: VENDOR_ID, role_type: "Vendor", approval_status: "pending" },
    ];

    const { status, body } = await call(validBody());

    expect(status).toBe(403);
    expect(body.error).toContain("pending administrator approval");
  });

  it("rejects a vendor without a registered company", async () => {
    seedApprovedVendor();
    db().rows.profiles[0].company_name = null;

    const { status, body } = await call(validBody());

    expect(status).toBe(403);
    expect(body.error).toContain("Register your vendor company");
  });
});

describe("POST /api/bids project eligibility", () => {
  beforeEach(seedApprovedVendor);

  it("returns 500 when the project lookup fails", async () => {
    db().errors["projects:select"] = { code: "XX000" };

    const { status, body } = await call(validBody());

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to verify the bidding project.");
  });

  it("returns 404 when the project does not exist", async () => {
    db().rows.projects = [];

    const { status, body } = await call(validBody());

    expect(status).toBe(404);
    expect(body.error).toBe("Project was not found.");
  });

  it("returns 409 when bidding is closed on the project", async () => {
    db().rows.projects[0].is_open_for_bidding = false;

    const { status, body } = await call(validBody());

    expect(status).toBe(409);
    expect(body.error).toContain(
      "Bidding is available only after the project is approved",
    );
  });

  it.each(["Proposed", "Rejected", "Awarded", "Evaluation", "Completed"])(
    "returns 409 when the project status is %s",
    async (status) => {
      db().rows.projects[0].status = status;

      const { status: responseStatus, body } = await call(validBody());

      expect(responseStatus).toBe(409);
      expect(body.error).toBe(
        "This project has not been officially approved for bidding.",
      );
    },
  );

  it("returns 409 when an approved project has no bidding deadline", async () => {
    db().rows.projects[0].bid_deadline = null;

    const { status, body } = await call(validBody());

    expect(status).toBe(409);
    expect(body.error).toContain("does not have a valid bidding deadline");
  });

  it("returns 409 when the bid deadline has passed", async () => {
    db().rows.projects[0].bid_deadline = new Date(Date.now() - 1000).toISOString();

    const { status, body } = await call(validBody());

    expect(status).toBe(409);
    expect(body.error).toContain("deadline");
  });

  it("returns 409 when the project deadline cannot be parsed", async () => {
    db().rows.projects[0].bid_deadline = "not-a-date";

    const { status, body } = await call(validBody());

    expect(status).toBe(409);
    expect(body.error).toBe(
      "This project does not have a valid bidding deadline.",
    );
  });

  it("returns 500 when the project budget is invalid", async () => {
    db().rows.projects[0].budget = "not-a-number";

    const { status, body } = await call(validBody());

    expect(status).toBe(500);
    expect(body.error).toBe("Project budget is invalid.");
  });

  it("rejects a bid above the approved budget", async () => {
    const { status, body } = await call({
      ...validBody(),
      amount_php: 5000.01,
    });

    expect(status).toBe(400);
    expect(body.error).toContain("exceeds the approved budget");
  });

  it("returns 500 when the duplicate-bid check fails", async () => {
    db().errors["bids:select"] = { code: "XX000" };

    const { status, body } = await call(validBody());

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to check for an existing bid.");
  });

  it("returns 409 when the vendor already bid on the project", async () => {
    db().rows.bids = [{ id: "bid-existing", project_id: PROJECT_ID, vendor_id: VENDOR_ID }];

    const { status, body } = await call(validBody());

    expect(status).toBe(409);
    expect(body.error).toContain("already submitted a bid");
  });
});

describe("POST /api/bids persistence", () => {
  beforeEach(seedApprovedVendor);

  it("returns 500 and saves nothing when the insert fails", async () => {
    db().errors["bids:insert"] = { code: "XX000" };

    const { status, body } = await call(validBody());

    expect(status).toBe(500);
    expect(body.error).toBe("Failed to save bid.");
    expect(db().inserted).toEqual([]);
  });

  it("stores a pending bid with rounded amount and derived fields", async () => {
    const { status, body } = await call({
      ...validBody(),
      notes: "  ",
      proposal_url: "",
    });

    expect(status).toBe(201);
    expect(body.data).toEqual({ id: "bid-1", status: "pending" });

    const inserted = db().inserted.find((entry) => entry.table === "bids");
    expect(inserted?.rows).toHaveLength(1);
    expect(inserted?.rows[0]).toMatchObject({
      project_id: PROJECT_ID,
      vendor_id: VENDOR_ID,
      contract_title: "Barangay road repair",
      amount_php: 1500.56,
      timeline: "30 days",
      notes: null,
      proposal_url: null,
      status: "pending",
    });
    expect(typeof inserted?.rows[0].submitted_on).toBe("string");
  });

  it("keeps a proposal URL that belongs to the vendor", async () => {
    const path = `${VENDOR_ID}/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-proposal.pdf`;

    const { status } = await call({
      ...validBody(),
      proposal_url: buildProposalUrl(path),
    });

    expect(status).toBe(201);
    const inserted = db().inserted.find((entry) => entry.table === "bids");
    expect(inserted?.rows[0].proposal_url).toBe(buildProposalUrl(path));
  });
});
