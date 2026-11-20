import { supabase } from "@/lib/supabase";

const DAY_MS = 24 * 60 * 60 * 1000;

export const PROJECTS_PAGE_SIZE = 20;
export const BIDS_PAGE_SIZE = 20;
export const NOTIFICATIONS_PAGE_SIZE = 20;

export interface PageOptions {
  limit?: number;
  offset?: number;
}

export type BidStatusGroup = "Pending" | "Won" | "Lost" | "Withdrawn";
export const BID_TABS = ["All", "Pending", "Won", "Lost"] as const;
export type BidTab = (typeof BID_TABS)[number];

export interface ProjectRow {
  id: string;
  name: string;
  category: string | null;
  budget: number | string | null;
  status: string | null;
  location: string | null;
  barangay: string | null;
  description: string | null;
  bid_deadline: string | null;
  is_open_for_bidding: boolean | null;
  created_at: string | null;
  winning_bidder_name?: string | null;
  award_tx_hash?: string | null;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  location: string;
  description: string;
  budget: number;
  deadline: string | null;
  createdAt: string | null;
  status: string;
  acceptingBids: boolean;
  daysLeft: number | null;
  winningBidder: string | null;
}

export interface BidItem {
  id: string;
  project_id: string | null;
  contract_title: string | null;
  department: string | null;
  status: string;
  submitted_on: string | null;
  created_at: string | null;
  amount_php: number | string | null;
  vendor_name?: string | null;
}

export interface BidDetail extends BidItem {
  timeline: string | null;
  notes: string | null;
  proposal_path: string | null;
  proposal_url: string | null;
}

export interface BidEvent {
  id: string;
  bid_id: string;
  status: string;
  previous_status: string | null;
  created_at: string | null;
}

export interface BidNotification {
  id: string;
  bid_id: string;
  status: string;
  previous_status: string | null;
  created_at: string | null;
  contract_title: string | null;
  vendor_name: string | null;
}

export interface VendorProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role_type: string | null;
  barangay: string | null;
  contact_number: string | null;
  approval_status: string | null;
  account_status: boolean | null;
  avatar_url: string | null;
}

export interface VendorProfileUpdate {
  full_name: string;
  contact_number: string | null;
  barangay: string;
}

export const formatPeso = (value: number | string | null | undefined) =>
  `\u20B1${Number(value ?? 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getDaysLeft = (deadline: string | null | undefined) => {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / DAY_MS);
};

export const daysLeftLabel = (project: Project) => {
  if (!project.acceptingBids) return project.status;
  if (project.daysLeft === null) return "Open for bids";
  if (project.daysLeft <= 0) return "Closing today";
  return `Closes in ${project.daysLeft}d`;
};

const isProjectAccepting = (row: ProjectRow) => {
  if (row.is_open_for_bidding !== true) return false;
  const status = (row.status ?? "").trim().toLowerCase();
  if (status === "awarded" || status === "evaluation") return false;
  const daysLeft = getDaysLeft(row.bid_deadline);
  return daysLeft === null || daysLeft >= 0;
};

export const toProject = (row: ProjectRow): Project => {
  const status = (row.status ?? "").trim();
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "General",
    location: row.location || row.barangay || "Batangas",
    description: row.description ?? "",
    budget: Number(row.budget ?? 0),
    deadline: row.bid_deadline,
    createdAt: row.created_at,
    status: status || "Open",
    acceptingBids: isProjectAccepting(row),
    daysLeft: getDaysLeft(row.bid_deadline),
    winningBidder: row.winning_bidder_name ?? null,
  };
};

export { getErrorMessage } from "@/lib/errors";

export async function fetchOpenProjectsPage(
  options: PageOptions = {},
): Promise<{ projects: Project[]; hasMore: boolean }> {
  const limit = options.limit ?? PROJECTS_PAGE_SIZE;
  const offset = options.offset ?? 0;

  // Fetch one extra row so hasMore reflects the database, not the client-side
  // deadline filter below.
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_open_for_bidding", true)
    .order("bid_deadline", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true })
    .range(offset, offset + limit);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ProjectRow[];

  return {
    projects: rows.slice(0, limit).map(toProject).filter((p) => p.acceptingBids),
    hasMore: rows.length > limit,
  };
}

export async function fetchOpenProjects(
  options: PageOptions = {},
): Promise<Project[]> {
  const { projects } = await fetchOpenProjectsPage(options);
  return projects;
}

export async function fetchProjectById(id: string): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("This procurement is no longer available.");
  return toProject(data as ProjectRow);
}

export const normalizeBidStatus = (status: string | null | undefined) =>
  (status ?? "").trim().toLowerCase();

export const bidStatusGroup = (
  status: string | null | undefined,
): BidStatusGroup => {
  const normalized = normalizeBidStatus(status);
  if (["won", "awarded"].includes(normalized)) return "Won";
  if (["lost", "rejected", "declined"].includes(normalized)) return "Lost";
  if (normalized === "withdrawn") return "Withdrawn";
  return "Pending";
};

export const bidStatusLabel = (status: string | null | undefined) => {
  const group = bidStatusGroup(status);
  if (normalizeBidStatus(status) === "recommended") return "Recommended";
  if (normalizeBidStatus(status) === "withdrawn") return "Withdrawn";
  return group;
};

export const canWithdrawBid = (status: string | null | undefined) =>
  ["pending", "recommended"].includes(normalizeBidStatus(status));

export async function fetchMyBids(
  userId: string,
  options: PageOptions = {},
): Promise<BidItem[]> {
  const limit = options.limit ?? BIDS_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const [{ data, error }, profile] = await Promise.all([
    supabase
      .from("bids")
      .select(
        "id, project_id, contract_title, department, status, submitted_on, created_at, amount_php",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1),
    fetchMyProfile(userId).catch(() => null),
  ]);

  if (error) throw new Error(error.message);

  const vendorName =
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    null;

  return ((data ?? []) as BidItem[]).map((bid) => ({
    ...bid,
    vendor_name: vendorName,
  }));
}

export async function fetchBidById(
  userId: string,
  bidId: string,
): Promise<BidDetail> {
  const { data, error } = await supabase
    .from("bids")
    .select(
      "id, project_id, contract_title, department, status, submitted_on, created_at, amount_php, timeline, notes, proposal_path, proposal_url, vendor_name",
    )
    .eq("id", bidId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("This bid is no longer available.");
  return data as BidDetail;
}

export async function fetchBidEvents(bidId: string): Promise<BidEvent[]> {
  const { data, error } = await supabase
    .from("bid_events")
    .select("id, bid_id, status, previous_status, created_at")
    .eq("bid_id", bidId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as BidEvent[];
}

export async function fetchBidNotifications(
  options: PageOptions = {},
): Promise<BidNotification[]> {
  const limit = options.limit ?? NOTIFICATIONS_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const { data, error } = await supabase
    .from("bid_events")
    .select(
      "id, bid_id, status, previous_status, created_at, bids (contract_title, vendor_name)",
    )
    .not("previous_status", "is", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as {
    id: string;
    bid_id: string;
    status: string;
    previous_status: string | null;
    created_at: string | null;
    bids:
      | { contract_title: string | null; vendor_name: string | null }
      | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    bid_id: row.bid_id,
    status: row.status,
    previous_status: row.previous_status,
    created_at: row.created_at,
    contract_title: row.bids?.contract_title ?? null,
    vendor_name: row.bids?.vendor_name ?? null,
  }));
}

export async function fetchNotificationLastSeen(): Promise<string | null> {
  const { data, error } = await supabase
    .from("notification_state")
    .select("last_seen_at")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.last_seen_at ?? null;
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const lastSeenAt = await fetchNotificationLastSeen().catch(() => null);

  let query = supabase
    .from("bid_events")
    .select("id", { count: "exact", head: true })
    .not("previous_status", "is", null);

  if (lastSeenAt) {
    query = query.gt("created_at", lastSeenAt);
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markNotificationsSeen(): Promise<void> {
  const { error } = await supabase.rpc("mark_notifications_seen");
  if (error) throw new Error(error.message);
}

export async function fetchMyBidsCounts(userId: string) {
  const countQuery = () =>
    supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

  const [totalResult, wonResult, lostResult, withdrawnResult] =
    await Promise.all([
      countQuery(),
      countQuery().in("status", ["won", "awarded"]),
      countQuery().in("status", ["lost", "rejected", "declined"]),
      countQuery().eq("status", "withdrawn"),
    ]);

  const error =
    totalResult.error ??
    wonResult.error ??
    lostResult.error ??
    withdrawnResult.error;
  if (error) throw new Error(error.message);

  const total = totalResult.count ?? 0;
  const won = wonResult.count ?? 0;
  const lost = lostResult.count ?? 0;
  const withdrawn = withdrawnResult.count ?? 0;

  return {
    total,
    pending: Math.max(0, total - won - lost - withdrawn),
    won,
  };
}

export async function withdrawBid(bidId: string, userId: string) {
  const { data, error } = await supabase
    .from("bids")
    .update({ status: "withdrawn" })
    .eq("id", bidId)
    .eq("user_id", userId)
    .in("status", ["pending", "recommended"])
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error(
      "This bid can no longer be withdrawn. Refresh to see its latest status.",
    );
  }
}

export async function fetchMyProfile(userId: string): Promise<VendorProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role_type, barangay, contact_number, approval_status, account_status, avatar_url",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as VendorProfile) ?? null;
}

export async function deactivateVendorAccount(): Promise<void> {
  const { error } = await supabase.rpc("deactivate_vendor_account");
  if (error) throw new Error(error.message);
}

export async function updateVendorProfile(input: {
  fullName: string;
  contactNumber: string;
  barangay: string;
}): Promise<VendorProfileUpdate> {
  const { data, error } = await supabase.rpc("update_vendor_profile", {
    p_full_name: input.fullName,
    p_contact_number: input.contactNumber,
    p_barangay: input.barangay,
  });

  if (error) throw new Error(error.message);

  const row = (Array.isArray(data) ? data[0] : data) as
    | VendorProfileUpdate
    | null;

  if (!row) {
    throw new Error("Your profile was not updated. Please try again.");
  }

  return row;
}

export async function hasActiveBid(userId: string, projectId: string) {
  const { data, error } = await supabase
    .from("bids")
    .select("id, status")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);
  return (data ?? []).some(
    (bid) =>
      !["lost", "rejected", "declined", "withdrawn"].includes(
        normalizeBidStatus(bid.status),
      ),
  );
}

export const uniqueCategories = (projects: Project[]) =>
  Array.from(
    new Set(
      projects
        .map((project) => project.category.trim())
        .filter((category) => category.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
