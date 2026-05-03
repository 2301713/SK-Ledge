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
    <section className="py-24 px-6 animate-fadein">
      <div className="max-w-6xl mx-auto bg-slate-100 rounded-[2.5rem] relative overflow-hidden shadow-sm border border-slate-200">
        <div className="grid lg:grid-cols-2 gap-12 items-center p-10 md:p-16 lg:p-20 relative z-10">
          {/* Left Column: Copy & Action */}
          <div className="text-left space-y-8">
            <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight leading-tight">
              Ready to lead your <br />
              <span className="text-primary">Barangay to the future?</span>
            </h2>

            <p className="text-black text-lg max-w-md leading-relaxed">
              Join the growing network of progressive youth leaders using
              SK-Ledge to ensure transparency, accountability, and real
              progress.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/public-portal"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 hover:shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <Rocket className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                Access Public Dashboard
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white border border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
              >
                Login
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-6 border-t border-slate-400">
              <div className="flex items-center gap-2 text-sm font-medium text-black">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>Bank-grade Security</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-black">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>LGU Compliant</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dark Mode Micro-UI (Secure Gateway Mockup) */}
          <div className="hidden lg:flex justify-end relative">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">
                    System Access
                  </span>
                </div>
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>

              <div className="space-y-4">
                {/* Mock connection steps */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      Identity Verified
                    </p>
                    <p className="text-xs text-slate-500">
                      SK Chairman Profile
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      Ledger Encrypted
                    </p>
                    <p className="text-xs text-slate-500">
                      End-to-end security active
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100">
                  <div className="w-full py-3 bg-primary rounded-lg flex items-center justify-center gap-2 text-sm font-bold text-white shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                    Ready for Login
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
