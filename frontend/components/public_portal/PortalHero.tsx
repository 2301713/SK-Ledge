export default function PortalHero() {
  return (
    <section className="pt-10 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-10 border-b border-white/8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/10 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live Data · ABYIP 2023–2024
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight leading-[1.05]">
              Public Expenditure
              <br />
              <span className="text-tertiary">Dashboard</span>
            </h1>
          </div>
          <p className="text-primary/60 text-sm leading-relaxed max-w-sm md:text-right">
            Real-time monitoring of the Annual Barangay Youth Investment
            Program. Ensuring every centavo counts for the Batangueño youth.
          </p>
        </div>
      </div>
    </section>
  );
}
