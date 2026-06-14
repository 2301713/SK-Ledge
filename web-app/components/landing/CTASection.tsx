import Link from "next/link";
import {
  Rocket,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 px-6 animate-fadein bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-950 rounded-3xl overflow-hidden border border-white/8 relative">
          {/* Grid texture */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />

          {/* Glow */}
          <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-primary/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-[1fr_360px] items-center gap-12 p-10 md:p-14 lg:p-16">
            {/* LEFT */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05] mb-5">
                  Ready to lead your
                  <br />
                  Barangay to <span className="text-tertiary">the future?</span>
                </h2>
                <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
                  Join the growing network of progressive youth leaders using
                  SK-Ledge to ensure transparency, accountability, and real
                  progress.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/public_portal"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all group shadow-xl shadow-primary/20"
                >
                  <Rocket className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Access Public Dashboard
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/6 text-white border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                >
                  Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-white/8">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-tertiary" />
                  <span>Bank-grade Security</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-tertiary" />
                  <span>LGU Compliant</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Secure Gateway mockup */}
            <div className="hidden lg:block">
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-7 pb-4 border-b border-white/8">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-tertiary" />
                    <span className="text-sm font-bold text-white">
                      System Access
                    </span>
                  </div>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Identity Verified", sub: "SK Chairman Profile" },
                    {
                      label: "Ledger Encrypted",
                      sub: "End-to-end security active",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center border border-tertiary/20 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-tertiary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500">{step.sub}</p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 mt-1 border-t border-white/8">
                    <div className="w-full py-3.5 bg-primary rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      Ready for Login
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
