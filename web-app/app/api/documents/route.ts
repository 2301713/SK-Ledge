import { createServerClient } from "@supabase/ssr";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  isValidBlockchainTxHash,
  RECEIPT_BUCKET,
  RECEIPT_MAX_BYTES,
  RECEIPT_MIME_TYPES,
  sanitizeReceiptFileName,
  validateReceiptFile,
} from "@/lib/receipts";

export const runtime = "nodejs";

const UPLOAD_ROLES = new Set(["SK_Chairperson", "SK_Treasurer"]);
const RECORD_TYPES = new Set(["expense", "allocation", "award"]);
const DOCUMENT_KINDS = new Set([
  "receipt",
  "liquidation_report",
  "supporting_document",
]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

let bucketReady: Promise<void> | null = null;

async function ensureReceiptBucket(admin: SupabaseClient): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data: bucket } = await admin.storage.getBucket(RECEIPT_BUCKET);
      if (bucket) return;

      const { error } = await admin.storage.createBucket(RECEIPT_BUCKET, {
        public: false,
        fileSizeLimit: RECEIPT_MAX_BYTES,
        allowedMimeTypes: [...RECEIPT_MIME_TYPES],
      });

      if (error) {
        throw new Error(`Failed to create ${RECEIPT_BUCKET}: ${error.message}`);
      }
    })().catch((error) => {
      bucketReady = null;
      throw error;
    });
  }

  return bucketReady;
}

type AuthContext =
  | { error: NextResponse }
  | { user: User; admin: SupabaseClient };

async function getAuthenticatedUser(): Promise<AuthContext> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return { error: errorResponse("Server configuration error.", 500) };
  }

  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return {
      error: errorResponse(
        "Unauthenticated. Valid session cookie required.",
        401
      ),
    };
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return { user, admin };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const context = await getAuthenticatedUser();
    if ("error" in context) return context.error;

    const { user, admin } = context;
    const expectedContract = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!expectedContract) {
      return errorResponse("Server configuration error.", 500);
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role_type, approval_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load receipt upload profile.", {
        code: profileError.code,
      });
      return errorResponse("Failed to verify upload permissions.", 500);
    }

    if (!profile || !UPLOAD_ROLES.has(profile.role_type)) {
      return errorResponse(
        "Forbidden. Only SK officials may file receipts.",
        403
      );
    }

    if (profile.approval_status !== "approved") {
      return errorResponse(
        "Forbidden. Your account must be approved before filing receipts.",
        403
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return errorResponse("Request body must be multipart form data.", 400);
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return errorResponse("A document file is required.", 400);
    }

    const fileError = validateReceiptFile(file);
    if (fileError) {
      return errorResponse(fileError, 400);
    }

    const documentKind = String(formData.get("document_kind") ?? "receipt");
    if (!DOCUMENT_KINDS.has(documentKind)) {
      return errorResponse("Invalid document kind.", 400);
    }

    // Vault documents may be unlinked; expense receipts still supply these.
    const rawRecordType = String(formData.get("record_type") ?? "");
    let recordType: string | null = null;
    if (rawRecordType) {
      if (!RECORD_TYPES.has(rawRecordType)) {
        return errorResponse("Invalid record type.", 400);
      }
      recordType = rawRecordType;
    }

    const txHash = String(formData.get("blockchain_tx_hash") ?? "").trim();
    if (txHash && !isValidBlockchainTxHash(txHash)) {
      return errorResponse("Invalid blockchain transaction hash.", 400);
    }

    if (txHash) {
      const submittedContract = String(formData.get("contract_address") ?? "");
      if (submittedContract.toLowerCase() !== expectedContract.toLowerCase()) {
        return errorResponse(
          "Contract address does not match this deployment.",
          400
        );
      }
    }

    const rawRecordId = String(formData.get("blockchain_record_id") ?? "");
    let blockchainRecordId: number | null = null;
    if (rawRecordId) {
      if (!/^\d+$/.test(rawRecordId) || Number(rawRecordId) <= 0) {
        return errorResponse("Invalid blockchain record id.", 400);
      }
      blockchainRecordId = Number(rawRecordId);
    }

    const expenseId = String(formData.get("expense_id") ?? "");
    if (expenseId && !UUID_RE.test(expenseId)) {
      return errorResponse("Invalid expense reference.", 400);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");

    await ensureReceiptBucket(admin);

    const storagePath = `${user.id}/${randomUUID()}-${sanitizeReceiptFileName(
      file.name
    )}`;

    const { error: uploadError } = await admin.storage
      .from(RECEIPT_BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Failed to upload receipt object.", {
        message: uploadError.message,
      });
      return errorResponse("Failed to upload the receipt file.", 500);
    }

    const { data: document, error: insertError } = await admin
      .from("documents")
      .insert({
        uploaded_by: user.id,
        document_kind: documentKind,
        record_type: recordType,
        contract_address: txHash ? expectedContract : null,
        blockchain_tx_hash: txHash || null,
        blockchain_record_id: blockchainRecordId,
        expense_id: expenseId || null,
        storage_path: storagePath,
        file_name: file.name.slice(0, 200),
        mime_type: file.type,
        size_bytes: file.size,
        sha256,
      })
      .select(
        "id, file_name, mime_type, size_bytes, sha256, document_kind, record_type, blockchain_tx_hash, blockchain_record_id, expense_id, created_at"
      )
      .single();

    if (insertError) {
      await admin.storage.from(RECEIPT_BUCKET).remove([storagePath]);

      if (insertError.code === "23505") {
        return errorResponse(
          "This receipt was already filed for the transaction.",
          409
        );
      }

      console.error("Failed to record receipt metadata.", {
        code: insertError.code,
      });
      return errorResponse("Failed to record the receipt.", 500);
    }

    return NextResponse.json(
      {
        data: {
          id: document.id,
          fileName: document.file_name,
          mimeType: document.mime_type,
          sizeBytes: document.size_bytes,
          sha256: document.sha256,
          documentKind: document.document_kind,
          recordType: document.record_type,
          blockchainTxHash: document.blockchain_tx_hash,
          blockchainRecordId: document.blockchain_record_id,
          expenseId: document.expense_id,
          createdAt: document.created_at,
          url: `/api/documents/${document.id}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected receipt upload failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
