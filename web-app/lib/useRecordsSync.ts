"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { supabase } from "./supabase";
import {
  RECORD_TABLES,
  RECORD_TYPES,
  type LedgerRecord,
  type RecordType,
} from "./records";

const REFRESH_DEBOUNCE_MS = 300;

export interface UseRecordsSyncOptions {
  /** Which ledger tables to sync. Defaults to all record types. */
  type?: RecordType | "all";
  /** Optional canonical barangay filter (SK users are always scoped server-side). */
  barangay?: string;
  /** Maximum records returned per sync. Server caps this at 500. */
  limit?: number;
  /** Skip fetching and subscribing until true. */
  enabled?: boolean;
  /**
   * Read the public, RLS-scoped projection instead of requiring a session.
   * Only display columns (amount, created_at, barangay) are returned.
   */
  public?: boolean;
}

export interface UseRecordsSyncResult {
  records: LedgerRecord[];
  isLoading: boolean;
  error: string | null;
  lastSyncedAt: Date | null;
  refresh: () => Promise<void>;
}

export function useRecordsSync({
  type = "all",
  barangay,
  limit = 200,
  enabled = true,
  public: isPublic = false,
}: UseRecordsSyncOptions = {}): UseRecordsSyncResult {
  const [records, setRecords] = useState<LedgerRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const requestIdRef = useRef(0);
  const channelId = `ledger-records-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (type !== "all") {
        params.set("type", type);
      }
      if (barangay) {
        params.set("barangay", barangay);
      }
      if (isPublic) {
        params.set("scope", "public");
      }

      const response = await fetch(`/api/records?${params.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const body = (await response.json().catch(() => null)) as {
        data?: LedgerRecord[];
        error?: string;
      } | null;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok) {
        throw new Error(body?.error || "Failed to sync records.");
      }

      setRecords(Array.isArray(body?.data) ? body.data : []);
      setError(null);
      setLastSyncedAt(new Date());
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(
        err instanceof Error ? err.message : "Failed to sync records.",
      );
      setRecords((current) => current ?? []);
    }
  }, [type, barangay, limit, isPublic]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    // Defer the first load so the effect never triggers a synchronous render.
    void Promise.resolve().then(() =>
      active ? refresh() : Promise.resolve(),
    );

    const syncedTypes: readonly RecordType[] =
      type === "all" ? RECORD_TYPES : [type];

    const channel = supabase.channel(channelId, {
      config: { broadcast: { self: false } },
    });

    for (const recordType of syncedTypes) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: RECORD_TABLES[recordType],
        },
        () => {
          if (!active) {
            return;
          }

          if (refreshTimer) {
            clearTimeout(refreshTimer);
          }
          refreshTimer = setTimeout(() => {
            void refresh();
          }, REFRESH_DEBOUNCE_MS);
        },
      );
    }

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(
          "Realtime record subscription unavailable; falling back to manual refresh.",
        );
      }
    });

    return () => {
      active = false;
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      void supabase.removeChannel(channel);
    };
  }, [enabled, type, channelId, refresh]);

  return {
    records: records ?? [],
    isLoading: enabled && records === null && error === null,
    error,
    lastSyncedAt,
    refresh,
  };
}
