const STATUS_MAP: Record<
  string,
  { pill: string; dot: string; label: string }
> = {
  approved: { pill: "bg-success/10 text-success", dot: "bg-success", label: "Approved" },
  completed: { pill: "bg-success/10 text-success", dot: "bg-success", label: "Completed" },
  rejected: { pill: "bg-danger/10 text-danger", dot: "bg-danger", label: "Rejected" },
  pending: { pill: "bg-pending/10 text-pending", dot: "bg-pending", label: "Pending" },
  "in progress": {
    pill: "bg-ongoing/10 text-ongoing",
    dot: "bg-ongoing",
    label: "In Progress",
  },
  active: { pill: "bg-information/10 text-information", dot: "bg-information", label: "Active" },
  verified: { pill: "bg-success/10 text-success", dot: "bg-success", label: "Verified" },
  flagged: { pill: "bg-danger/10 text-danger", dot: "bg-danger", label: "Flagged" },
  clean: { pill: "bg-success/10 text-success", dot: "bg-success", label: "Clean" },
  "pending docs": {
    pill: "bg-pending/10 text-pending",
    dot: "bg-pending",
    label: "Incomplete",
  },
  evaluation: {
    pill: "bg-pending/10 text-pending",
    dot: "bg-pending",
    label: "Evaluation",
  },
  authorized: {
    pill: "bg-success/10 text-success",
    dot: "bg-success",
    label: "Authorized",
  },
};

interface StatusBadgeProps {
  status?: string | null;
  showDot?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  showDot = false,
  className = "",
}: StatusBadgeProps) {
  const normalized = (status ?? "pending")
    .toString()
    .trim()
    .toLowerCase();
  const config = STATUS_MAP[normalized] ?? {
    pill: "bg-secondary text-secondary-foreground",
    dot: "bg-secondary-foreground",
    label: status || "Unknown",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.pill} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />}
      {config.label}
    </span>
  );
}
