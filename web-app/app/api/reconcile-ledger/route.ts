import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";

export const runtime = "nodejs";

const RECONCILE_ROLES: ReadonlySet<string> = new Set([
  "SK_Chairperson",
  "SK_Treasurer",
  "COA",
  "Admin",
]);

const TABLE_BY_RECORD_TYPE = {
  Allocation: "allocations",
  Expense: "expenses",
  Award: "awards",
} as const;

type ReconcileTable = (typeof TABLE_BY_RECORD_TYPE)[keyof typeof TABLE_BY_RECORD_TYPE];

type GapReason = "unsupported_record_type" | "official_not_bound";

interface UnmappedRecord {
  id: number;
  recordType: string;
  official: string;
  reason: GapReason;
}

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

async function authorize(): Promise<
  { supabaseAdmin: SupabaseClient } | { error: NextResponse }
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error("Reconcile ledger is missing required Supabase configuration.");
    return { error: errorResponse("Server configuration error.", 500) };
  }

  if (
    !CONTRACT_ADDRESS ||
    CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
  ) {
    console.error("Reconcile ledger is missing a valid contract address.");
    return { error: errorResponse("Server contract configuration error.", 500) };
  }

  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError) {
    if (authError.status && authError.status < 500) {
      return {
        error: errorResponse("Unauthenticated. Valid session cookie required.", 401),
      };
    }
    console.error("Supabase authentication failed during reconcile.", {
      status: authError.status ?? "unknown",
    });
    return { error: errorResponse("Authentication service unavailable.", 500) };
  }

  if (!user) {
    return {
      error: errorResponse("Unauthenticated. Valid session cookie required.", 401),
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role_type, approval_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load reconcile profile.", { code: profileError.code });
    return { error: errorResponse("Failed to verify user permissions.", 500) };
  }

  if (
    !profile?.role_type ||
    profile.approval_status !== "approved" ||
    !RECONCILE_ROLES.has(profile.role_type)
  ) {
    return {
      error: errorResponse(
        "Forbidden. An approved SK, COA, or Admin profile is required.",
        403,
      ),
    };
  }

  return { supabaseAdmin };
}

export async function GET() {
  try {
    const authorization = await authorize();
    if ("error" in authorization) return authorization.error;

    const { data, error } = await authorization.supabaseAdmin
      .from("ledger_sync_gaps")
      .select(
        "blockchain_record_id, record_type, official_address, reason, first_seen_at, last_seen_at",
      )
      .eq("contract_address", CONTRACT_ADDRESS)
      .order("blockchain_record_id");

    if (error) {
      console.error("Failed to load ledger sync gaps.", { code: error.code });
      return errorResponse("Failed to load ledger sync gaps.", 500);
    }

    return NextResponse.json({
      gaps: (data ?? []).map((row) => ({
        id: Number(row.blockchain_record_id),
        recordType: row.record_type,
        official: row.official_address,
        reason: row.reason,
        firstSeenAt: row.first_seen_at,
        lastSeenAt: row.last_seen_at,
      })),
    });
  } catch (error) {
    console.error("Unexpected reconcile-ledger GET failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}

export async function POST() {
  try {
    const authorization = await authorize();
    if ("error" in authorization) return authorization.error;
    const { supabaseAdmin } = authorization;

    const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    let ledgerRecords;
    try {
      ledgerRecords = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: SK_LEDGE_ABI,
        functionName: "getAllRecords",
      });
    } catch (error) {
      console.error("Failed to read ledger records during reconcile.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return errorResponse("Blockchain read failed. Try again shortly.", 503);
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, wallet_address")
      .not("wallet_address", "is", null);

    if (profilesError) {
      console.error("Failed to load wallet bindings during reconcile.", {
        code: profilesError.code,
      });
      return errorResponse("Failed to load wallet bindings.", 500);
    }

    const profileIdByWallet = new Map<string, string>();
    for (const candidate of profiles ?? []) {
      if (candidate.wallet_address) {
        profileIdByWallet.set(candidate.wallet_address.toLowerCase(), candidate.id);
      }
    }

    // Transactions created outside the app have no known hash; preserve whatever
    // is already stored instead of clearing it.
    const storedHashes = new Map<string, string>();
    for (const table of Object.values(TABLE_BY_RECORD_TYPE)) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select("blockchain_record_id, blockchain_tx_hash")
        .not("blockchain_record_id", "is", null);

      if (error) {
        console.error("Failed to load stored transaction hashes.", {
          table,
          code: error.code,
        });
        return errorResponse("Failed to load stored ledger rows.", 500);
      }

      for (const row of data ?? []) {
        if (row.blockchain_tx_hash) {
          storedHashes.set(
            `${table}:${row.blockchain_record_id}`,
            row.blockchain_tx_hash,
          );
        }
      }
    }

    const rowsByTable: Record<ReconcileTable, Record<string, unknown>[]> = {
      allocations: [],
      expenses: [],
      awards: [],
    };
    const unmapped: UnmappedRecord[] = [];
    const mirroredIds: number[] = [];

    ledgerRecords.forEach((record) => {
      const table =
        TABLE_BY_RECORD_TYPE[record.recordType as keyof typeof TABLE_BY_RECORD_TYPE];
      const userId = table
        ? profileIdByWallet.get(record.official.toLowerCase())
        : undefined;

      if (!table) {
        unmapped.push({
          id: Number(record.id),
          recordType: record.recordType,
          official: record.official,
          reason: "unsupported_record_type",
        });
        return;
      }

      if (!userId) {
        unmapped.push({
          id: Number(record.id),
          recordType: record.recordType,
          official: record.official,
          reason: "official_not_bound",
        });
        return;
      }

      const row: Record<string, unknown> = {
        user_id: userId,
        blockchain_tx_hash: storedHashes.get(`${table}:${record.id}`) ?? null,
        contract_address: CONTRACT_ADDRESS,
        official_address: record.official,
        barangay: record.barangay,
        amount: Number(record.amount),
        purpose: record.purpose,
        created_at: new Date(Number(record.timestamp) * 1000).toISOString(),
        blockchain_record_id: Number(record.id),
      };

      // expenses.voided backs the COA voucher check; the other mirror columns
      // were removed in 20261120100000_drop_dead_schema.sql.
      if (table === "expenses") {
        row.voided = record.voided;
      }

      rowsByTable[table].push(row);
      mirroredIds.push(Number(record.id));
    });

    for (const table of Object.keys(rowsByTable) as ReconcileTable[]) {
      const rows = rowsByTable[table];
      if (rows.length === 0) continue;

      const { error: upsertError } = await supabaseAdmin
        .from(table)
        .upsert(rows, { onConflict: "contract_address,blockchain_record_id" });

      if (upsertError) {
        console.error(`Failed to reconcile ${table}.`, { code: upsertError.code });
        return errorResponse(`Failed to reconcile ${table}.`, 500);
      }
    }

    // Gap bookkeeping is secondary: a failure here must not claim the mirrored
    // rows failed.
    const now = new Date().toISOString();
    let gapsPersisted = true;

    if (unmapped.length > 0) {
      const { error: gapError } = await supabaseAdmin
        .from("ledger_sync_gaps")
        .upsert(
          unmapped.map((entry) => ({
            contract_address: CONTRACT_ADDRESS,
            blockchain_record_id: entry.id,
            record_type: entry.recordType,
            official_address: entry.official,
            reason: entry.reason,
            last_seen_at: now,
          })),
          { onConflict: "contract_address,blockchain_record_id" },
        );

      if (gapError) {
        gapsPersisted = false;
        console.error("Failed to persist ledger sync gaps.", { code: gapError.code });
      }
    }

    if (mirroredIds.length > 0) {
      const { error: resolveError } = await supabaseAdmin
        .from("ledger_sync_gaps")
        .delete()
        .eq("contract_address", CONTRACT_ADDRESS)
        .in("blockchain_record_id", mirroredIds);

      if (resolveError) {
        gapsPersisted = false;
        console.error("Failed to clear resolved ledger sync gaps.", {
          code: resolveError.code,
        });
      }
    }

    return NextResponse.json({
      message: "Ledger reconciled against the contract.",
      reconciled: mirroredIds.length,
      unmapped,
      gapsPersisted,
    });
  } catch (error) {
    console.error("Unexpected reconcile-ledger failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
