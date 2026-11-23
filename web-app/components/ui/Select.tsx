"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Classes for the positioning wrapper (e.g. width, margins). */
  wrapperClassName?: string;
  /** Dense toolbar/filter sizing. */
  compact?: boolean;
  /** Borderless inline variant for toolbars that already have a container. */
  plain?: boolean;
  /** Leave room on the left for an icon rendered by the parent. */
  leading?: boolean;
};

/**
 * Native <select> styled to match the SK-Ledge design system.
 *
 * The browser's own select chrome (arrow, bevel) is removed with
 * `appearance-none` and replaced by a themed chevron, so the control reads as
 * part of the interface instead of a default OS widget. Options stay native,
 * which keeps keyboard and mobile behaviour intact for long lists such as the
 * 851 canonical barangays.
 *
 * Padding, border and typography are owned here; callers pass only layout
 * utilities (width, margins) so conflicting Tailwind classes cannot creep in.
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    wrapperClassName = "",
    compact = false,
    plain = false,
    leading = false,
    className = "",
    children,
    ...props
  },
  ref,
) {
  const base = plain
    ? "peer w-full cursor-pointer appearance-none rounded-xl border-0 bg-transparent py-0 pr-6 text-sm font-bold text-primary-foreground outline-none transition-colors hover:text-primary focus:text-primary disabled:cursor-not-allowed disabled:text-secondary-foreground"
    : [
        "peer w-full cursor-pointer appearance-none rounded-2xl border border-border bg-white",
        "font-semibold text-primary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        "transition-all hover:border-primary/40",
        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
        "disabled:cursor-not-allowed disabled:bg-secondary/60 disabled:text-secondary-foreground",
        compact ? "py-2 pr-9 text-xs" : "py-3.5 pr-11 text-sm",
      ].join(" ");

  const leftPadding = plain
    ? ""
    : leading
      ? compact
        ? "pl-9"
        : "pl-12"
      : compact
        ? "pl-3"
        : "pl-4";

  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        ref={ref}
        className={[base, leftPadding, className].filter(Boolean).join(" ")}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary-foreground transition-colors peer-focus:text-primary ${
          plain ? "h-4 w-4" : compact ? "h-3.5 w-3.5" : "h-4 w-4"
        }`}
      />
    </div>
  );
});

export default Select;
