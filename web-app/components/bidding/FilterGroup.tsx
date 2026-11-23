import { ChevronDown } from "lucide-react";
import type { FilterGroupProps } from "../../app/open_bidding/types";

export default function FilterGroup({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: FilterGroupProps) {
  return (
    <div className="px-1.5">
      <label className="mb-1 block text-[9px] font-black uppercase leading-none tracking-widest text-secondary-foreground">
        {label}
      </label>
      <div className="relative flex items-center">
        <select
          aria-label={`Filter by ${label}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="cursor-pointer appearance-none truncate bg-transparent pr-7 text-xs font-bold text-primary-foreground outline-none transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-0 flex h-5 w-5 items-center justify-center rounded-md bg-secondary">
          <ChevronDown size={12} />
        </span>
      </div>
    </div>
  );
}
