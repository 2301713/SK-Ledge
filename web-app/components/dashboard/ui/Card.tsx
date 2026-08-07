import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  eyebrow,
  action,
  className = "",
}: CardHeaderProps) {
  return (
    <div className={`mb-6 flex items-start justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-foreground">
            {eyebrow}
          </p>
        )}
        <h3 className="text-lg font-bold tracking-tight text-primary-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-secondary-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
