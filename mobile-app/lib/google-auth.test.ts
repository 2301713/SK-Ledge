import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
      getSession: vi.fn(),
      exchangeCodeForSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/projects", () => ({
  fetchMyProfile: vi.fn(),
}));

vi.mock("expo-linking", () => ({
  createURL: (path: string) => `exp://localhost:8081/--/${path}`,
}));

vi.mock("expo-web-browser", () => ({
  openAuthSessionAsync: vi.fn(),
}));

import {
  evaluateVendorProfile,
  getGoogleRedirectUrl,
} from "./google-auth";
import type { VendorProfile } from "./projects";

function profile(overrides: Partial<VendorProfile> = {}): VendorProfile {
  return {
    id: "vendor-1",
    full_name: "Juan Dela Cruz",
    company_name: "Acme Trading",
    email: "vendor@example.com",
    role_type: "Vendor",
    barangay: "N/A",
    contact_number: null,
    approval_status: "approved",
    account_status: true,
    avatar_url: null,
    ...overrides,
  };
}

describe("evaluateVendorProfile", () => {
  it("sends accounts without a profile to onboarding", () => {
    expect(evaluateVendorProfile(null)).toEqual({ status: "incomplete" });
  });

  it("accepts an approved, active vendor", () => {
    expect(evaluateVendorProfile(profile())).toEqual({ status: "approved" });
  });

  it("is case-insensitive about the vendor role", () => {
    expect(evaluateVendorProfile(profile({ role_type: "vendor" }))).toEqual({
      status: "approved",
    });
  });

  it.each(["SK_Chairperson", "COA", "Admin", "Vendor "])(
    "rejects the non-mobile role %j",
    (role) => {
      const outcome = evaluateVendorProfile(profile({ role_type: role }));

      expect(outcome.status).toBe("error");
    },
  );

  it("rejects a disabled account", () => {
    const outcome = evaluateVendorProfile(profile({ account_status: false }));

    expect(outcome).toMatchObject({ status: "error" });
    expect(outcome.status === "error" && outcome.message).toContain("disabled");
  });

  it("rejects a pending application with a review message", () => {
    const outcome = evaluateVendorProfile(
      profile({ approval_status: "pending" }),
    );

    expect(outcome).toMatchObject({ status: "error" });
    expect(outcome.status === "error" && outcome.message).toContain(
      "under review",
    );
  });

  it("treats a missing approval status as pending", () => {
    const outcome = evaluateVendorProfile(
      profile({ approval_status: null }),
    );

    expect(outcome.status).toBe("error");
  });

  it("rejects a rejected application", () => {
    const outcome = evaluateVendorProfile(
      profile({ approval_status: "REJECTED" }),
    );

    expect(outcome).toMatchObject({ status: "error" });
    expect(outcome.status === "error" && outcome.message).toContain(
      "not approved",
    );
  });
});

describe("getGoogleRedirectUrl", () => {
  it("uses the Expo deep link when no override is configured", () => {
    vi.stubEnv("EXPO_PUBLIC_AUTH_REDIRECT_URL", "");

    expect(getGoogleRedirectUrl()).toContain("auth/callback");
  });

  it("prefers an explicitly configured redirect URL", () => {
    vi.stubEnv(
      "EXPO_PUBLIC_AUTH_REDIRECT_URL",
      "https://example.com/auth/callback",
    );

    expect(getGoogleRedirectUrl()).toBe("https://example.com/auth/callback");
  });
});
