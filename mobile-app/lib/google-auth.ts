import { fetchMyProfile, type VendorProfile } from "@/lib/projects";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

const CALLBACK_PATH = "auth/callback";

export type VendorAuthOutcome =
  | { status: "approved" }
  | { status: "incomplete" }
  | { status: "cancelled" }
  | { status: "error"; message: string };

export const getGoogleRedirectUrl = () => Linking.createURL(CALLBACK_PATH);

/**
 * Mobile access is vendor-only. A missing profile means the Google account has
 * not registered yet, so it still needs to complete the vendor application.
 */
export function evaluateVendorProfile(
  profile: VendorProfile | null,
): VendorAuthOutcome {
  if (!profile) return { status: "incomplete" };

  if ((profile.role_type ?? "").toLowerCase() !== "vendor") {
    return {
      status: "error",
      message:
        "This account is not a mobile vendor account. Please use the web portal instead.",
    };
  }

  const approval = (profile.approval_status ?? "pending").toLowerCase();
  if (approval === "pending") {
    return {
      status: "error",
      message:
        "Your vendor application is still under review by the SK Federation. You can sign in once it is approved.",
    };
  }

  if (approval === "rejected") {
    return {
      status: "error",
      message:
        "Your vendor application was not approved. Contact the SK Federation for more information.",
    };
  }

  return { status: "approved" };
}

async function resolveVendorAccount(userId: string): Promise<VendorAuthOutcome> {
  const profile = await fetchMyProfile(userId);
  const outcome = evaluateVendorProfile(profile);

  if (outcome.status === "error") {
    await supabase.auth.signOut();
  }

  return outcome;
}

const pendingExchanges = new Map<string, Promise<VendorAuthOutcome>>();

async function exchangeCode(code: string): Promise<VendorAuthOutcome> {
  const pending = pendingExchanges.get(code);
  if (pending) return pending;

  const task = (async () => {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return {
        status: "error",
        message:
          error?.message ??
          "Google did not return a valid session. Please try again.",
      } satisfies VendorAuthOutcome;
    }

    return resolveVendorAccount(session.user.id);
  })().finally(() => {
    pendingExchanges.delete(code);
  });

  pendingExchanges.set(code, task);
  return task;
}

function readError(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

/**
 * Handles the URL Supabase redirects back to. In PKCE mode it carries a `code`
 * that must be exchanged for a session; provider failures arrive as `error`.
 */
export async function completeGoogleRedirect(
  url: string,
): Promise<VendorAuthOutcome> {
  const [withoutHash, hash = ""] = url.split("#");
  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex === -1 ? "" : withoutHash.slice(queryIndex + 1);
  const queryParams = new URLSearchParams(query);
  const hashParams = new URLSearchParams(hash);

  const error =
    queryParams.get("error") ?? hashParams.get("error") ?? undefined;
  const errorDescription =
    queryParams.get("error_description") ??
    hashParams.get("error_description") ??
    undefined;

  if (error) {
    return {
      status: "error",
      message:
        error === "access_denied"
          ? "Google sign-in was cancelled."
          : readError(errorDescription ?? error),
    };
  }

  const code = queryParams.get("code") ?? hashParams.get("code");
  if (!code) {
    return {
      status: "error",
      message: "Google did not return an authorization code. Please try again.",
    };
  }

  return exchangeCode(code);
}

export async function completeGoogleCode(
  code: string,
): Promise<VendorAuthOutcome> {
  return exchangeCode(code);
}

export async function signInWithGoogle(): Promise<VendorAuthOutcome> {
  const redirectTo = getGoogleRedirectUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Google sign-in could not be started.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success" || !result.url) {
    return { status: "cancelled" };
  }

  return completeGoogleRedirect(result.url);
}
