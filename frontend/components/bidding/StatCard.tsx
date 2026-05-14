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
      className={`p-6 rounded-3xl border border-slate-200 relative overflow-hidden transition-all duration-300 ${
        isActive ? "bg-slate-50 ring-1 ring-sky-100" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-2 bg-slate-100 rounded-xl border border-slate-200">
          {icon}
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-sky-500 animate-[spin_3s_linear_infinite]" />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
        {label}
      </p>
      <h3 className="text-2xl font-black mt-2 tracking-tight text-slate-900">
        {value}
      </h3>
      {subtitle && (
        <p className="text-[10px] text-slate-400 font-bold tracking-tighter mt-1">
          {subtitle}
        </p>
      )}
      <div
        className={`absolute bottom-0 left-4 right-4 h-0.5 ${lineColor} opacity-60`}
      />
    </div>
  );
}
