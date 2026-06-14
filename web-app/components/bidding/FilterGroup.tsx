import { ChevronDown } from "lucide-react";
import type { FilterGroupProps } from "../../app/open_bidding/types";

export default function FilterGroup({ label, value }: FilterGroupProps) {
  return (
    <div className="flex flex-col text-sm px-2">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
        {label}
      </p>
      <div className="flex items-center gap-1 font-bold text-slate-700 cursor-pointer hover:text-slate-900">
        {value} <ChevronDown size={14} />
      </div>
    </div>
  );
}
