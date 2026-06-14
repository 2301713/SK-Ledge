import type { StatusBadgeProps } from "../../app/open_bidding/types";

export default function StatusBadge({ status, isLarge }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    "Accepting Bids": "bg-emerald-100 text-emerald-700 border-emerald-200",
    Awarded: "bg-sky-100 text-sky-700 border-sky-200",
    Evaluation: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`flex items-center gap-2 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
        styles[status] || "bg-slate-100 text-slate-700 border-slate-200"
      } ${isLarge ? "py-2 px-6" : ""}`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full bg-current ${
          status === "Accepting Bids" ? "animate-pulse" : ""
        }`}
      />
      {status}
    </span>
  );
}
