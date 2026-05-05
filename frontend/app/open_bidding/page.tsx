"use client";

import React, { useState } from "react";
import {
  Search,
  Wallet,
  Download,
  ChevronRight,
  CheckCircle2,
  Star,
  FileText,
  Mic,
  ChevronDown,
} from "lucide-react";
import {
  biddingProjects,
  FilterGroupProps,
  StatCardProps,
  StatusBadgeProps,
  TimelineItemProps,
} from "./types";

export default function BiddingPortal() {
  const [selectedProject, setSelectedProject] = useState(biddingProjects[1]);

  return (
    <div className="min-h-screen bg-[#050B18] text-white p-6 relative">
      {/* 1. TOP SEARCH & FILTER BAR */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center px-4 py-3 shadow-lg">
          <Search className="text-slate-400 mr-3" size={20} />
          <input
            type="text"
            placeholder='"Construction of Youth..."'
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-500 text-white"
          />
          <div className="h-6 w-px bg-white/10 mx-3" />
          <Mic
            className="text-slate-400 cursor-pointer hover:text-white transition"
            size={18}
          />
        </div>

        <FilterGroup label="Status" value="All" />
        <FilterGroup label="Barangay" value="All" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT SECTION: HEADER, STATS, & LEDGER */}
        <div className="xl:col-span-8 space-y-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Official <span className="text-tertiary">SK</span> Procurement &
              Bidding Board
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Ensuring 100% transparency in local youth governance and public
              spending.
            </p>
          </div>

          {/* 2. STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={<FileText size={20} className="text-green-400" />}
              label="ACTIVE SOLICITATIONS"
              value="12 Projects"
              lineColor="bg-green-500"
            />
            <StatCard
              icon={<Wallet size={20} className="text-tertiary" />}
              label="TOTAL BUDGET POSTED"
              value="₱ 4,500,000"
              lineColor="bg-tertiary"
              isActive
            />
            <StatCard
              icon={<CheckCircle2 size={20} className="text-blue-400" />}
              label="RECENTLY AWARDED"
              value="5 Projects"
              subtitle="this month"
              lineColor="bg-blue-500"
            />
          </div>

          {/* 3. BIDDING LEDGER */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-900">
                BIDDING LEDGER
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">P Value</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-900">
                  {biddingProjects.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        selectedProject.id === p.id ? "bg-slate-100/80" : ""
                      }`}
                    >
                      <td className="px-6 py-5 font-bold text-slate-400">
                        {idx + 1}.
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-sm leading-tight">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">
                          {p.location}
                        </p>
                      </td>
                      <td className="px-6 py-5 font-black text-sm">
                        ₱{" "}
                        {p.abc.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-xs">{p.deadline}</p>
                        {p.daysLeft > 0 && (
                          <p className="text-[10px] font-bold text-orange-500 mt-0.5 tracking-tighter">
                            {p.daysLeft} Days Left
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5 text-slate-300">
                        <ChevronRight size={20} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button className="bg-[#D4AF37] hover:bg-[#B8962E] text-black px-6 py-2 rounded-xl font-black text-xs uppercase transition shadow-lg shadow-yellow-900/10">
                View All Solicitations
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: PANEL/DETAILS (GLASSMORPHISM) */}
        <div className="xl:col-span-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col min-h-150 relative overflow-hidden">
          {/* Subtle Glow Effect */}
          <div className="absolute -right-20 top-40 w-40 h-40 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="flex-1">
            <h2 className="text-2xl font-black leading-tight uppercase tracking-tight">
              {selectedProject.name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              ({selectedProject.location.split(";")[0]})
            </p>

            <div className="mt-4">
              <StatusBadge status={selectedProject.status} isLarge />
            </div>

            <div className="mt-8 space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Reference: {selectedProject.id}
              </p>
              <p className="text-slate-300 text-[13px] leading-relaxed mt-4">
                {selectedProject.description}
              </p>
            </div>

            {/* FIXED: DYNAMIC VERTICAL TIMELINE */}
            <div className="mt-10 space-y-8 relative">
              <div className="absolute left-2.75 top-2 bottom-2 w-px bg-white/10" />
              <TimelineItem
                label="Pre-Bid Conference"
                date={selectedProject.preBid}
                active={true}
              />
              <TimelineItem
                label="Bid Opening & Evaluation"
                date={selectedProject.opening}
                active={
                  selectedProject.status === "Evaluation" ||
                  selectedProject.status === "Awarded"
                }
                isInactive={selectedProject.status === "Accepting Bids"}
              />
              <TimelineItem
                label="Notice of Award"
                date={selectedProject.award}
                isStar={selectedProject.status === "Awarded"}
                isInactive={selectedProject.status !== "Awarded"}
              />
            </div>

            {/* CONDITIONAL WINNER REVEAL */}
            {selectedProject.status === "Awarded" && (
              <div className="mt-10 bg-linear-to-r from-[#D4AF37]/20 to-[#D4AF37]/40 border border-[#D4AF37]/50 p-6 rounded-2xl relative overflow-hidden group">
                <h4 className="font-black text-xs uppercase tracking-widest text-tertiary mb-2">
                  Winning Bidder Reveal
                </h4>
                <div className="h-px bg-white/10 w-full mb-3" />
                <p className="text-[10px] font-bold text-white/50 uppercase">
                  Winning Bidder:{" "}
                  <span className="text-white">{selectedProject.winner}</span>
                </p>
                <p className="text-[10px] font-bold text-white/50 uppercase mt-1">
                  Winning Bid:{" "}
                  <span className="text-white font-black text-sm">
                    ₱ {selectedProject.winningBid?.toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>

          <button className="mt-8 w-full py-4 bg-linear-to-r from-[#D4AF37] to-[#B8962E] text-black rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-yellow-900/20 flex items-center justify-center gap-3 transition hover:scale-[1.02]">
            <Download size={18} strokeWidth={3} /> Download Bidding Documents
            (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}

// HELPER COMPONENTS
function StatCard({
  icon,
  label,
  value,
  lineColor,
  isActive,
  subtitle,
}: StatCardProps) {
  return (
    <div
      className={`p-6 rounded-3xl border border-white/10 relative overflow-hidden transition-all duration-300 ${
        isActive ? "bg-white/10 ring-1 ring-tertiary/30" : "bg-[#0F172A]/40"
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
          {icon}
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-white/5 border-t-blue-500 animate-[spin_3s_linear_infinite]" />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
        {label}
      </p>
      <h3
        className={`text-2xl font-black mt-2 tracking-tight ${
          isActive ? "text-tertiary" : "text-white"
        }`}
      >
        {value}
      </h3>
      {subtitle && (
        <p className="text-[10px] text-slate-400 font-bold tracking-tighter mt-1">
          {subtitle}
        </p>
      )}
      <div
        className={`absolute bottom-0 left-4 right-4 h-0.5 ${lineColor} opacity-60`}
      />
    </div>
  );
}

function StatusBadge({ status, isLarge }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    "Accepting Bids": "bg-green-100/10 text-green-500 border-green-500/30",
    Awarded: "bg-blue-100/10 text-blue-400 border-blue-400/30",
    Evaluation: "bg-yellow-100/10 text-yellow-500 border-yellow-500/30",
  };

  return (
    <span
      className={`flex items-center gap-2 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
        styles[status] || "bg-slate-100/10 text-slate-400 border-slate-400/30"
      } ${isLarge ? "py-2 px-6" : ""}`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full bg-current ${
          status === "Accepting Bids" ? "animate-pulse" : ""
        }`}
      />
      {status}
    </span>
  );
}

function FilterGroup({ label, value }: FilterGroupProps) {
  return (
    <div className="flex flex-col text-sm px-2">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
        {label}
      </p>
      <div className="flex items-center gap-1 font-bold text-slate-300 cursor-pointer hover:text-white">
        {value} <ChevronDown size={14} />
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  active,
  isStar,
  isInactive,
}: TimelineItemProps) {
  return (
    <div className="flex items-center gap-4 relative z-10">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
          isStar
            ? "bg-tertiary border-tertiary shadow-[0_0_15px_rgba(255,215,0,0.4)] text-black"
            : active
              ? "bg-tertiary border-tertiary text-black"
              : "bg-slate-800 border-white/10 text-slate-500"
        } ${isInactive ? "bg-slate-800/50 opacity-50" : ""}`}
      >
        {isStar ? (
          <Star size={12} fill="currentColor" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-current" />
        )}
      </div>
      <div>
        <p
          className={`text-[11px] font-black uppercase tracking-tight ${
            isInactive ? "text-slate-500" : "text-white"
          }`}
        >
          {label}
        </p>
        {date && (
          <p className="text-[10px] text-slate-500 font-bold leading-none mt-1 italic">
            {date}
          </p>
        )}
      </div>
    </div>
  );
}
