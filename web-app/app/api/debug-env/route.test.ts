import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/debug-env/route";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/debug-env", () => {
  it("reports presence and length without leaking secrets", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      hasUrl: true,
      urlLen: "https://example.supabase.co".length,
      hasKey: true,
      keyLen: "service-role-key".length,
    });
    expect(JSON.stringify(body)).not.toContain("service-role-key");
    expect(JSON.stringify(body)).not.toContain("example.supabase.co");
  });

  it("reports missing configuration as absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);

    const body = await (await GET()).json();

    expect(body).toEqual({ hasUrl: false, urlLen: 0, hasKey: false, keyLen: 0 });
  });

  it("reports empty-string configuration as present with zero length", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const body = await (await GET()).json();

    expect(body).toEqual({ hasUrl: true, urlLen: 0, hasKey: true, keyLen: 0 });
  });

  it("is not exposed in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found." });
  });
});
