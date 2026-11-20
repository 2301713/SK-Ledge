import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  fetchMyProfile: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
    },
  },
}));

vi.mock("@/lib/projects", () => ({
  fetchMyProfile: mocks.fetchMyProfile,
}));

vi.mock("expo-linking", () => ({
  createURL: (path: string) => `exp://localhost:8081/--/${path}`,
}));

vi.mock("expo-web-browser", () => ({
  openAuthSessionAsync: vi.fn(),
}));

import { signInWithEmailPassword } from "./email-auth";
import type { VendorProfile } from "./projects";

function profile(overrides: Partial<VendorProfile> = {}): VendorProfile {
  return {
    id: "vendor-1",
    full_name: "Acme Trading",
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

function signInSucceeds(userId = "vendor-1") {
  mocks.signInWithPassword.mockResolvedValue({
    data: { user: { id: userId }, session: { user: { id: userId } } },
    error: null,
  });
}

function signInFails(message: string) {
  mocks.signInWithPassword.mockResolvedValue({
    data: { user: null, session: null },
    error: { message },
  });
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("signInWithEmailPassword", () => {
  it("signs in an approved vendor and returns approved", async () => {
    signInSucceeds();
    mocks.fetchMyProfile.mockResolvedValue(profile());

    const outcome = await signInWithEmailPassword(
      "  vendor@example.com ",
      "secret",
    );

    expect(outcome).toEqual({ status: "approved" });
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "vendor@example.com",
      password: "secret",
    });
    expect(mocks.fetchMyProfile).toHaveBeenCalledWith("vendor-1");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("sends an account without a vendor profile to onboarding", async () => {
    signInSucceeds();
    mocks.fetchMyProfile.mockResolvedValue(null);

    await expect(
      signInWithEmailPassword("vendor@example.com", "secret"),
    ).resolves.toEqual({ status: "incomplete" });
  });

  it("rejects a pending application and signs the session out", async () => {
    signInSucceeds();
    mocks.fetchMyProfile.mockResolvedValue(
      profile({ approval_status: "pending" }),
    );

    const outcome = await signInWithEmailPassword(
      "vendor@example.com",
      "secret",
    );

    expect(outcome).toMatchObject({ status: "error" });
    expect(outcome.status === "error" && outcome.message).toContain(
      "under review",
    );
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });

  it("rejects a disabled vendor account", async () => {
    signInSucceeds();
    mocks.fetchMyProfile.mockResolvedValue(
      profile({ account_status: false }),
    );

    const outcome = await signInWithEmailPassword(
      "vendor@example.com",
      "secret",
    );

    expect(outcome).toMatchObject({ status: "error" });
    expect(outcome.status === "error" && outcome.message).toContain("disabled");
  });

  it("rejects a signed-in account that is not a vendor", async () => {
    signInSucceeds();
    mocks.fetchMyProfile.mockResolvedValue(profile({ role_type: "COA" }));

    const outcome = await signInWithEmailPassword(
      "vendor@example.com",
      "secret",
    );

    expect(outcome.status).toBe("error");
  });

  it("explains invalid credentials without checking the profile", async () => {
    signInFails("Invalid login credentials");

    const outcome = await signInWithEmailPassword(
      "vendor@example.com",
      "wrong",
    );

    expect(outcome).toMatchObject({ status: "error" });
    expect(outcome.status === "error" && outcome.message).toContain(
      "Incorrect email or password",
    );
    expect(mocks.fetchMyProfile).not.toHaveBeenCalled();
  });

  it("explains an unconfirmed email", async () => {
    signInFails("Email not confirmed");

    const outcome = await signInWithEmailPassword(
      "vendor@example.com",
      "secret",
    );

    expect(outcome.status === "error" && outcome.message).toContain(
      "not confirmed",
    );
  });

  it("passes through an unrecognized Supabase error", async () => {
    signInFails("Signups not allowed for this instance");

    const outcome = await signInWithEmailPassword(
      "vendor@example.com",
      "secret",
    );

    expect(outcome).toEqual({
      status: "error",
      message: "Signups not allowed for this instance",
    });
  });

  it("fails when sign-in returns no session", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    const outcome = await signInWithEmailPassword(
      "vendor@example.com",
      "secret",
    );

    expect(outcome).toMatchObject({ status: "error" });
    expect(outcome.status === "error" && outcome.message).toContain(
      "did not return a session",
    );
    expect(mocks.fetchMyProfile).not.toHaveBeenCalled();
  });
});

describe("isPasswordLoginEnabled", () => {
  const loadFlag = async (envValue: string | undefined) => {
    vi.resetModules();
    vi.stubEnv("EXPO_PUBLIC_ENABLE_PASSWORD_LOGIN", envValue ?? "");
    return (await import("./email-auth")).isPasswordLoginEnabled;
  };

  const setDev = (value: boolean | undefined) => {
    if (value === undefined) {
      delete (globalThis as { __DEV__?: boolean }).__DEV__;
    } else {
      (globalThis as { __DEV__?: boolean }).__DEV__ = value;
    }
  };

  afterEach(() => {
    setDev(undefined);
  });

  it("is on by default in development builds", async () => {
    setDev(true);

    await expect(loadFlag("")).resolves.toBe(true);
  });

  it("is off by default in production builds", async () => {
    setDev(false);

    await expect(loadFlag("")).resolves.toBe(false);
  });

  it("can be forced on for a preview build", async () => {
    setDev(false);

    await expect(loadFlag("true")).resolves.toBe(true);
  });

  it("can be switched off during local testing", async () => {
    setDev(true);

    await expect(loadFlag("false")).resolves.toBe(false);
  });
});
