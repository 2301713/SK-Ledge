import { supabase } from "@/lib/supabase";

const DAY_MS = 24 * 60 * 60 * 1000;

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
}

export interface VendorProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role_type: string | null;
  barangay: string | null;
  approval_status: string | null;
  account_status: boolean | null;
  avatar_url: string | null;
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

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

export async function fetchOpenProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_open_for_bidding", true)
    .order("bid_deadline", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ProjectRow[]).map(toProject).filter((p) => p.acceptingBids);
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

export async function fetchMyBids(userId: string): Promise<BidItem[]> {
  const { data, error } = await supabase
    .from("bids")
    .select(
      "id, project_id, contract_title, department, status, submitted_on, created_at, amount_php",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as BidItem[];
}

export async function fetchMyBidsCounts(userId: string) {
  const bids = await fetchMyBids(userId);
  return {
    total: bids.length,
    pending: bids.filter((bid) => bidStatusGroup(bid.status) === "Pending").length,
    won: bids.filter((bid) => bidStatusGroup(bid.status) === "Won").length,
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
      "id, full_name, email, role_type, barangay, approval_status, account_status, avatar_url",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as VendorProfile) ?? null;
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
