import { StatusType } from "../types";

export default function StatusBadge({ status }: { status: StatusType }) {
  const config = {
    ongoing: "bg-ongoing/10 text-ongoing border-ongoing/20",
    done: "bg-success/10 text-success border-success/20",
    pending: "bg-pending/10 text-pending border-pending/20",
  };

  const labels = { ongoing: "Ongoing", done: "Completed", pending: "Pending" };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${config[status] ?? "bg-slate-800 text-slate-400 border-white/10"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
