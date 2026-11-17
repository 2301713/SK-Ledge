import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/allocations/route";

describe("POST /api/allocations", () => {
  it("returns 410 pointing callers at the sync-record endpoint", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.error).toBe(
      "Endpoint deprecated. Please submit allocation sync requests to /api/sync-record.",
    );
  });
});
