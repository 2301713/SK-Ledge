import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";

const RESET_PATH = "auth/reset-password";

/**
 * The deep link Supabase sends the recovery email back to. Expo Go derives
 * this from the dev-server host (exp://<lan-ip>:8081/--/auth/reset-password),
 * so set EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL to pin a stable URL for
 * preview and production builds, and allowlist it in Supabase → Auth → URL
 * Configuration.
 */
export const getPasswordResetRedirectUrl = () =>
  process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL?.trim() ||
  Linking.createURL(RESET_PATH);

const friendlyError = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit") || normalized.includes("security purposes")) {
    return "Too many reset emails were requested. Wait a minute, then try again.";
  }

  if (normalized.includes("unable to validate email") || normalized.includes("invalid email")) {
    return "Enter a valid email address.";
  }

  if (normalized.includes("same password") || normalized.includes("different from the old")) {
    return "Choose a password you have not used before.";
  }

  if (normalized.includes("password should be at least")) {
    return "Use at least 8 characters for your password.";
  }

  if (normalized.includes("expired") || normalized.includes("invalid token")) {
    return "This reset link has expired. Request a new one.";
  }

  return message;
};

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getPasswordResetRedirectUrl(),
  });

  if (error) throw new Error(friendlyError(error.message));
}

const firstValue = (value: string | null) => value ?? undefined;

/**
 * Exchanges the recovery link for a session. Supabase sends either a PKCE
 * `code` (current) or a `token_hash` + `type=recovery` (older emails), so both
 * are accepted.
 */
export async function completePasswordResetFromUrl(
  url: string,
): Promise<{ status: "ready" } | { status: "error"; message: string }> {
  const { queryParams } = Linking.parse(url);

  const providerError =
    firstValue(queryParams?.error_description as string | null) ??
    firstValue(queryParams?.error as string | null);
  if (providerError) {
    return { status: "error", message: friendlyError(providerError) };
  }

  const code = firstValue(queryParams?.code as string | null);
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { status: "error", message: friendlyError(error.message) };
    return { status: "ready" };
  }

  const tokenHash = firstValue(queryParams?.token_hash as string | null);
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (error) return { status: "error", message: friendlyError(error.message) };
    return { status: "ready" };
  }

  // Already authenticated (for example, the link opened inside the app while a
  // recovery session was restored), so the form can be shown directly.
  const { data } = await supabase.auth.getSession();
  if (data.session) return { status: "ready" };

  return {
    status: "error",
    message:
      "This reset link is missing its recovery token. Request a new email and open the link on this device.",
  };
}

export async function updatePassword(password: string): Promise<void> {
  if (password.length < 8) {
    throw new Error("Use at least 8 characters for your password.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(friendlyError(error.message));
}
