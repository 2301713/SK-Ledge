import Link from "next/link";
import { ArrowRight, ShieldCheck, Wallet, ChevronRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative pt-24 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-slate-50 px-6 animate-fadein"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border text-primary-foreground text-xs font-bold uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure & Transparent</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary-foreground tracking-tight leading-[1.1]">
              Modernizing <br />
              <span className="text-primary">Sangguniang Kabataan</span>
            </h1>

            <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
              The all-in-one digital ledger designed specifically for SK
              officials. Track budgets, manage projects, and ensure absolute
              transparency for your barangay.
            </p>

            {/* CTA Buttons with clear hierarchy */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                href="/public-portal"
                className="w-full sm:w-auto px-7 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 hover:shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                View Public Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto px-7 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 hover:border-primary/30 transition-all flex items-center justify-center gap-2"
              >
                Learn More
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Right Column: Creative "Ledger Dashboard" Mockup */}
          <div className="relative hidden lg:block px-8">
            {/* Main floating card */}
            <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-6 transform rotate-1 hover:rotate-0 transition-transform duration-500">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      SK Fund Ledger
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Barangay Transparency
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase">
                  Live Data
                </span>
              </div>

              {/* Mock Data Rows */}
              <div className="space-y-3">
                {[
                  {
                    title: "Youth Sports Clinic",
                    amount: "- ₱ 15,000",
                    date: "Today",
                    status: "Verified",
                  },
                  {
                    title: "LGU Annual Budget",
                    amount: "+ ₱ 50,000",
                    date: "Yesterday",
                    status: "Verified",
                  },
                  {
                    title: "Office Supplies",
                    amount: "- ₱ 4,500",
                    date: "Oct 12",
                    status: "Pending Review",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${item.amount.startsWith("+") ? "text-primary" : "text-slate-800"}`}
                      >
                        {item.amount}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wide">
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
