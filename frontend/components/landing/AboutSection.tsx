import { Target, Sparkles, XCircle, CheckCircle2 } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-white px-6 animate-fadein">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: The Story & Mission */}
          <div className="space-y-8 text-left">
            <div>
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">
                About The Project
              </h2>
              <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
                {`Governance shouldn't rely on`}{" "}
                <span className="text-slate-400 line-through decoration-primary decoration-4">
                  paper trails.
                </span>
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                We noticed that many Sangguniang Kabataan councils struggle with
                budget tracking and project management because they rely on
                scattered spreadsheets, physical receipts, and disorganized
                paper records.
                <br />
                <br />
                We built SK-Ledge to change that. Our goal is to empower youth
                leaders with enterprise-grade tools, making local governance
                highly efficient, securely documented, and absolutely
                transparent to the public.
              </p>
            </div>

            {/* Mission & Vision Mini-Cards */}
            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Our Mission</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To centralize and secure SK financial records, completely
                  eliminating lost data and manual accounting errors.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Our Vision</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A future where every barangay youth council operates with 100%
                  transparency and seamless digital workflows.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: The "Before & After" Micro-UI */}
          <div className="relative">

            <div className="space-y-6">
              {/* The Old Way Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <h4 className="font-bold text-slate-900">The Old Way</h4>
                </div>
                <ul className="space-y-3">
                  {[
                    "Misplaced physical documents",
                    "Manual spreadsheet errors",
                    "Missing physical receipts",
                    "Delayed transparency reports",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-500"
                    >
                      <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* The SK-Ledge Way Card (Highlighted) */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl transform md:-translate-x-6 relative z-10">
                <div className="absolute -top-3 -right-3">
                  <span className="relative flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/80 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-primary items-center justify-center shadow-md shadow-primary/50"></span>
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-tertiary" />
                  </div>
                  <h4 className="font-bold text-tertiary">The SK-Ledge Way</h4>
                </div>
                <ul className="space-y-3">
                  {[
                    "Centralized digital dashboard",
                    "Automated budget tracking",
                    "Secure cloud document storage",
                    "Instant LGU compliance reports",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
