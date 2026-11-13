"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuthStore } from "./useAuthStore";

/**
 * Shared, per-user avatar lookup so the dashboard chrome can show the Google
 * profile picture even on pages whose profile query does not hydrate the
 * auth store with `avatar_url`.
 */
const avatarCache = new Map<string, Promise<string | null>>();

async function loadAvatarUrl(userId: string): Promise<string | null> {
  const cached = avatarCache.get(userId);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Failed to load profile avatar:", error.message);
    } else if (data?.avatar_url) {
      return String(data.avatar_url);
    }

    // Fall back to the OAuth provider metadata (Google uses both fields).
    const { data: authData } = await supabase.auth.getUser();
    const metadata = authData.user?.user_metadata as
      | { avatar_url?: string; picture?: string }
      | undefined;

    return metadata?.avatar_url ?? metadata?.picture ?? null;
  })().catch(() => null);

  avatarCache.set(userId, request);
  return request;
}

/**
 * Resolves the avatar for the signed-in user. An explicitly passed URL wins,
 * then the auth store, then a cached profile/auth-metadata lookup.
 */
export function useAvatarUrl(explicitUrl?: string): string | undefined {
  const { currentUser } = useAuthStore();
  const storeUserId = currentUser?.id;
  const storeAvatarUrl = explicitUrl || currentUser?.avatar_url || undefined;
  const [fallback, setFallback] = useState<{
    userId: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (storeAvatarUrl) {
      return;
    }

    let active = true;

    void (async () => {
      // Some pages keep the profile in local state instead of the auth store,
      // so resolve the session directly when the store has no user yet.
      let userId = storeUserId;
      if (!userId) {
        const { data } = await supabase.auth.getUser();
        userId = data.user?.id;
      }

      if (!userId) {
        return;
      }

      const url = await loadAvatarUrl(userId);
      if (active && url) {
        setFallback({ userId, url });
      }
    })();

    return () => {
      active = false;
    };
  }, [storeUserId, storeAvatarUrl]);

  if (storeAvatarUrl) {
    return storeAvatarUrl;
  }

  if (!fallback) {
    return undefined;
  }

  return !storeUserId || fallback.userId === storeUserId
    ? fallback.url
    : undefined;
}
