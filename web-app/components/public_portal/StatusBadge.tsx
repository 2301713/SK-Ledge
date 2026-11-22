export default function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    Ongoing: "bg-ongoing/10 text-ongoing border-ongoing/20",
    Completed: "bg-success/10 text-success border-success/20",
    Pending: "bg-pending/10 text-pending border-pending/20",
    Proposed: "bg-pending/10 text-pending border-pending/20",
    Approved: "bg-primary/10 text-primary border-primary/20",
    "Open for Bidding": "bg-success/10 text-success border-success/20",
    Awarded: "bg-ongoing/10 text-ongoing border-ongoing/20",
    Rejected: "bg-danger/10 text-danger border-danger/20",
  };

  const labels: Record<string, string> = {
    Ongoing: "Ongoing",
    Completed: "Completed",
    Pending: "Pending",
    Proposed: "Proposed",
    Approved: "Approved",
    "Open for Bidding": "Open for Bidding",
    Awarded: "Awarded",
    Rejected: "Rejected",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${config[status] ?? "bg-secondary text-secondary-foreground border-border"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
