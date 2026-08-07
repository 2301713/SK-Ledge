import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  trend?: string;
  trendIcon?: LucideIcon;
  variant?: "default" | "brand";
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendIcon: TrendIcon,
  variant = "default",
  className = "",
}: StatCardProps) {
  const isBrand = variant === "brand";

  return (
    <div
      className={`flex flex-col gap-4 rounded-3xl p-6 ${
        isBrand
          ? "bg-primary text-white shadow-[0_8px_28px_-10px_rgba(1,56,168,0.45)]"
          : "border border-border bg-white text-primary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)]"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-xs font-semibold uppercase tracking-widest ${
            isBrand ? "text-white/70" : "text-secondary-foreground"
          }`}
        >
          {label}
        </p>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            isBrand
              ? "bg-white/10 text-white"
              : "bg-secondary text-primary-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div
        className={`text-4xl font-bold tracking-tight ${
          isBrand ? "text-white" : "text-primary-foreground"
        }`}
      >
        {value}
      </div>

      {trend && (
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${
            isBrand ? "text-white/75" : "text-secondary-foreground"
          }`}
        >
          {TrendIcon && <TrendIcon className="h-3.5 w-3.5" />}
          {trend}
        </div>
      )}
    </div>
  );
}
