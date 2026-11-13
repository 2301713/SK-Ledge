import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Wallet,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  BadgeCheck,
} from "lucide-react";
import Image from "next/image";

const LEDGER_ROWS = [
  {
    title: "Youth Sports Clinic",
    amount: "−₱15,000",
    date: "Today",
    status: "Verified",
    positive: false,
  },
  {
    title: "LGU Annual Budget",
    amount: "+₱50,000",
    date: "Yesterday",
    status: "Verified",
    positive: true,
  },
  {
    title: "Office Supplies",
    amount: "−₱4,500",
    date: "Oct 12",
    status: "Pending",
    positive: false,
  },
];

const HERO_STATS = [
  { value: "100%", label: "Transparent" },
  { value: "₱0", label: "Lost Funds" },
  { value: "1×", label: "Source of Truth" },
];

const SPARKLINE = [38, 55, 42, 68, 60, 84, 72];

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-slate-950 px-6 scroll-mt-24"
    >
      {/* Blockchain GIF Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src="/gifs/chain-hologram.gif"
          alt="blockchain background"
          className="w-full h-full opacity-25 object-cover"
          width={1920}
          height={1080}
          unoptimized
        />
      </div>

      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-primary/8 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10 pt-32 pb-20">
        <div className="grid lg:grid-cols-[1fr_420px] gap-16 items-center">
          {/* LEFT: Copy */}
          <div className="space-y-8 animate-in-left motion-reduce:animate-none">
            {/* Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-tertiary" />
                Secure &amp; Transparent
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-tertiary/20 bg-tertiary/10 text-[10px] font-bold uppercase tracking-widest text-tertiary">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse motion-reduce:animate-none" />
                On Sepolia
              </div>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-6xl sm:text-7xl font-extrabold text-white tracking-tighter leading-[0.95] mb-6">
                Modern <span className="text-tertiary">SK</span>
                <br />
                Governance.
              </h1>
              <p className="text-lg text-slate-400 max-w-md leading-relaxed">
                The all-in-one digital ledger for SK officials. Track budgets,
                manage projects, and ensure absolute transparency for your
                barangay.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/public_portal"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all group shadow-xl shadow-primary/20"
              >
                View Public Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/6 text-slate-300 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 hover:text-white transition-all"
              >
                Explore Features
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/8 max-w-md">
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Live Ledger Card */}
          <div
            className="hidden lg:block animate-in-right motion-reduce:animate-none"
            style={{ animationDelay: "140ms" }}
          >
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-2xl"
              />

              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur">
                <div className="h-1 w-full" />

                {/* Card top bar */}
                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary/15">
                      <Wallet className="h-4 w-4 text-tertiary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        SK Fund Ledger
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Barangay Transparency
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-tertiary/20 bg-tertiary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-tertiary">
                    <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse motion-reduce:animate-none" />
                    Live
                  </span>
                </div>

                {/* Balance display */}
                <div className="border-b border-white/8 px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-1 text-xs font-medium text-slate-500">
                        Total SK Fund
                      </p>
                      <p className="text-4xl font-extrabold tabular-nums text-white">
                        ₱450,000
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-tertiary">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        12% this quarter
                      </p>
                    </div>

                    {/* Sparkline */}
                    <div className="flex h-12 items-end gap-1">
                      {SPARKLINE.map((height, index) => (
                        <span
                          key={index}
                          style={{ height: `${height}%` }}
                          className="w-1.5 rounded-full "
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      <span>Budget utilization</span>
                      <span className="text-slate-300">68%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                      <div className="h-full w-[68%] rounded-full bg-tertiary" />
                    </div>
                  </div>
                </div>

                {/* Transactions */}
                <div className="space-y-2.5 px-5 py-4">
                  {LEDGER_ROWS.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-3 rounded-xl bg-white/4 p-3 transition-colors hover:bg-white/6"
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          item.positive
                            ? "bg-tertiary/10 text-tertiary"
                            : "bg-white/5 text-slate-400"
                        }`}
                      >
                        {item.positive ? (
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {item.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xs font-bold tabular-nums ${
                            item.positive ? "text-tertiary" : "text-slate-100"
                          }`}
                        >
                          {item.amount}
                        </p>
                        <p
                          className={`mt-0.5 text-[9px] font-bold uppercase tracking-wide ${
                            item.status === "Verified"
                              ? "text-tertiary/70"
                              : "text-amber-400/70"
                          }`}
                        >
                          {item.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/8 px-5 py-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <BadgeCheck className="h-3.5 w-3.5 text-tertiary" />
                    Anchored on Sepolia
                  </span>
                  <span className="font-mono text-[10px] text-slate-600">
                    0x8f…3a2c
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
