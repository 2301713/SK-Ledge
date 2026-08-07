import { Target, Sparkles, XCircle, CheckCircle2 } from "lucide-react";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="py-16 bg-white px-6 animate-fadein scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        {/* Top: Compact editorial statement */}
        <div className="mb-12 pb-10 border-b border-slate-100">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
            About The Project
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl">
            Governance{" "}
            <span className="italic font-extrabold text-slate-500">{`shouldn't`}</span>{" "}
            rely on{" "}
            <span className="line-through decoration-tertiary decoration-[6px] text-slate-500">
              paper trails.
            </span>
          </h2>
        </div>

        {/* Bottom: Two column */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* LEFT: Story */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-base text-slate-600 leading-relaxed">
                We noticed that many Sangguniang Kabataan councils struggle with
                budget tracking and project management because they rely on
                scattered spreadsheets, physical receipts, and disorganized
                paper records.
              </p>
              <p className="text-base text-slate-600 leading-relaxed">
                We built SK-Ledge to change that — empowering youth leaders with
                enterprise-grade tools that make local governance highly
                efficient, securely documented, and absolutely transparent to
                the public.
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {/* Mission — brand anchor card */}
              <div className="p-6 rounded-3xl bg-primary text-white shadow-[0_8px_28px_-10px_rgba(1,56,168,0.45)]">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-tertiary flex items-center justify-center mb-3">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white mb-1.5 text-sm">
                  Our Mission
                </h4>
                <p className="text-xs text-white/75 leading-relaxed">
                  Centralize and secure SK financial records, eliminating lost
                  data and manual accounting errors.
                </p>
              </div>

              {/* Vision — light card */}
              <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)]">
                <div className="w-9 h-9 rounded-xl bg-tertiary/20 text-primary flex items-center justify-center mb-3">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1.5 text-sm">
                  Our Vision
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every barangay youth council operating with 100% transparency
                  and seamless digital workflows.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Before / After comparison */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">
              The Difference
            </p>

            {/* Old Way */}
            <div className="p-5 rounded-3xl border border-slate-200 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  The Old Way
                </span>
              </div>
              <ul className="space-y-2">
                {[
                  "Misplaced physical documents",
                  "Manual spreadsheet errors",
                  "Missing physical receipts",
                  "Delayed transparency reports",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs text-slate-400"
                  >
                    <span className="w-1 h-1 rounded-full bg-red-300 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* SK-Ledge Way */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-white/10 relative overflow-hidden">
              <div className="absolute -top-2 -right-2">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/80 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-xl bg-tertiary/20 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  The SK-Ledge Way
                </span>
              </div>
              <ul className="space-y-2">
                {[
                  "Centralized digital dashboard",
                  "Automated budget tracking",
                  "Secure cloud document storage",
                  "Instant LGU compliance reports",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs text-slate-300"
                  >
                    <span className="w-1 h-1 rounded-full bg-tertiary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
