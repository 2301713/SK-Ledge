import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";
import {
  canPublishForBidding,
  canRecordProjectDecision,
  PROJECT_APPROVER_ROLE,
} from "@/lib/projectApproval";

export const runtime = "nodejs";

const REMARKS_MAX = 1000;
const REASON_MAX = 1000;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

const parseDate = (value: unknown): string | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const readText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) {
      return errorResponse("Invalid project reference.", 400);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error(
        "Project approval is missing required Supabase configuration.",
      );
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

    if (authError || !user) {
      return errorResponse(
        "Unauthenticated. Valid session cookie required.",
        401,
      );
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
      .select("id, role_type, approval_status, barangay")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load project approval profile.", {
        code: profileError.code,
      });
      return errorResponse("Failed to verify your permissions.", 500);
    }

    if (!canRecordProjectDecision(profile?.role_type, profile?.approval_status)) {
      return errorResponse(
        "Forbidden. Only an approved SK Chairperson may record project approval or rejection.",
        403,
      );
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
    const action = readText(payload.action);

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select(
        "id, name, status, barangay, location, is_open_for_bidding, bid_deadline",
      )
      .eq("id", id)
      .maybeSingle();

    if (projectError) {
      console.error("Failed to load project for approval.", {
        code: projectError.code,
      });
      return errorResponse("Failed to load the project.", 500);
    }

    if (!project) {
      return errorResponse("Project was not found.", 404);
    }

    const projectBarangay =
      canonicalizeBarangay(project.location ?? "") ||
      canonicalizeBarangay(project.barangay ?? "");
    const officialBarangay = canonicalizeBarangay(profile?.barangay ?? "");

    if (!projectBarangay || projectBarangay !== officialBarangay) {
      return errorResponse(
        "Forbidden. The project belongs to a different barangay.",
        403,
      );
    }

    if (action === "approve" || action === "reject") {
      if (project.status !== "Proposed") {
        return errorResponse(
          `This project is already ${project.status}. A recorded approval decision cannot be changed.`,
          409,
        );
      }

      const decisionDate =
        action === "approve"
          ? parseDate(payload.approval_date)
          : parseDate(payload.rejection_date);

      if (!decisionDate) {
        return errorResponse(
          action === "approve"
            ? "A valid approval date is required."
            : "A valid rejection date is required.",
          400,
        );
      }

      if (action === "approve") {
        const remarks = readText(payload.approval_remarks);
        if (remarks.length === 0 || remarks.length > REMARKS_MAX) {
          return errorResponse(
            `Approval remarks are required and must be ${REMARKS_MAX} characters or fewer.`,
            400,
          );
        }

        const documentId = readText(payload.approval_document_id);
        if (documentId) {
          if (!UUID_RE.test(documentId)) {
            return errorResponse("Invalid approval document reference.", 400);
          }

          const { data: document, error: documentError } = await supabaseAdmin
            .from("documents")
            .select("id")
            .eq("id", documentId)
            .eq("uploaded_by", user.id)
            .maybeSingle();

          if (documentError) {
            console.error("Failed to verify approval document.", {
              code: documentError.code,
            });
            return errorResponse("Failed to verify the approval document.", 500);
          }

          if (!document) {
            return errorResponse(
              "The approval document was not uploaded from your account.",
              400,
            );
          }
        }

        const { data: updated, error: updateError } = await supabaseAdmin
          .from("projects")
          .update({
            status: "Approved",
            approval_date: decisionDate,
            approval_remarks: remarks,
            approved_by: user.id,
            approval_document_id: documentId || null,
            rejection_date: null,
            rejection_reason: null,
            is_open_for_bidding: false,
          })
          .eq("id", project.id)
          .eq("status", "Proposed")
          .select(
            "id, status, approval_date, approval_remarks, approved_by, approval_document_id, status_updated_at",
          )
          .maybeSingle();

        if (updateError) {
          console.error("Failed to record project approval.", {
            code: updateError.code,
          });
          return errorResponse(
            `Failed to record the approval: ${updateError.message}`,
            500,
          );
        }

        if (!updated) {
          return errorResponse(
            "The project changed before the approval was saved. Refresh and try again.",
            409,
          );
        }

        return NextResponse.json({ data: updated });
      }

      const reason = readText(payload.rejection_reason);
      if (reason.length === 0 || reason.length > REASON_MAX) {
        return errorResponse(
          `A rejection reason is required and must be ${REASON_MAX} characters or fewer.`,
          400,
        );
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("projects")
        .update({
          status: "Rejected",
          rejection_date: decisionDate,
          rejection_reason: reason,
          is_open_for_bidding: false,
          bid_deadline: null,
        })
        .eq("id", project.id)
        .eq("status", "Proposed")
        .select(
          "id, status, rejection_date, rejection_reason, status_updated_at",
        )
        .maybeSingle();

      if (updateError) {
        console.error("Failed to record project rejection.", {
          code: updateError.code,
        });
        return errorResponse(
          `Failed to record the rejection: ${updateError.message}`,
          500,
        );
      }

      if (!updated) {
        return errorResponse(
          "The project changed before the rejection was saved. Refresh and try again.",
          409,
        );
      }

      return NextResponse.json({ data: updated });
    }

    if (action === "publish_bidding" || action === "close_bidding") {
      if (profile?.role_type !== PROJECT_APPROVER_ROLE) {
        return errorResponse(
          "Forbidden. Only the SK Chairperson may open or close project bidding.",
          403,
        );
      }

      if (action === "close_bidding") {
        const { data: updated, error: closeError } = await supabaseAdmin
          .from("projects")
          .update({ is_open_for_bidding: false })
          .eq("id", project.id)
          .select("id, status, is_open_for_bidding, bid_deadline")
          .maybeSingle();

        if (closeError || !updated) {
          return errorResponse("Failed to close bidding.", 500);
        }

        return NextResponse.json({ data: updated });
      }

      if (!canPublishForBidding(project)) {
        return errorResponse(
          "This project has not been officially approved for bidding.",
          409,
        );
      }

      const deadline = parseDate(payload.bid_deadline);
      if (!deadline) {
        return errorResponse("A valid bidding deadline is required.", 400);
      }

      if (Date.parse(deadline) <= Date.now()) {
        return errorResponse("The bidding deadline must be in the future.", 400);
      }

      const { data: updated, error: publishError } = await supabaseAdmin
        .from("projects")
        .update({
          is_open_for_bidding: true,
          bid_deadline: deadline,
        })
        .eq("id", project.id)
        .eq("status", "Approved")
        .select("id, status, is_open_for_bidding, bid_deadline")
        .maybeSingle();

      if (publishError) {
        console.error("Failed to open project bidding.", {
          code: publishError.code,
        });
        return errorResponse(
          `Failed to open bidding: ${publishError.message}`,
          500,
        );
      }

      if (!updated) {
        return errorResponse(
          "Only an approved project can be opened for bidding.",
          409,
        );
      }

      return NextResponse.json({ data: updated });
    }

    return errorResponse(
      "Invalid action. Use approve, reject, publish_bidding, or close_bidding.",
      400,
    );
  } catch (error) {
    console.error("Unexpected project approval failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
