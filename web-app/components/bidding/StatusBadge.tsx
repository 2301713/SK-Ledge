import type { StatusBadgeProps } from "../../app/open_bidding/types";

export default function StatusBadge({ status, isLarge }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    "Accepting Bids": "bg-success/10 text-success border-success/20",
    Awarded: "bg-primary/10 text-primary border-primary/20",
    Evaluation: "bg-pending/10 text-pending border-pending/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
        styles[status] || "bg-secondary text-secondary-foreground border-border"
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
