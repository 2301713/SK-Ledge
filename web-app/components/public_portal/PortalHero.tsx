import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  RefreshCw,
  ShieldCheck,
  Globe,
} from "lucide-react";

export default function PortalHero() {
  return (
    <section className="px-4 pb-10 pt-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-end gap-8 border-b border-border pb-9 lg:grid-cols-[1.35fr_1fr]">
          <div className="animate-in-left motion-reduce:animate-none">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
              Live Data · ABYIP 2023–2024
            </div>
            <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Public Expenditure
              <span className="block text-primary">Dashboard</span>
            </h1>
          </div>

          <div
            className="animate-in-right motion-reduce:animate-none lg:pb-1"
            style={{ animationDelay: "120ms" }}
          >
            <p className="max-w-sm text-sm leading-relaxed text-secondary-foreground">
              Real-time monitoring of the Annual Barangay Youth Investment
              Program. Every centavo is recorded, verified, and traceable — for
              the Batangueño youth.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <a
                href="#project-registry"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-95"
              >
                Browse projects
                <ArrowDownRight className="h-3.5 w-3.5" />
              </a>
              <Link
                href="/open_bidding"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:border-primary/30 hover:bg-secondary hover:text-primary"
              >
                <Activity className="h-3.5 w-3.5" />
                Open bidding
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                On-chain verified
              </span>
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
                Live sync
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-secondary-foreground" />
                Public access
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
