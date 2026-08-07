import { UserCheck, Wallet, ShieldCheck, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    icon: UserCheck,
    title: "Verify Your Identity",
    description:
      "Sign in with your official Google account and get your SK role approved by an administrator.",
  },
  {
    icon: Wallet,
    title: "Log Everything On-Chain",
    description:
      "Record projects, budgets, and expenses straight onto the secured Sepolia ledger — tamper-proof by design.",
  },
  {
    icon: ShieldCheck,
    title: "Approve & Audit",
    description:
      "Role-based approval workflows let SK, COA, and BMO officials review every transaction before it is finalized.",
  },
  {
    icon: BarChart3,
    title: "Publish With Confidence",
    description:
      "Generate LGU-compliant transparency reports and share them with your constituents in real time.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-16 bg-slate-50 px-6 animate-fadein scroll-mt-24 border-y border-slate-100"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 pb-8 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              From sign-up to
              <br />
              full transparency in{" "}
              <span className="text-primary">four steps.</span>
            </h2>
          </div>
          <p className="text-slate-400 max-w-xs text-sm leading-relaxed md:text-right">
            A simple, secure workflow built for real barangay governance.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-3xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] group hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="absolute top-6 right-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                0{idx + 1}
              </span>
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <step.icon className="w-5 h-5 text-tertiary" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                {step.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Link */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all group shadow-lg shadow-primary/20"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
