"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, Menu, X } from "lucide-react";

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 animate-fadein">
      {/* Floating pill navbar */}
      <div className="max-w-5xl mx-auto px-4 pt-5">
        <div className="flex items-center justify-between h-14 px-5 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-base text-white tracking-tight">
              SK-Ledge
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {["Home", "About", "Features"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-2 rounded-xl hover:bg-white/8 transition-all"
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-2 rounded-xl hover:bg-white/8 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/public-portal"
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
            >
              Dashboard →
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 bg-slate-900/98 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex flex-col p-3 gap-1">
              {["Features", "Contact"].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/8 px-4 py-3 rounded-xl transition-all"
                >
                  {item}
                </Link>
              ))}
              <div className="h-px bg-white/8 my-1" />
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/8 px-4 py-3 rounded-xl transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="text-center px-4 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
