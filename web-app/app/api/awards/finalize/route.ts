import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";

export const runtime = "nodejs";

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("Award finalization is missing required Supabase configuration.");
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

    const { project_id, winning_bid_id, award_tx_hash, official_address } =
      body as Record<string, unknown>;

    const projectId =
      typeof project_id === "number" && Number.isSafeInteger(project_id)
        ? project_id
        : typeof project_id === "string" && project_id.trim().length > 0
          ? project_id.trim()
          : null;

    if (projectId === null) {
      return errorResponse("project_id must be a non-empty string or integer.", 400);
    }

    if (typeof winning_bid_id !== "string" || winning_bid_id.trim().length === 0) {
      return errorResponse("winning_bid_id is required.", 400);
    }

    if (
      typeof award_tx_hash !== "string" ||
      !/^0x[a-fA-F0-9]{64}$/.test(award_tx_hash)
    ) {
      return errorResponse(
        "Invalid award_tx_hash. Must be a 0x-prefixed 64-character hex string.",
        400,
      );
    }

    if (typeof official_address !== "string" || !isAddress(official_address)) {
      return errorResponse("Invalid official_address format.", 400);
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
      .select("role_type, approval_status, barangay, wallet_address")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load award finalization profile.", {
        code: profileError.code,
      });
      return errorResponse("Failed to verify user permissions.", 500);
    }

    if (!profile?.role_type || profile.approval_status !== "approved") {
      return errorResponse("Forbidden. An approved user profile is required.", 403);
    }

    if (profile.role_type !== "SK_Chairperson") {
      return errorResponse(
        `Forbidden. Role '${profile.role_type}' cannot award bids.`,
        403,
      );
    }

    if (
      !profile.wallet_address ||
      profile.wallet_address.toLowerCase() !== official_address.toLowerCase()
    ) {
      return errorResponse(
        "Forbidden. The signing wallet does not match your approved profile wallet.",
        403,
      );
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, name, status, barangay, location")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Failed to load project for award finalization.", {
        code: projectError.code,
      });
      return errorResponse("Failed to load the project.", 500);
    }

    if (!project) {
      return errorResponse("Project was not found.", 404);
    }

    if (project.status !== "Approved") {
      return errorResponse(
        "This project has not been officially approved for bidding.",
        409,
      );
    }

    const projectBarangay =
      canonicalizeBarangay(project.location ?? "") ||
      canonicalizeBarangay(project.barangay ?? "");
    const officialBarangay = canonicalizeBarangay(profile.barangay ?? "");

    if (!projectBarangay || projectBarangay !== officialBarangay) {
      return errorResponse(
        "Forbidden. The project belongs to a different barangay.",
        403,
      );
    }

    const { data: winningBid, error: bidError } = await supabaseAdmin
      .from("bids")
      .select("id, project_id, vendor_name, amount_php")
      .eq("id", winning_bid_id)
      .maybeSingle();

    if (bidError) {
      console.error("Failed to load winning bid for award finalization.", {
        code: bidError.code,
      });
      return errorResponse("Failed to load the winning bid.", 500);
    }

    if (!winningBid) {
      return errorResponse("Winning bid was not found.", 404);
    }

    if (String(winningBid.project_id) !== String(project.id)) {
      return errorResponse("The winning bid does not belong to this project.", 400);
    }

    // Award the project first: if anything fails afterwards, we never leave a
    // bid marked as won on a project that is not awarded (the public board
    // derives "Recently Awarded" from projects.status).
    // NOTE: projects.winning_bid_id is a bigint and bids.id is a UUID, so the
    // bid cannot be stored there. The awarded vendor is recorded by name and
    // the on-chain transaction; bids themselves carry the won/lost status.
    const { data: awardedProject, error: awardError } = await supabaseAdmin
      .from("projects")
      .update({
        winning_bidder_name: winningBid.vendor_name,
        award_tx_hash: award_tx_hash.toLowerCase(),
        status: "Awarded",
      })
      .eq("id", project.id)
      .select("id")
      .single();

    if (awardError || !awardedProject) {
      console.error("Failed to mark project as awarded.", {
        code: awardError?.code,
      });
      return errorResponse(
        `Failed to mark the project as awarded: ${
          awardError?.message ?? "no project row was updated"
        }`,
        500,
      );
    }

    const { error: winError } = await supabaseAdmin
      .from("bids")
      .update({ status: "won" })
      .eq("id", winningBid.id);

    if (winError) {
      console.error("Failed to mark winning bid as won.", { code: winError.code });
      return errorResponse(
        `The project was awarded, but the winning bid could not be updated: ${winError.message}`,
        500,
      );
    }

    const { error: loseError } = await supabaseAdmin
      .from("bids")
      .update({ status: "lost" })
      .eq("project_id", project.id)
      .neq("id", winningBid.id);

    if (loseError) {
      // The award itself is complete; losing bids are secondary.
      console.error("Failed to mark losing bids as lost.", {
        code: loseError.code,
      });
    }

    return NextResponse.json({
      project_id: project.id,
      winning_bid_id: winningBid.id,
      status: "Awarded",
    });
  } catch (error) {
    console.error("Unexpected award finalization failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("Internal server error.", 500);
  }
}
