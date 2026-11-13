import { ChevronDown } from "lucide-react";
import type { FilterGroupProps } from "../../app/open_bidding/types";

export default function FilterGroup({ label, value }: FilterGroupProps) {
  return (
    <div className="px-1.5">
      <p className="mb-1 text-[9px] font-black uppercase leading-none tracking-widest text-secondary-foreground">
        {label}
      </p>
      <div className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-primary-foreground transition-colors hover:text-primary">
        {value}
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-secondary">
          <ChevronDown size={12} />
        </span>
      </div>
    </div>
  );
}
