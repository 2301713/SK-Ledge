export default function MetricCard({
  label,
  value,
  sub,
  valueColor = "text-primary-foreground",
  accent,
  icon,
  delayMs = 0,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  accent: string;
  icon?: React.ReactNode;
  delayMs?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delayMs}ms` }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] transition duration-200 animate-rise motion-reduce:animate-none hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_14px_34px_-18px_rgba(1,56,168,0.35)] sm:p-6"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accent} opacity-80`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary-foreground">
            {label}
          </p>
          <p
            className={`mt-3 truncate text-3xl font-black tracking-tight tabular-nums ${valueColor}`}
          >
            {value}
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground">
            {sub}
          </p>
        </div>

        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-secondary transition-colors group-hover:bg-secondary-foreground/10">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
