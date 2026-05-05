import Link from "next/link";
import { Layers, ExternalLink, Activity } from "lucide-react";

export default function PortalNav() {
  return (
    <nav className="sticky top-0 z-50 px-6 pt-4 pb-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-13 px-5 py-3 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/25">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white leading-none tracking-tight">
                SK-Ledge
              </p>
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                Batangas Transparency Hub
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex gap-x-2">
            <Link
              href="/open_bidding"
              className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Access Public Bidding
              <Activity className="w-3 h-3" />
            </Link>

            <Link
              href="/login"
              className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Access Portal
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
