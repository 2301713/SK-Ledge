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
      className="border-y border-slate-100 bg-slate-50 px-6 py-20 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="animate-in-left motion-reduce:animate-none">
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
          <p className="max-w-xs text-sm leading-relaxed text-slate-400 animate-in-right motion-reduce:animate-none md:text-right">
            A simple, secure workflow built for real barangay governance.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              style={{ animationDelay: `${idx * 80}ms` }}
              className="group relative animate-rise rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] transition-all duration-300 motion-reduce:animate-none hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_14px_34px_-18px_rgba(1,56,168,0.3)]"
            >
              <span className="absolute right-6 top-6 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-colors group-hover:text-primary/50">
                Step 0{idx + 1}
              </span>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <step.icon className="h-5 w-5 text-tertiary" />
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
        <div className="mt-10 flex justify-center animate-rise motion-reduce:animate-none">
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
