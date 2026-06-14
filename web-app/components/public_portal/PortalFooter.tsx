import { Layers } from "lucide-react";

export default function PortalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-white/6 px-6 py-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <Layers className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-bold text-white tracking-tight">
            SK-Ledge
          </span>
          <span className="hidden md:block w-px h-3 bg-white/10" />
          <span className="hidden md:block text-xs text-slate-600">
            &copy; {currentYear} · Batangas Province Transparency Hub
          </span>
        </div>
        <p className="text-[10px] text-slate-700 uppercase tracking-widest font-semibold">
          Powered by the Annual Barangay Youth Investment Program
        </p>
      </div>
    </footer>
  );
}
