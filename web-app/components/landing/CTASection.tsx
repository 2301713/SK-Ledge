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
    <section className="py-12 px-6 animate-fadein bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-950 rounded-2xl overflow-hidden border border-white/8 relative">
          {/* Grid texture */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />

          {/* Glow */}
          <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-primary/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-[1fr_320px] items-center gap-8 p-6 md:p-10 lg:p-12">
            {/* LEFT */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
                  Ready to lead your
                  <br />
                  Barangay to <span className="text-tertiary">the future?</span>
                </h2>
                <p className="text-slate-400 text-base max-w-lg leading-relaxed">
                  Join the growing network of progressive youth leaders using
                  SK-Ledge to ensure transparency, accountability, and real
                  progress.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/public_portal"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all group shadow-lg shadow-primary/20"
                >
                  <Rocket className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Access Public Dashboard
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/6 text-white border border-white/10 rounded-lg font-bold text-sm hover:bg-white/10 transition-all"
                >
                  Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-white/8">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-tertiary" />
                  <span>Bank-grade Security</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-tertiary" />
                  <span>LGU Compliant</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Secure Gateway mockup */}
            <div className="hidden lg:block">
              <div className="bg-slate-900 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/8">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-tertiary" />
                    <span className="text-xs font-bold text-white">
                      System Access
                    </span>
                  </div>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Identity Verified", sub: "SK Chairman Profile" },
                    {
                      label: "Ledger Encrypted",
                      sub: "End-to-end security active",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center border border-tertiary/20 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-tertiary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500">{step.sub}</p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 mt-1 border-t border-white/8">
                    <div className="w-full py-2.5 bg-primary rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-white">
                      <span className="w-1 h-1 rounded-full bg-white/60" />
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
