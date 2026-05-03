import Link from "next/link";
import { Layers } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Brand & Copyright */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span>SK-Ledge</span>
          </div>

          {/* Subtle divider line (hidden on mobile) */}
          <div className="hidden md:block w-px h-4 bg-slate-300"></div>

          <p className="text-sm text-slate-500 font-medium">
            &copy; {currentYear} SK-Ledge. All rights reserved.
          </p>
        </div>

        {/* Right Side: Essential Links */}
        <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
          <Link href="#" className="hover:text-slate-900 transition-colors">
            Privacy
          </Link>
          <Link href="#" className="hover:text-slate-900 transition-colors">
            Terms
          </Link>
          <Link href="#" className="hover:text-slate-900 transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
