export default function MetricCard({
  label,
  value,
  sub,
  valueColor = "text-primary-foreground",
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  accent: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] transition-all duration-200 hover:shadow-[0_8px_28px_-10px_rgba(1,56,168,0.25)] overflow-hidden flex flex-col justify-between group">
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-6 right-6 h-1 rounded-b-full ${accent}`}
      />

      <div className="pt-2">
        <div className="flex items-start justify-between mb-4">
          <p className="text-[10px] font-bold text-secondary-foreground uppercase tracking-[0.15em]">
            {label}
          </p>
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-secondary-foreground/10">
              {icon}
            </div>
          )}
        </div>
        <p
          className={`text-3xl font-extrabold tracking-tight tabular-nums ${valueColor}`}
        >
          {value}
        </p>
        <p className="text-[10px] text-secondary-foreground font-semibold mt-2 uppercase tracking-wider">
          {sub}
        </p>
      </div>
    </div>
  );
}
