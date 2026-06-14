import Link from "next/link";
import { Layers } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-white/8 py-10 px-6 animate-fadein">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Brand */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-sm tracking-tight">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span>SK-Ledge</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-white/10" />
          <p className="text-xs text-slate-600">
            &copy; {currentYear} SK-Ledge. All rights reserved.
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-xs font-medium text-slate-600">
          <Link href="#" className="hover:text-slate-300 transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-slate-300 transition-colors">Terms</Link>
        </div>

      </div>
    </footer>
  );
}
