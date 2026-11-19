export const AUDIT_STATUSES = ["clean", "flagged", "incomplete"] as const;

export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  clean: "Clean",
  flagged: "Flagged",
  incomplete: "Incomplete",
};

/** Maps an audit outcome onto the existing expense compliance labels. */
export const AUDIT_COMPLIANCE_LABELS: Record<
  AuditStatus,
  "Clean" | "Flagged" | "Pending Docs"
> = {
  clean: "Clean",
  flagged: "Flagged",
  incomplete: "Pending Docs",
};

export const AUDIT_FINDINGS_MAX_LENGTH = 4000;

export interface ExpenseAudit {
  id: string;
  expense_id: string;
  reviewed_by?: string | null;
  status: AuditStatus;
  findings: string;
  created_at: string;
}

export function isAuditStatus(value: unknown): value is AuditStatus {
  return (
    typeof value === "string" &&
    (AUDIT_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeFindings(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Returns a user-facing error, or null when the review is valid. */
export function validateAuditReview(
  status: unknown,
  findings: unknown,
): string | null {
  if (!isAuditStatus(status)) {
    return "Select a valid audit outcome.";
  }

  const normalized = normalizeFindings(findings);
  if (normalized.length > AUDIT_FINDINGS_MAX_LENGTH) {
    return `Findings must be ${AUDIT_FINDINGS_MAX_LENGTH} characters or fewer.`;
  }

  if (status !== "clean" && normalized.length === 0) {
    return "Findings are required for flagged or incomplete vouchers.";
  }

  return null;
}
