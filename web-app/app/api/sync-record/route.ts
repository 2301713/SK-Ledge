import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { createPublicClient, http, decodeEventLog, isAddress, Hex } from "viem";
import { sepolia } from "viem/chains";
import { SK_LEDGE_ABI, CONTRACT_ADDRESS } from "@/lib/contractConfig";

// Database Service-Role Client (Used strictly after verification)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Allowed roles mapping per record type
const ROLE_PERMISSIONS: Record<string, string[]> = {
  allocation: ["SK_Chairperson", "SK_Treasurer"],
  expense: ["SK_Chairperson", "SK_Treasurer"],
  award: ["SK_Chairperson", "SK_Treasurer", "BMO"],
};

// Event string matching for contract RecordAdded event
const EVENT_RECORD_TYPES: Record<string, string> = {
  allocation: "Allocation",
  expense: "Expense",
  award: "Award",
};

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session using Supabase SSR cookies
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component / Route Handler cookie mutation fallback
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthenticated. Valid session cookie required." },
        { status: 401 }
      );
    }

    // 2. Fetch authenticated user profile using actual 'role_type' column
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role_type, approval_status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.role_type) {
      return NextResponse.json(
        { error: "Forbidden. User profile or role_type not found." },
        { status: 403 }
      );
    }

    if (profile.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Forbidden. User profile is not approved." },
        { status: 403 }
      );
    }

    // 3. Parse & validate request payload
    const body = await req.json();
    const {
      type,
      blockchain_tx_hash,
      amount,
      contract_address,
      official_address,
      barangay,
      purpose,
      project_id,
    } = body;

    // Type validation
    if (!type || !["allocation", "expense", "award"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid record type. Must be 'allocation', 'expense', or 'award'." },
        { status: 400 }
      );
    }

    // Role-based permission check using role_type
    const allowedRoles = ROLE_PERMISSIONS[type];
    if (!allowedRoles.includes(profile.role_type)) {
      return NextResponse.json(
        { error: `Forbidden. Role '${profile.role_type}' is not authorized to record ${type}s.` },
        { status: 403 }
      );
    }

    // Hash validation
    const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!blockchain_tx_hash || !txHashRegex.test(blockchain_tx_hash)) {
      return NextResponse.json(
        { error: "Invalid blockchain_tx_hash. Must be a 0x-prefixed 64-character hex string." },
        { status: 400 }
      );
    }

    // Amount validation
    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive integer representing centavos." },
        { status: 400 }
      );
    }

    // Address validations
    if (!contract_address || !isAddress(contract_address)) {
      return NextResponse.json(
        { error: "Invalid contract_address format." },
        { status: 400 }
      );
    }

    if (!official_address || !isAddress(official_address)) {
      return NextResponse.json(
        { error: "Invalid official_address format." },
        { status: 400 }
      );
    }

    // Text validations
    if (!barangay || typeof barangay !== "string" || barangay.trim() === "") {
      return NextResponse.json(
        { error: "Barangay field is required and cannot be empty." },
        { status: 400 }
      );
    }

    if (!purpose || typeof purpose !== "string" || purpose.trim() === "") {
      return NextResponse.json(
        { error: "Purpose field is required and cannot be empty." },
        { status: 400 }
      );
    }

    if (type === "award" && !project_id) {
      return NextResponse.json(
        { error: "project_id is required for award records." },
        { status: 400 }
      );
    }

    // Contract address check
    const expectedContract = (
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || CONTRACT_ADDRESS
    ).toLowerCase();
    if (contract_address.toLowerCase() !== expectedContract) {
      return NextResponse.json(
        { error: "Submitted contract_address does not match system target contract." },
        { status: 400 }
      );
    }

    // 4. Duplicate check in target table
    const tableName =
      type === "allocation" ? "allocations" : type === "expense" ? "expenses" : "awards";

    const { data: existingRecord } = await supabaseAdmin
      .from(tableName)
      .select("id, blockchain_tx_hash")
      .eq("blockchain_tx_hash", blockchain_tx_hash)
      .maybeSingle();

    if (existingRecord) {
      return NextResponse.json(
        {
          error: "Duplicate transaction. Record with this hash already exists.",
          record: existingRecord,
        },
        { status: 409 }
      );
    }

    // 5. Verify on-chain transaction & event logs using viem
    const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    let receipt;
    try {
      receipt = await publicClient.getTransactionReceipt({
        hash: blockchain_tx_hash as Hex,
      });
    } catch {
      return NextResponse.json(
        { error: "Transaction receipt not found on Sepolia network." },
        { status: 422 }
      );
    }

    if (!receipt || receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction failed or has not been confirmed on-chain." },
        { status: 422 }
      );
    }

    if (!receipt.to || receipt.to.toLowerCase() !== expectedContract) {
      return NextResponse.json(
        { error: "Transaction recipient does not match target contract address." },
        { status: 422 }
      );
    }

    // Verify RecordAdded log emission
    let matchedLogFound = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== expectedContract) continue;

      try {
        const decoded = decodeEventLog({
          abi: SK_LEDGE_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "RecordAdded") {
          const args = decoded.args as {
            id: bigint;
            official: string;
            barangay: string;
            amount: bigint;
            timestamp: bigint;
            recordType: string;
          };

          const expectedRecordType = EVENT_RECORD_TYPES[type];

          const isOfficialMatch =
            args.official.toLowerCase() === official_address.toLowerCase() &&
            args.official.toLowerCase() === receipt.from.toLowerCase();
          const isBarangayMatch =
            args.barangay.trim().toLowerCase() === barangay.trim().toLowerCase();
          const isAmountMatch = args.amount === BigInt(amount);
          const isTypeMatch = args.recordType === expectedRecordType;

          if (isOfficialMatch && isBarangayMatch && isAmountMatch && isTypeMatch) {
            matchedLogFound = true;
            break;
          }
        }
      } catch {
        // Skip non-matching event signatures
      }
    }

    if (!matchedLogFound) {
      return NextResponse.json(
        { error: "On-chain RecordAdded event data does not match submitted payload." },
        { status: 422 }
      );
    }

    // 6. Secure Database Insertion using session user_id
    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      blockchain_tx_hash,
      contract_address,
      official_address,
      barangay,
      amount,
      purpose,
      created_at: new Date().toISOString(),
    };

    if (type === "award") {
      insertPayload.project_id = project_id;
    }

    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from(tableName)
      .insert([insertPayload])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to insert record into database." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Record synchronized and verified successfully.", data: insertedData },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}