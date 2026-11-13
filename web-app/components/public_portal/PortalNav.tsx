"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpRight, Globe } from "lucide-react";

export default function PortalNav() {
  const pathname = usePathname();
  const isBiddingPage = pathname?.startsWith("/open_bidding") ?? false;

  return (
    <nav className="sticky top-0 z-50 px-4 pb-3 pt-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-20px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:px-5">
          {/* Brand */}
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <Image
              src="/skledge-logo.png"
              height={40}
              width={40}
              alt="SK-Ledge Logo"
              className="h-10 w-10 shrink-0 rounded-full object-contain transition group-hover:opacity-90"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold leading-none tracking-tight text-primary-foreground">
                SK-Ledge
              </p>
              <p className="mt-1 hidden truncate text-[9px] font-bold uppercase leading-none tracking-[0.18em] text-primary sm:block">
                Batangas Transparency Hub
              </p>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={isBiddingPage ? "/public_portal" : "/open_bidding"}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-2.5 py-2 text-[11px] font-bold text-primary-foreground transition hover:border-primary/30 hover:bg-secondary hover:text-primary sm:px-4 sm:text-xs"
            >
              {isBiddingPage ? (
                <Globe className="h-3.5 w-3.5" />
              ) : (
                <Activity className="h-3.5 w-3.5" />
              )}
              {isBiddingPage ? "Public Portal" : "Public Bidding"}
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-95 sm:px-4 sm:text-xs"
            >
              Access Portal
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
