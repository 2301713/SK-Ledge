import type { StatCardProps } from "../../app/open_bidding/types";

export default function StatCard({
  icon,
  label,
  value,
  lineColor,
  isActive,
  subtitle,
}: StatCardProps) {
  return (
    <div
      className={`relative p-6 rounded-3xl border bg-white overflow-hidden transition-all duration-300 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] ${
        isActive ? "ring-1 ring-primary/15 border-primary/20" : "border-border"
      }`}
    >
      <div
        className={`absolute top-0 left-6 right-6 h-1 rounded-b-full ${lineColor} opacity-70`}
      />
      <div className="flex justify-between items-start mb-5 pt-2">
        <div className="p-2.5 bg-secondary rounded-xl border border-border">
          {icon}
        </div>
        {isActive && (
          <div className="w-6 h-6 rounded-full border-2 border-primary/25 border-t-primary animate-[spin_3s_linear_infinite]" />
        )}
      </div>
      <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest leading-none">
        {label}
      </p>
      <h3 className="text-2xl font-extrabold mt-2 tracking-tight text-primary-foreground tabular-nums">
        {value}
      </h3>
      {subtitle && (
        <p className="text-[10px] text-secondary-foreground font-bold uppercase tracking-wider mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
