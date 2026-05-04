import {
  LayoutDashboard,
  Wallet,
  Eye,
  Users,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Shield,
  UserCircle,
} from "lucide-react";

export default function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-slate-950 px-6">
      <div className="max-w-6xl mx-auto animate-fadein">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 pb-10 border-b border-white/8">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              Features
            </p>
            <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-none">
              Everything you
              <br />
              need. Nothing
              <br />
              <span className="text-slate-600">{`you don't.`}</span>
            </h2>
          </div>
          <p className="text-slate-400 max-w-xs text-base leading-relaxed md:text-right">
            Built specifically for local youth governance — replacing chaos with
            clarity.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Card 1: Project Management — wide */}
          <div className="md:col-span-7 p-8 rounded-2xl bg-slate-900 border border-white/8 group hover:border-primary/30 transition-all duration-300 flex flex-col justify-between min-h-70">
            <div>
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-xl bg-tertiary/15 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-tertiary" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  01
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Project Management
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                Propose, track, and manage all your barangay youth projects from
                pending to approval seamlessly.
              </p>
            </div>
            {/* Micro-UI */}
            <div className="mt-8 bg-slate-800/60 border border-white/8 rounded-xl p-4 w-3/4 group-hover:translate-x-1.5 transition-transform duration-300">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-2 h-2 rounded-full bg-tertiary" />
                <div className="h-1.5 w-20 bg-slate-700 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Liga ng Kabataan 2026
                </span>
                <span className="flex items-center gap-1 text-[10px] text-tertiary bg-tertiary/10 border border-tertiary/20 px-2 py-1 rounded-full font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Budget Tracking — narrow */}
          <div className="md:col-span-5 p-8 rounded-2xl bg-primary border border-primary/30 flex flex-col justify-between min-h-70 group hover:bg-primary/90 transition-all duration-300">
            <div>
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  02
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Budget Tracking
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Keep a transparent ledger of your SK funds and remaining
                balances.
              </p>
            </div>
            <div className="mt-8">
              <p className="text-xs text-white/60 font-semibold uppercase tracking-wide mb-1">
                Available SK Fund
              </p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-extrabold text-white tabular-nums">
                  ₱450k
                </p>
                <span className="flex items-center text-white/80 text-sm font-bold mb-1">
                  <TrendingUp className="w-4 h-4 mr-1" /> +12%
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Public Transparency — narrow */}
          <div className="md:col-span-5 p-8 rounded-2xl bg-slate-900 border border-white/8 group hover:border-primary/30 transition-all duration-300 flex flex-col justify-between min-h-65">
            <div>
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  03
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Public Transparency
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Generate instant reports to maintain absolute transparency with
                your constituents.
              </p>
            </div>
            {/* Micro-UI */}
            <div className="mt-8 bg-slate-800/60 border border-white/8 rounded-xl p-3.5 flex items-center gap-3 group-hover:-translate-y-1 transition-transform duration-300">
              <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Annual Report</p>
                <p className="text-[10px] text-slate-500">Ready to publish</p>
              </div>
            </div>
          </div>

          {/* Card 4: Role-Based Access — wide */}
          <div className="md:col-span-7 p-8 rounded-2xl bg-slate-900 border border-white/8 group hover:border-primary/30 transition-all duration-300 min-h-65">
            <div className="flex flex-col md:flex-row gap-8 h-full items-start">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-11 h-11 rounded-xl bg-tertiary/15 flex items-center justify-center">
                    <Users className="w-5 h-5 text-tertiary" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    04
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Role-Based Access
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Assign permissions to your Chairman, Treasurer, and Kagawads.
                  Streamline approval workflows securely.
                </p>
              </div>

              {/* Micro-UI */}
              <div className="flex-1 w-full bg-slate-800/60 border border-white/8 rounded-xl p-5 space-y-4 mt-auto">
                <div className="flex items-center justify-between pb-3 border-b border-white/8">
                  <div className="flex items-center gap-3">
                    <UserCircle className="w-7 h-7 text-tertiary" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Juan Dela Cruz
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                        SK Treasurer
                      </p>
                    </div>
                  </div>
                  <Shield className="w-4 h-4 text-tertiary" />
                </div>
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Fund Clearance
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-tertiary" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Prepared by Treasurer
                    </p>
                  </div>
                  <div className="w-px h-3 bg-white/10 ml-2.5" />
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    </div>
                    <p className="text-xs text-slate-600">{`Awaiting Chairman's Signature`}</p>
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
