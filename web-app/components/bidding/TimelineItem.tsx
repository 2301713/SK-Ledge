import { Star } from "lucide-react";
import type { TimelineItemProps } from "../../app/open_bidding/types";

export default function TimelineItem({
  label,
  date,
  active,
  isStar,
  isInactive,
}: TimelineItemProps) {
  return (
    <div className={`relative pl-8 ${isInactive ? "opacity-60" : ""}`}>
      <div
        className={`absolute left-0 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${
          active
            ? "border-primary bg-primary shadow-[0_0_0_4px_rgba(1,56,168,0.08)]"
            : "border-border bg-white"
        }`}
      />

      <p className="text-[9px] font-black uppercase tracking-[0.24em] text-secondary-foreground">
        {label}
      </p>

      <div className="mt-1.5 flex items-center gap-2">
        <span
          className={`text-sm font-bold ${
            active ? "text-primary-foreground" : "text-secondary-foreground"
          }`}
        >
          {date ?? "Awaiting schedule"}
        </span>
        {isStar && <Star size={13} className="fill-tertiary text-tertiary" />}
      </div>
    </div>
  );
}
