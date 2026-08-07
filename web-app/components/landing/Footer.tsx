import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-white/8 py-12 px-6 animate-fadein">
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/skledge-logo.png"
              width={32}
              height={32}
              alt="SK-Ledge Logo"
            />
            <span className="text-white font-bold text-sm tracking-tight">
              SK-Ledge
            </span>
          </Link>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-xs">
            Smart financial transparency for youth governance. Secure.
            Transparent. Automated.
          </p>
          <p className="mt-4 text-xs text-slate-600">
            &copy; {currentYear} SK-Ledge. All rights reserved.
          </p>
        </div>

        {/* Platform */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
            Platform
          </p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link
                href="/login"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Register
              </Link>
            </li>
            <li>
              <Link
                href="/public_portal"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Public Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="#contact"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
            Contact
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5 text-slate-400">
              <Mail className="w-4 h-4 text-tertiary" />
              <a
                href="mailto:hello@skledge.ph"
                className="hover:text-white transition-colors"
              >
                hello@skledge.ph
              </a>
            </li>
            <li className="flex items-center gap-2.5 text-slate-400">
              <MapPin className="w-4 h-4 text-tertiary" />
              Province of Batangas, Philippines
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
