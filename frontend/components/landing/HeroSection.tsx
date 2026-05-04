import Link from "next/link";
import { ArrowRight, ShieldCheck, Wallet, ChevronRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-slate-950 px-6"
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[64px_64px] pointer-events-none" />

      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-primary/8 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10 pt-32 pb-20 animate-fadein">
        <div className="grid lg:grid-cols-[1fr_420px] gap-16 items-center">
          {/* LEFT: Copy */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Secure & Transparent
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold text-white tracking-tighter leading-[0.95] mb-6">
                Modern
                <br />
                <span className="text-tertiary">SK</span>
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
                href="/public-portal"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all group shadow-xl shadow-primary/20"
              >
                View Public Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/6 text-slate-300 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 hover:text-white transition-all"
              >
                Learn More
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>

            {/* Stat strip */}
            <div className="flex items-center gap-8 pt-4 border-t border-white/8">
              {[
                { value: "100%", label: "Transparent" },
                { value: "₱0", label: "Lost Funds" },
                { value: "1×", label: "Source of Truth" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {s.value}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Live Ledger Card */}
          <div className="hidden lg:block">
            <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Card top bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-tertiary/15 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-tertiary" />
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
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-tertiary bg-tertiary/10 border border-tertiary/20 px-2.5 py-1 rounded-full uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  Live
                </span>
              </div>

              {/* Balance display */}
              <div className="px-5 py-5 border-b border-white/8">
                <p className="text-xs text-slate-500 font-medium mb-1">
                  Total SK Fund
                </p>
                <p className="text-4xl font-extrabold text-white tabular-nums">
                  ₱450,000
                </p>
                <p className="text-xs text-tertiary font-semibold mt-1">
                  ↑ 12% this quarter
                </p>
              </div>

              {/* Transactions */}
              <div className="px-5 py-4 space-y-2.5">
                {[
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
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/4 hover:bg-white/6 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {item.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-bold tabular-nums ${item.positive ? "text-tertiary" : "text-slate-100"}`}
                      >
                        {item.amount}
                      </p>
                      <p
                        className={`text-[9px] font-bold mt-0.5 uppercase tracking-wide ${item.status === "Verified" ? "text-tertiary/70" : "text-amber-400/70"}`}
                      >
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
