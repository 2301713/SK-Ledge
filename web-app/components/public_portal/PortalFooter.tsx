import Link from "next/link";
import { Layers, ShieldCheck } from "lucide-react";

export default function PortalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-white px-4 py-9 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-tight text-primary-foreground">
              SK-Ledge
            </p>
            <p className="text-[10px] text-secondary-foreground">
              &copy; {currentYear} · Batangas Province Transparency Hub
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/public_portal"
            className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground transition hover:text-primary"
          >
            Public Portal
          </Link>
          <Link
            href="/open_bidding"
            className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground transition hover:text-primary"
          >
            Open Bidding
          </Link>
          <Link
            href="/login"
            className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground transition hover:text-primary"
          >
            Access Portal
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-success">
            <ShieldCheck className="h-3 w-3" />
            On Sepolia
          </span>
        </div>
      </div>
    </footer>
  );
}
