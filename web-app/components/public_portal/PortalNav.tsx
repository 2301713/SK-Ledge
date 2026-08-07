import Link from "next/link";
import Image from "next/image";
import { Activity, ExternalLink } from "lucide-react";

export default function PortalNav() {
  return (
    <nav className="sticky top-0 z-50 px-4 sm:px-6 pt-4 pb-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-5 py-3 bg-white/95 backdrop-blur-xl rounded-2xl border border-border shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.12)]">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white shadow-sm">
              <Image
                src="/skledge-logo.png"
                width={22}
                height={22}
                alt="SK-Ledge Logo"
              />
            </div>
            <div>
              <p className="text-sm font-extrabold text-primary-foreground leading-none tracking-tight">
                SK-Ledge
              </p>
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none mt-1">
                Batangas Transparency Hub
              </p>
            </div>
          </Link>

          {/* Right */}
          <div className="flex gap-x-2">
            <Link
              href="/open_bidding"
              className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Public Bidding
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
