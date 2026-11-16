import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  buildProposalUrl,
  isValidProposalStoragePath,
  PROPOSAL_BUCKET,
  PROPOSAL_MAX_BYTES,
  PROPOSAL_MIME_TYPES,
  sanitizeProposalFileName,
} from "@/lib/bidProposal";

export const runtime = "nodejs";

const REVIEWER_ROLES = new Set([
  "SK_Chairperson",
  "SK_Treasurer",
  "COA",
  "SK_Federation",
  "Admin",
]);

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

let bucketReady: Promise<void> | null = null;

async function ensureProposalBucket(admin: SupabaseClient): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data: bucket } = await admin.storage.getBucket(PROPOSAL_BUCKET);
      if (bucket) return;

      const { error } = await admin.storage.createBucket(PROPOSAL_BUCKET, {
        public: false,
        fileSizeLimit: PROPOSAL_MAX_BYTES,
        allowedMimeTypes: [...PROPOSAL_MIME_TYPES],
      });

      if (error) {
        throw new Error(
          `Failed to create ${PROPOSAL_BUCKET}: ${error.message}`,
        );
      }
    })().catch((error) => {
      bucketReady = null;
      throw error;
    });
  }

  return bucketReady;
}

async function getAuthenticatedUser() {
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
        error: errorResponse(
          "Unauthenticated. Valid session cookie required.",
          401,
        ),
      };
    }

    console.error("Proposal request authentication failed.", {
      status: authError.status ?? "unknown",
    });
    return { error: errorResponse("Authentication service unavailable.", 500) };
  }

  if (!user) {
    return {
      error: errorResponse(
        "Unauthenticated. Valid session cookie required.",
        401,
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

export async function POST(req: NextRequest) {
  try {
    const context = await getAuthenticatedUser();
    if ("error" in context) return context.error;

    const { user, admin } = context;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role_type, approval_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load proposal upload profile.", {
        code: profileError.code,
      });
      return errorResponse("Failed to verify bidder permissions.", 500);
    }

    if (profile?.role_type !== "Vendor") {
      return errorResponse(
        "Forbidden. Only registered vendors may upload bid proposals.",
        403,
      );
    }

    if (profile.approval_status !== "approved") {
      return errorResponse(
        "Forbidden. Your vendor account is pending administrator approval.",
        403,
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
      return errorResponse("A proposal file is required.", 400);
    }

    if (file.size === 0) {
      return errorResponse("The proposal file is empty.", 400);
    }

    if (file.size > PROPOSAL_MAX_BYTES) {
      return errorResponse("Proposal file must be 10 MB or smaller.", 400);
    }

    if (
      !(PROPOSAL_MIME_TYPES as readonly string[]).includes(file.type)
    ) {
      return errorResponse(
        "Invalid file type. Upload a PDF, DOC, or DOCX document.",
        400,
      );
    }

    await ensureProposalBucket(admin);

    const storagePath = `${user.id}/${crypto.randomUUID()}-${sanitizeProposalFileName(
      file.name,
    )}`;

    const { error: uploadError } = await admin.storage
      .from(PROPOSAL_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Failed to upload bid proposal.", {
        message: uploadError.message,
      });
      return errorResponse("Failed to upload the proposal document.", 500);
    }

    return NextResponse.json(
      {
        data: {
          path: storagePath,
          url: buildProposalUrl(storagePath),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected proposal upload failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const context = await getAuthenticatedUser();
    if ("error" in context) return context.error;

    const { user, admin } = context;
    const path = req.nextUrl.searchParams.get("path");

    if (!path || !isValidProposalStoragePath(path)) {
      return errorResponse("Invalid proposal reference.", 400);
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role_type, approval_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load proposal viewer profile.", {
        code: profileError.code,
      });
      return errorResponse("Failed to verify document permissions.", 500);
    }

    if (!profile?.role_type) {
      return errorResponse("Forbidden. A registered profile is required.", 403);
    }

    const isOwner = path.startsWith(`${user.id}/`);
    const canReview =
      REVIEWER_ROLES.has(profile.role_type) &&
      profile.approval_status === "approved";

    if (!isOwner && !canReview) {
      return errorResponse(
        "Forbidden. You may not view this proposal document.",
        403,
      );
    }

    const { data, error } = await admin.storage
      .from(PROPOSAL_BUCKET)
      .createSignedUrl(path, 600);

    if (error || !data?.signedUrl) {
      console.error("Failed to sign proposal document URL.", {
        message: error?.message ?? "No signed URL returned",
      });
      return errorResponse("Proposal document was not found.", 404);
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Unexpected proposal lookup failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
