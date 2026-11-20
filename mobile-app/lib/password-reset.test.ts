import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
  getSession: vi.fn(),
  parse: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      verifyOtp: mocks.verifyOtp,
      updateUser: mocks.updateUser,
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("expo-linking", () => ({
  createURL: (path: string) => `skledgemobile://${path}`,
  parse: mocks.parse,
}));

import {
  completePasswordResetFromUrl,
  sendPasswordResetEmail,
  updatePassword,
} from "./password-reset";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("sendPasswordResetEmail", () => {
  it("trims the address and points the email at the app", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    await sendPasswordResetEmail("  vendor@example.com ");

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      "vendor@example.com",
      { redirectTo: "skledgemobile://auth/reset-password" },
    );
  });

  it("prefers a pinned redirect URL when one is configured", async () => {
    vi.resetModules();
    vi.stubEnv(
      "EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL",
      "https://skledge.app/auth/reset-password",
    );
    const fresh = await import("./password-reset");

    expect(fresh.getPasswordResetRedirectUrl()).toBe(
      "https://skledge.app/auth/reset-password",
    );
  });

  it("explains rate limiting", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      error: { message: "For security purposes, you can only request this after 42 seconds." },
    });

    await expect(sendPasswordResetEmail("a@b.co")).rejects.toThrow(
      /Too many reset emails/,
    );
  });

  it("passes through unknown errors", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      error: { message: "Email provider is down." },
    });

    await expect(sendPasswordResetEmail("a@b.co")).rejects.toThrow(
      "Email provider is down.",
    );
  });
});

describe("completePasswordResetFromUrl", () => {
  it("exchanges a PKCE code for a session", async () => {
    mocks.parse.mockReturnValue({ queryParams: { code: "abc-123" } });
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });

    await expect(
      completePasswordResetFromUrl("skledgemobile://auth/reset-password?code=abc-123"),
    ).resolves.toEqual({ status: "ready" });
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("abc-123");
  });

  it("verifies an older token_hash recovery link", async () => {
    mocks.parse.mockReturnValue({
      queryParams: { token_hash: "hash-1", type: "recovery" },
    });
    mocks.verifyOtp.mockResolvedValue({ error: null });

    await expect(
      completePasswordResetFromUrl("skledgemobile://auth/reset-password"),
    ).resolves.toEqual({ status: "ready" });
    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "hash-1",
      type: "recovery",
    });
  });

  it("reports an expired link from the provider", async () => {
    mocks.parse.mockReturnValue({
      queryParams: { error_description: "Email link is invalid or has expired" },
    });

    const outcome = await completePasswordResetFromUrl(
      "skledgemobile://auth/reset-password",
    );

    expect(outcome).toEqual({
      status: "error",
      message: "This reset link has expired. Request a new one.",
    });
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("surfaces a failed code exchange", async () => {
    mocks.parse.mockReturnValue({ queryParams: { code: "stale" } });
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "Invalid token" },
    });

    await expect(
      completePasswordResetFromUrl("skledgemobile://auth/reset-password"),
    ).resolves.toEqual({
      status: "error",
      message: "This reset link has expired. Request a new one.",
    });
  });

  it("accepts an already restored recovery session", async () => {
    mocks.parse.mockReturnValue({ queryParams: {} });
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });

    await expect(
      completePasswordResetFromUrl("skledgemobile://auth/reset-password"),
    ).resolves.toEqual({ status: "ready" });
  });

  it("asks for a new email when there is no token", async () => {
    mocks.parse.mockReturnValue({ queryParams: {} });
    mocks.getSession.mockResolvedValue({ data: { session: null } });

    const outcome = await completePasswordResetFromUrl(
      "skledgemobile://auth/reset-password",
    );

    expect(outcome.status).toBe("error");
  });
});

describe("updatePassword", () => {
  it("rejects short passwords before calling Supabase", async () => {
    await expect(updatePassword("short")).rejects.toThrow(/at least 8/);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("updates the signed-in user's password", async () => {
    mocks.updateUser.mockResolvedValue({ error: null });

    await updatePassword("longenough1");

    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "longenough1" });
  });

  it("explains a rejected update", async () => {
    mocks.updateUser.mockResolvedValue({
      error: { message: "New password should be different from the old password." },
    });

    await expect(updatePassword("longenough1")).rejects.toThrow(
      /not used before/,
    );
  });
});
