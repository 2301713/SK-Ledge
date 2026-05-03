"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, Menu, X } from "lucide-react";

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              SK-Ledge
            </span>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#hero"
              className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="#features"
              className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="#contact"
              className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Right: Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors px-2"
            >
              Sign In
            </Link>
            <Link
              href="/public-portal"
              className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Dashboard
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-xl absolute w-full">
          <div className="flex flex-col px-6 py-6 space-y-4">
            <Link
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-600 hover:text-primary"
            >
              Features
            </Link>
            <Link
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-600 hover:text-primary"
            >
              Contact
            </Link>

            <div className="h-px bg-slate-100 my-2"></div>

            <Link
              href="/login"
              className="text-base font-bold text-slate-600 hover:text-slate-900"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="w-full text-center px-5 py-3 bg-primary text-white text-base font-bold rounded-xl hover:bg-primary/90 transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
