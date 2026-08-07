import { StatusType } from "../../app/public_portal/types";

export default function StatusBadge({ status }: { status: StatusType }) {
  const config: Record<StatusType, string> = {
    Ongoing: "bg-ongoing/10 text-ongoing border-ongoing/20",
    Completed: "bg-success/10 text-success border-success/20",
    Pending: "bg-pending/10 text-pending border-pending/20",
    Approved: "bg-primary/10 text-primary border-primary/20",
  };

  const labels: Record<StatusType, string> = {
    Ongoing: "Ongoing",
    Completed: "Completed",
    Pending: "Pending",
    Approved: "Approved",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${config[status] ?? "bg-secondary text-secondary-foreground border-border"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
