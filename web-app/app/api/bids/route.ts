import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { parseProposalUrl, PROPOSAL_URL_PREFIX } from "@/lib/bidProposal";
import {
  biddingAvailability,
  BIDDING_NOT_APPROVED_MESSAGE,
} from "@/lib/projectApproval";

export const runtime = "nodejs";

const TIMELINE_MAX = 120;
const NOTES_MAX = 1000;
const PROPOSAL_URL_MAX = 2048;

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("Bid submission is missing required Supabase configuration.");
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

      console.error("Bid submission authentication failed.", {
        status: authError.status ?? "unknown",
      });
      return errorResponse("Authentication service unavailable.", 500);
    }

    if (!user) {
      return errorResponse("Unauthenticated. Valid session cookie required.", 401);
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
    const projectId = readString(payload.project_id)?.trim() ?? "";
    const amountPhp = payload.amount_php;
    const timeline = readString(payload.timeline)?.trim() ?? "";
    const notes = readString(payload.notes)?.trim() ?? "";
    const proposalUrl = readString(payload.proposal_url)?.trim() ?? "";

    if (
      projectId.length === 0 ||
      projectId.length > 128
    ) {
      return errorResponse(
        "Invalid project_id. A project id is required.",
        400,
      );
    }

    if (
      typeof amountPhp !== "number" ||
      !Number.isFinite(amountPhp) ||
      amountPhp <= 0
    ) {
      return errorResponse(
        "Invalid amount_php. It must be a positive number in pesos.",
        400,
      );
    }

    if (timeline.length === 0 || timeline.length > TIMELINE_MAX) {
      return errorResponse(
        `Invalid timeline. It must contain 1 to ${TIMELINE_MAX} characters.`,
        400,
      );
    }

    if (notes.length > NOTES_MAX) {
      return errorResponse(
        `Invalid notes. They may contain at most ${NOTES_MAX} characters.`,
        400,
      );
    }

    if (proposalUrl.length > PROPOSAL_URL_MAX) {
      return errorResponse("Invalid proposal_url. It is too long.", 400);
    }

    if (proposalUrl.length > 0) {
      if (proposalUrl.startsWith(PROPOSAL_URL_PREFIX)) {
        const proposalStoragePath = parseProposalUrl(proposalUrl);

        if (!proposalStoragePath) {
          return errorResponse(
            "Invalid proposal_url. The uploaded proposal reference is malformed.",
            400,
          );
        }

        if (!proposalStoragePath.startsWith(`${user.id}/`)) {
          return errorResponse(
            "Forbidden. The uploaded proposal does not belong to your account.",
            403,
          );
        }
      } else if (!isHttpUrl(proposalUrl)) {
        return errorResponse(
          "Invalid proposal_url. Upload a proposal file or provide an http(s) URL.",
          400,
        );
      }
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
      .select("role_type, approval_status, company_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load bid submission profile.", {
        code: profileError.code,
      });
      return errorResponse("Failed to verify bidder permissions.", 500);
    }

    if (profile?.role_type !== "Vendor") {
      return errorResponse(
        "Forbidden. Only registered vendors may submit bids.",
        403,
      );
    }

    if (profile.approval_status !== "approved") {
      return errorResponse(
        "Forbidden. Your vendor account is pending administrator approval.",
        403,
      );
    }

    if (!profile.company_name?.trim()) {
      return errorResponse(
        "Forbidden. Register your vendor company before submitting bids.",
        403,
      );
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, name, budget, status, is_open_for_bidding, bid_deadline")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Failed to load bid project.", {
        code: projectError.code,
      });
      return errorResponse("Failed to verify the bidding project.", 500);
    }

    if (!project) {
      return errorResponse("Project was not found.", 404);
    }

    const availability = biddingAvailability(project);
    if (!availability.allowed) {
      return errorResponse(
        availability.reason ?? BIDDING_NOT_APPROVED_MESSAGE,
        409,
      );
    }

    if (!project.bid_deadline) {
      // biddingAvailability already rejects a missing deadline; kept explicit so
      // the budget check below never runs on an unbounded procurement.
      return errorResponse(
        "This project does not have a valid bidding deadline.",
        409,
      );
    }

    const approvedBudget = Number(project.budget);
    if (!Number.isFinite(approvedBudget) || approvedBudget <= 0) {
      console.error("Bid project has an invalid budget.");
      return errorResponse("Project budget is invalid.", 500);
    }

    if (amountPhp > approvedBudget) {
      return errorResponse(
        "Your bid exceeds the approved budget for this project.",
        400,
      );
    }

    const { data: existingBid, error: duplicateError } = await supabaseAdmin
      .from("bids")
      .select("id")
      .eq("project_id", projectId)
      .eq("vendor_id", user.id)
      .limit(1)
      .maybeSingle();

    if (duplicateError) {
      console.error("Failed to check for a duplicate bid.", {
        code: duplicateError.code,
      });
      return errorResponse("Failed to check for an existing bid.", 500);
    }

    if (existingBid) {
      return errorResponse(
        "You have already submitted a bid for this project.",
        409,
      );
    }

    const { data: bid, error: insertError } = await supabaseAdmin
      .from("bids")
      .insert([
        {
          project_id: projectId,
          vendor_id: user.id,
          contract_title: project.name,
          amount_php: Math.round(amountPhp * 100) / 100,
          timeline,
          notes: notes || null,
          proposal_url: proposalUrl || null,
          status: "pending",
          submitted_on: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert bid.", { code: insertError.code });
      return errorResponse("Failed to save bid.", 500);
    }

    return NextResponse.json({ data: bid }, { status: 201 });
  } catch (error) {
    console.error("Unexpected bid submission failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
