import Select from "../ui/Select";
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
      <Select
        plain
        compact
        aria-label={`Filter by ${label}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        wrapperClassName="w-full"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}
