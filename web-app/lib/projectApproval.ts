export const PROJECT_STATUS = {
  proposed: "Proposed",
  approved: "Approved",
  rejected: "Rejected",
  openForBidding: "Open for Bidding",
  awarded: "Awarded",
  completed: "Completed",
} as const;

export const PROJECT_APPROVER_ROLE = "SK_Chairperson";

export const BIDDING_NOT_APPROVED_MESSAGE =
  "This project has not been officially approved for bidding.";

export interface ProjectBiddingFields {
  status?: string | null;
  is_open_for_bidding?: boolean | null;
  bid_deadline?: string | null;
}

const normalize = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

export const isProjectApproved = (project: ProjectBiddingFields) =>
  normalize(project.status) === "approved";

export const canRecordProjectDecision = (
  roleType: string | null | undefined,
  approvalStatus: string | null | undefined,
) =>
  roleType === PROJECT_APPROVER_ROLE &&
  normalize(approvalStatus) === "approved";

export const canPublishForBidding = (project: ProjectBiddingFields) =>
  isProjectApproved(project);

/**
 * Approved-only bidding gate shared by the SK projects UI, the public board,
 * and /api/bids. A project needs approval, an open flag, and a future deadline.
 */
export function biddingAvailability(
  project: ProjectBiddingFields,
  now: number = Date.now(),
): { allowed: boolean; reason: string | null } {
  if (!isProjectApproved(project)) {
    return { allowed: false, reason: BIDDING_NOT_APPROVED_MESSAGE };
  }

  if (project.is_open_for_bidding !== true) {
    return {
      allowed: false,
      reason:
        "Bidding is available only after the project is approved and opened for bidding.",
    };
  }

  if (!project.bid_deadline) {
    return {
      allowed: false,
      reason: "This project does not have a valid bidding deadline.",
    };
  }

  const deadline = Date.parse(project.bid_deadline);
  if (Number.isNaN(deadline)) {
    return {
      allowed: false,
      reason: "This project does not have a valid bidding deadline.",
    };
  }

  if (deadline <= now) {
    return {
      allowed: false,
      reason: "The bidding deadline for this project has passed.",
    };
  }

  return { allowed: true, reason: null };
}

export const isAcceptingBids = (
  project: ProjectBiddingFields,
  now: number = Date.now(),
) => biddingAvailability(project, now).allowed;

/**
 * Lifecycle label for badges. Approval is stored as Approved; publication adds
 * the Open for Bidding label without changing the recorded approval.
 */
export const projectDisplayStatus = (project: ProjectBiddingFields) => {
  if (isProjectApproved(project) && project.is_open_for_bidding === true) {
    return PROJECT_STATUS.openForBidding;
  }
  return project.status?.trim() || PROJECT_STATUS.proposed;
};
