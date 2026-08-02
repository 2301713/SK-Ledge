import { StatusType } from "../../app/public_portal/types";

export default function StatusBadge({ status }: { status: StatusType }) {
  const config: Record<StatusType, string> = {
    Ongoing: "bg-ongoing/10 text-ongoing border-ongoing/20",
    Completed: "bg-success/10 text-success border-success/20",
    Pending: "bg-pending/10 text-pending border-pending/20",
    Approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  const labels: Record<StatusType, string> = {
    Ongoing: "Ongoing",
    Completed: "Completed",
    Pending: "Pending",
    Approved: "Approved",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${config[status] ?? "bg-slate-800 text-slate-400 border-white/10"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
