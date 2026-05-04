export default function MetricCard({
  label,
  value,
  sub,
  valueColor = "text-primary",
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
    <div className="bg-secondary rounded-2xl p-6 border border-black/20 hover:border-black/40 transition-all duration-200 relative overflow-hidden flex flex-col justify-between group">
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-4 bottom-4 w-0.75 rounded-full ${accent}`}
      />

      <div className="pl-3">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">
            {label}
          </p>
          {icon && (
            <div className="opacity-50 group-hover:opacity-60 transition-opacity">
              {icon}
            </div>
          )}
        </div>
        <p
          className={`text-3xl font-extrabold tracking-tight tabular-nums ${valueColor}`}
        >
          {value}
        </p>
        <p className="text-[10px] text-slate-600 font-semibold mt-2 uppercase tracking-wider">
          {sub}
        </p>
      </div>
    </div>
  );
}
