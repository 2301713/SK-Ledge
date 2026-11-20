import {
  resolveVendorAccount,
  type VendorAuthOutcome,
} from "@/lib/google-auth";
import { supabase } from "@/lib/supabase";

/**
 * Temporary password login used while testing the mobile app. It is on in
 * development and off in production unless EXPO_PUBLIC_ENABLE_PASSWORD_LOGIN
 * is set to "true" (for preview builds that need it).
 */
const envFlag = process.env.EXPO_PUBLIC_ENABLE_PASSWORD_LOGIN?.trim();
export const isPasswordLoginEnabled =
  envFlag === "true" ||
  (envFlag !== "false" && typeof __DEV__ !== "undefined" && __DEV__);

const messageForError = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Incorrect email or password. This temporary login only works for accounts that already exist in Supabase Auth.";
  }

  if (normalized.includes("email not confirmed")) {
    return "This account's email is not confirmed. Confirm it in Supabase → Authentication → Users, then try again.";
  }

  return message;
};

/**
 * Signs in with an existing Supabase Auth email/password account, then applies
 * the same vendor approval checks as Google sign-in.
 */
export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<VendorAuthOutcome> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { status: "error", message: messageForError(error.message) };
  }

  if (!data.session?.user) {
    return {
      status: "error",
      message: "Sign-in did not return a session. Please try again.",
    };
  }

  return resolveVendorAccount(data.session.user.id);
}
