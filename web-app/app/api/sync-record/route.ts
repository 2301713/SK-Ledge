import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  decodeEventLog,
  decodeFunctionData,
  http,
  isAddress,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
} from "viem";
import { sepolia } from "viem/chains";
import { SK_LEDGE_ABI, CONTRACT_ADDRESS } from "@/lib/contractConfig";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";

export const runtime = "nodejs";

const RECORD_TYPES = ["allocation", "expense", "award"] as const;
const RECORD_TYPE_SET: ReadonlySet<string> = new Set(RECORD_TYPES);
type RecordType = (typeof RECORD_TYPES)[number];

const ROLE_PERMISSIONS: Record<RecordType, readonly string[]> = {
  allocation: ["SK_Chairperson", "SK_Treasurer"],
  expense: ["SK_Chairperson", "SK_Treasurer"],
  award: ["SK_Chairperson", "SK_Treasurer", "BMO"],
};

const EVENT_RECORD_TYPES: Record<RecordType, string> = {
  allocation: "Allocation",
  expense: "Expense",
  award: "Award",
};

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

function isRecordType(value: unknown): value is RecordType {
  return typeof value === "string" && RECORD_TYPE_SET.has(value);
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("Sync record is missing required Supabase configuration.");
      return errorResponse("Server configuration error.", 500);
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
        return errorResponse("Unauthenticated. Valid session cookie required.", 401);
      }

      console.error("Supabase authentication failed.", {
        status: authError.status ?? "unknown",
      });
      return errorResponse("Authentication service unavailable.", 500);
    }

    if (!user) {
      return errorResponse("Unauthenticated. Valid session cookie required.", 401);
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
      .select("role_type, approval_status, barangay")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load sync-record profile.", {
        code: profileError.code,
      });
      return errorResponse("Failed to verify user permissions.", 500);
    }

    if (
      !profile?.role_type ||
      profile.approval_status !== "approved"
    ) {
      return errorResponse("Forbidden. An approved user profile is required.", 403);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Request body must contain valid JSON.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Request body must be a JSON object.", 400);
    }

    const payload = body as Record<string, unknown>;
    const {
      type,
      blockchain_tx_hash,
      amount,
      contract_address,
      official_address,
      barangay,
      purpose,
      project_id,
    } = payload;

    if (!isRecordType(type)) {
      return errorResponse(
        "Invalid record type. Must be 'allocation', 'expense', or 'award'.",
        400,
      );
    }

    if (!ROLE_PERMISSIONS[type].includes(profile.role_type)) {
      return errorResponse(
        `Forbidden. Role '${profile.role_type}' is not authorized to record ${type}s.`,
        403,
      );
    }

    if (
      typeof blockchain_tx_hash !== "string" ||
      !/^0x[a-fA-F0-9]{64}$/.test(blockchain_tx_hash)
    ) {
      return errorResponse(
        "Invalid blockchain_tx_hash. Must be a 0x-prefixed 64-character hex string.",
        400,
      );
    }
    const transactionHash = blockchain_tx_hash.toLowerCase() as `0x${string}`;

    if (
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount <= 0
    ) {
      return errorResponse(
        "Invalid amount. Must be a positive integer representing centavos.",
        400,
      );
    }

    if (
      typeof contract_address !== "string" ||
      !isAddress(contract_address)
    ) {
      return errorResponse("Invalid contract_address format.", 400);
    }

    if (
      typeof official_address !== "string" ||
      !isAddress(official_address)
    ) {
      return errorResponse("Invalid official_address format.", 400);
    }

    if (typeof barangay !== "string" || barangay.length > 120) {
      return errorResponse(
        "Invalid barangay. Select a registered canonical barangay.",
        400,
      );
    }
    const canonicalBarangay = canonicalizeBarangay(barangay);
    if (!canonicalBarangay) {
      return errorResponse(
        "Invalid or ambiguous barangay. Select its municipality and use the registered canonical identity.",
        400,
      );
    }

    if (
      ["SK_Chairperson", "SK_Treasurer"].includes(profile.role_type) &&
      canonicalizeBarangay(profile.barangay ?? "") !== canonicalBarangay
    ) {
      return errorResponse(
        "Forbidden. The submitted barangay does not match your approved profile.",
        403,
      );
    }

    if (
      typeof purpose !== "string" ||
      purpose.trim().length === 0 ||
      purpose.length > 1000
    ) {
      return errorResponse(
        "Invalid purpose. It must contain 1 to 1000 characters.",
        400,
      );
    }

    let projectId: string | undefined;
    if (type === "award") {
      if (
        typeof project_id !== "string" ||
        project_id.trim().length === 0 ||
        project_id.length > 128
      ) {
        return errorResponse(
          "project_id is required for award records and must be a valid string.",
          400,
        );
      }
      projectId = project_id.trim();
    } else if (project_id !== undefined && project_id !== null) {
      return errorResponse("project_id is only valid for award records.", 400);
    }

    const expectedContract = CONTRACT_ADDRESS;
    if (
      !isAddress(expectedContract) ||
      expectedContract.toLowerCase() ===
        "0x0000000000000000000000000000000000000000"
    ) {
      console.error("Sync record is missing a valid contract address.");
      return errorResponse("Server contract configuration error.", 500);
    }

    if (contract_address.toLowerCase() !== expectedContract.toLowerCase()) {
      return errorResponse(
        "Submitted contract_address does not match system target contract.",
        400,
      );
    }

    const tableName =
      type === "allocation"
        ? "allocations"
        : type === "expense"
          ? "expenses"
          : "awards";

    if (projectId) {
      const { data: project, error: projectError } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .maybeSingle();

      if (projectError) {
        console.error("Failed to verify award project.", {
          code: projectError.code,
        });
        return errorResponse("Failed to verify award project.", 500);
      }

      if (!project) {
        return errorResponse("Award project was not found.", 400);
      }
    }

    const { data: existingRecord, error: duplicateCheckError } =
      await supabaseAdmin
        .from(tableName)
        .select("id")
        .ilike("blockchain_tx_hash", transactionHash)
        .limit(1)
        .maybeSingle();

    if (duplicateCheckError) {
      console.error("Failed to check sync-record duplicate.", {
        code: duplicateCheckError.code,
      });
      return errorResponse("Failed to check for duplicate transactions.", 500);
    }

    if (existingRecord) {
      return errorResponse(
        "Duplicate transaction. Record with this hash already exists.",
        409,
      );
    }

    const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    let transaction;
    let receipt;
    try {
      [transaction, receipt] = await Promise.all([
        publicClient.getTransaction({ hash: transactionHash }),
        publicClient.getTransactionReceipt({ hash: transactionHash }),
      ]);
    } catch (error) {
      if (
        error instanceof TransactionNotFoundError ||
        error instanceof TransactionReceiptNotFoundError
      ) {
        return errorResponse(
          "Transaction receipt not found on Sepolia network.",
          422,
        );
      }

      console.error("Sepolia transaction verification failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return errorResponse("Blockchain verification service unavailable.", 503);
    }

    if (receipt.status !== "success") {
      return errorResponse(
        "Transaction failed or has not been confirmed on-chain.",
        422,
      );
    }

    if (
      !transaction.to ||
      transaction.to.toLowerCase() !== expectedContract.toLowerCase() ||
      !receipt.to ||
      receipt.to.toLowerCase() !== expectedContract.toLowerCase() ||
      transaction.from.toLowerCase() !== receipt.from.toLowerCase()
    ) {
      return errorResponse(
        "Transaction recipient does not match target contract address.",
        422,
      );
    }

    let decodedCall;
    try {
      decodedCall = decodeFunctionData({
        abi: SK_LEDGE_ABI,
        data: transaction.input,
      });
    } catch {
      return errorResponse(
        "Transaction call data does not match a valid record submission.",
        422,
      );
    }

    if (decodedCall.functionName !== "addRecord") {
      return errorResponse(
        "Transaction did not call the record submission function.",
        422,
      );
    }

    const [callBarangay, callAmount, callPurpose, callRecordType] =
      decodedCall.args;
    const canonicalCallBarangay =
      typeof callBarangay === "string"
        ? canonicalizeBarangay(callBarangay)
        : null;
    if (
      canonicalCallBarangay !== canonicalBarangay ||
      callAmount !== BigInt(amount) ||
      callPurpose !== purpose ||
      callRecordType !== EVENT_RECORD_TYPES[type]
    ) {
      return errorResponse(
        "Transaction call data does not match the submitted record details.",
        422,
      );
    }

    let recordAddedEventCount = 0;
    let matchingRecordEventFound = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== expectedContract.toLowerCase()) {
        continue;
      }

      let decodedLog;
      try {
        decodedLog = decodeEventLog({
          abi: SK_LEDGE_ABI,
          data: log.data,
          topics: log.topics,
        });
      } catch {
        continue;
      }

      if (decodedLog.eventName !== "RecordAdded") {
        continue;
      }

      recordAddedEventCount += 1;
      const args = decodedLog.args;
      if (
        args.official.toLowerCase() === official_address.toLowerCase() &&
        args.official.toLowerCase() === transaction.from.toLowerCase() &&
        args.barangay === canonicalBarangay &&
        args.amount === BigInt(amount) &&
        args.recordType === EVENT_RECORD_TYPES[type]
      ) {
        matchingRecordEventFound = true;
      }
    }

    if (recordAddedEventCount !== 1 || !matchingRecordEventFound) {
      return errorResponse(
        "On-chain RecordAdded event data does not match submitted payload.",
        422,
      );
    }

    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      blockchain_tx_hash: transactionHash,
      contract_address: expectedContract,
      official_address,
      barangay: canonicalBarangay,
      amount,
      purpose,
      created_at: new Date().toISOString(),
    };

    if (projectId) {
      insertPayload.project_id = projectId;
    }

    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from(tableName)
      .insert([insertPayload])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: duplicateAfterConflict, error: conflictCheckError } =
          await supabaseAdmin
            .from(tableName)
            .select("id")
            .ilike("blockchain_tx_hash", transactionHash)
            .limit(1)
            .maybeSingle();

        if (conflictCheckError) {
          console.error("Failed to verify duplicate after insert conflict.", {
            code: conflictCheckError.code,
          });
          return errorResponse("Failed to verify duplicate transaction.", 500);
        }

        if (duplicateAfterConflict) {
          return errorResponse(
            "Duplicate transaction. Record with this hash already exists.",
            409,
          );
        }
      }

      console.error("Failed to insert verified sync record.", {
        code: insertError.code,
      });
      return errorResponse("Failed to insert record into database.", 500);
    }

    return NextResponse.json(
      {
        message: "Record synchronized and verified successfully.",
        data: insertedData,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected sync-record failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
