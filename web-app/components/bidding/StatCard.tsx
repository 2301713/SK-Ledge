import type { StatCardProps } from "../../app/open_bidding/types";

export default function StatCard({
  icon,
  label,
  value,
  lineColor,
  isActive,
  subtitle,
  delayMs = 0,
}: StatCardProps) {
  return (
    <div
      style={{ animationDelay: `${delayMs}ms` }}
      className={`relative animate-rise overflow-hidden rounded-3xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] transition duration-200 motion-reduce:animate-none hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(1,56,168,0.3)] sm:p-6 ${
        isActive ? "border-primary/20 ring-1 ring-primary/10" : "border-border"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${lineColor} opacity-70`}
      />

      <div className="mb-4 flex items-start justify-between gap-3 pt-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-secondary">
          {icon}
        </div>
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-primary">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Live
          </span>
        )}
      </div>

      <p className="text-[10px] font-black uppercase leading-none tracking-widest text-secondary-foreground">
        {label}
      </p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-primary-foreground tabular-nums">
        {value}
      </h3>
      {subtitle && (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
