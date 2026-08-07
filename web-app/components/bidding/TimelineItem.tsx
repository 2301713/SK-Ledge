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
    <div className={`relative pl-8 ${isInactive ? "opacity-70" : ""}`}>
      <div
        className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
          active ? "border-primary bg-primary" : "border-border bg-white"
        }`}
      />
      <p className="text-[10px] uppercase tracking-[0.28em] font-black text-secondary-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`text-sm font-black ${active ? "text-primary-foreground" : "text-secondary-foreground"}`}
        >
          {date}
        </span>
        {isStar && <Star size={14} className="text-tertiary fill-tertiary" />}
      </div>
    </div>
  );
}
