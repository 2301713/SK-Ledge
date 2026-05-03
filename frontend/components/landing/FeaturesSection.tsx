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
    <section id="features" className="py-24 bg-white px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Everything your council needs. <br className="hidden md:block" />
            <span className="text-primary">{`Nothing it doesn't.`}</span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            SK-Ledge replaces messy spreadsheets and scattered documents with
            powerful tools built specifically for local youth governance.
          </p>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Project Management (Spans 2 columns) */}
          <div className="md:col-span-2 p-8 rounded-3xl border border-slate-200 bg-slate-50 relative overflow-hidden group hover:border-primary-200 transition-colors">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Project Management
                </h3>
                <p className="text-slate-600 max-w-sm leading-relaxed">
                  Propose, track, and manage all your barangay youth projects
                  from pending to approval seamlessly.
                </p>
              </div>

              {/* Micro-UI */}
              <div className="mt-8 bg-white border border-slate-100 rounded-xl p-4 shadow-sm w-3/4 group-hover:translate-x-2 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <div className="h-2 w-24 bg-slate-200 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Liga ng Kabataan 2026
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-primary bg-primary-50 px-2 py-1 rounded-md font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Approved
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Budget Tracking (Spans 1 column) */}
          <div className="md:col-span-1 p-8 rounded-3xl border border-slate-200 bg-slate-50 relative overflow-hidden group hover:border-primary-200 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary flex items-center justify-center mb-6">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Budget Tracking
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Keep a transparent ledger of your SK funds and remaining
                balances.
              </p>
            </div>

            {/* Micro-UI */}
            <div className="mt-8">
              <p className="text-sm text-slate-500 font-medium mb-1">
                Available SK Fund
              </p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-extrabold text-slate-900">₱450k</p>
                <span className="flex items-center text-primary text-sm font-bold mb-1">
                  <TrendingUp className="w-4 h-4 mr-1" /> +12%
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Public Transparency (Spans 1 column) */}
          <div className="md:col-span-1 p-8 rounded-3xl border border-slate-200 bg-slate-50 relative overflow-hidden group hover:border-primary-200 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Public Transparency
            </h3>
            <p className="text-slate-600 leading-relaxed mb-8">
              Generate instant reports to maintain absolute transparency with
              your constituents.
            </p>

            {/* Micro-UI */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4 group-hover:-translate-y-1 transition-transform duration-300">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Annual Report
                </p>
                <p className="text-xs text-slate-500">Ready to publish</p>
              </div>
            </div>
          </div>

          {/* Card 4: Council Workflows & Roles (Spans 2 columns) - UPDATED */}
          <div className="md:col-span-2 p-8 rounded-3xl border border-slate-200 bg-slate-50 relative overflow-hidden group hover:border-primary-200 transition-colors">
            <div className="flex flex-col md:flex-row gap-8 h-full items-center">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Role-Based Access
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Assign specific permissions to your Chairman, Treasurer, and
                  Kagawads. Streamline your project approval workflows securely.
                </p>
              </div>

              {/* Micro-UI: Role & Approval Workflow */}
              <div className="flex-1 w-full bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
                {/* User Role Row */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <UserCircle className="w-8 h-8 text-slate-300" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Juan Dela Cruz
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        SK Treasurer
                      </p>
                    </div>
                  </div>
                  <Shield className="w-5 h-5 text-primary-500" />
                </div>

                {/* Workflow Row */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Fund Clearance
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    </div>
                    <p className="text-xs text-slate-600 flex-1">
                      Prepared by Treasurer
                    </p>
                  </div>

                  <div className="w-0.5 h-3 bg-slate-200 ml-3"></div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    </div>
                    <p className="text-xs text-slate-400 flex-1">
                      {`Awaiting Chairman's Signature`}
                    </p>
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
