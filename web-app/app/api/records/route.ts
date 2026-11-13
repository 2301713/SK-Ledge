import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";
import {
  isRecordType,
  RECORD_TABLES,
  RECORD_TYPES,
  type LedgerRecord,
  type RecordType,
} from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;
const BARANGAY_SCOPED_ROLES = ["SK_Chairperson", "SK_Treasurer"];
const PUBLIC_COLUMNS = "amount, created_at, barangay";

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

function parseLimit(rawLimit: string | null): number | null {
  if (rawLimit === null) {
    return DEFAULT_LIMIT;
  }

  if (!/^\d+$/.test(rawLimit)) {
    return null;
  }

  const limit = Number(rawLimit);
  if (limit < 1 || limit > MAX_LIMIT) {
    return null;
  }

  return limit;
}

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("Records endpoint is missing required Supabase configuration.");
      return errorResponse("Server configuration error.", 500);
    }

    const isPublicScope = req.nextUrl.searchParams.get("scope") === "public";

    const typeParam = req.nextUrl.searchParams.get("type");
    const requestedType = typeParam === null || typeParam === "all" ? null : typeParam;
    if (requestedType !== null && !isRecordType(requestedType)) {
      return errorResponse(
        "Invalid type. Must be 'allocation', 'expense', 'award', or 'all'.",
        400,
      );
    }

    const limit = parseLimit(req.nextUrl.searchParams.get("limit"));
    if (limit === null) {
      return errorResponse(
        `Invalid limit. Must be an integer between 1 and ${MAX_LIMIT}.`,
        400,
      );
    }

    const barangayParam = req.nextUrl.searchParams.get("barangay");
    let requestedBarangay: string | null = null;
    if (barangayParam !== null) {
      if (barangayParam.length > 120) {
        return errorResponse("Invalid barangay filter.", 400);
      }

      requestedBarangay = canonicalizeBarangay(barangayParam);
      if (!requestedBarangay) {
        return errorResponse(
          "Invalid barangay filter. Use a registered canonical barangay.",
          400,
        );
      }
    }

    const types: readonly RecordType[] = requestedType
      ? [requestedType as RecordType]
      : RECORD_TYPES;

    let readClient: SupabaseClient;
    let scopedBarangay = requestedBarangay;
    let selectColumns = "*";

    if (isPublicScope) {
      // Public reads use the anon key so row-level security decides what is
      // exposed, and only the columns the public portal renders are selected.
      readClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
      selectColumns = PUBLIC_COLUMNS;
    } else {
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

      if (authError && (!authError.status || authError.status >= 500)) {
        console.error("Supabase authentication failed.", {
          status: authError.status ?? "unknown",
        });
        return errorResponse("Authentication service unavailable.", 500);
      }

      if (!user) {
        return errorResponse(
          "Unauthenticated. Valid session cookie required.",
          401,
        );
      }

      readClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });

      const { data: profile, error: profileError } = await readClient
        .from("profiles")
        .select("role_type, approval_status, barangay")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to load records profile.", {
          code: profileError.code,
        });
        return errorResponse("Failed to verify user permissions.", 500);
      }

      if (!profile?.role_type) {
        return errorResponse(
          "Forbidden. An approved user profile is required.",
          403,
        );
      }

      if (BARANGAY_SCOPED_ROLES.includes(profile.role_type)) {
        const profileBarangay = canonicalizeBarangay(profile.barangay ?? "");
        if (!profileBarangay) {
          return errorResponse(
            "Forbidden. Your profile has no valid canonical barangay.",
            403,
          );
        }

        if (requestedBarangay && requestedBarangay !== profileBarangay) {
          return errorResponse(
            "Forbidden. You may only read records for your own barangay.",
            403,
          );
        }

        scopedBarangay = profileBarangay;
      }
    }

    const results = await Promise.all(
      types.map(async (recordType) => {
        let query = readClient
          .from(RECORD_TABLES[recordType])
          .select(selectColumns)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (scopedBarangay) {
          query = query.eq("barangay", scopedBarangay);
        }

        const { data, error } = await query;
        if (error) {
          console.error("Failed to read ledger records.", {
            table: RECORD_TABLES[recordType],
            code: error.code,
          });
          return null;
        }

        const rows = (data ?? []) as unknown as Record<string, unknown>[];
        return rows.map(
          (row) =>
            ({
              ...row,
              record_type: recordType,
            }) as LedgerRecord,
        );
      }),
    );

    if (results.some((result) => result === null)) {
      return errorResponse("Failed to read records from the database.", 500);
    }

    const records = (results as LedgerRecord[][])
      .flat()
      .sort((a, b) => {
        const aTime = a.created_at ? Date.parse(a.created_at) : 0;
        const bTime = b.created_at ? Date.parse(b.created_at) : 0;
        return bTime - aTime;
      })
      .slice(0, limit);

    return NextResponse.json({
      data: records,
      meta: {
        count: records.length,
        types,
        barangay: scopedBarangay,
        limit,
        scope: isPublicScope ? "public" : "authenticated",
        synced_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Unexpected records endpoint failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
