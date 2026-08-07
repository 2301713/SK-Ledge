"use client";

import { useState } from "react";
import {
  Search,
  Wallet,
  Download,
  ChevronRight,
  CheckCircle2,
  FileText,
  Mic,
} from "lucide-react";
import { biddingProjects } from "./data";
import PortalNav from "../../components/public_portal/PortalNav";
import StatCard from "../../components/bidding/StatCard";
import StatusBadge from "../../components/bidding/StatusBadge";
import FilterGroup from "../../components/bidding/FilterGroup";
import TimelineItem from "../../components/bidding/TimelineItem";
import RequestModal from "../../components/bidding/RequestModal";

export default function BiddingPortal() {
  const [selectedProject, setSelectedProject] = useState(biddingProjects[1]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [vendorCompany, setVendorCompany] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorNote, setVendorNote] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const openBidsCount = biddingProjects.filter(
    (project) => project.status === "Accepting Bids",
  ).length;
  const totalBids = biddingProjects.length;

  const handleRequestClose = () => {
    setIsRequestModalOpen(false);
    setRequestSubmitted(false);
  };

  const handleRequestSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestSubmitted(true);
    setVendorName("");
    setVendorCompany("");
    setVendorEmail("");
    setVendorNote("");
  };

  return (
    <div className="min-h-screen bg-background text-primary-foreground relative pb-16 selection:bg-tertiary selection:text-primary">
      <PortalNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex-1 min-w-[240px] bg-white border border-border rounded-xl flex items-center px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
            <Search className="text-secondary-foreground mr-3" size={18} />
            <input
              type="text"
              placeholder='"Construction of Youth..."'
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-secondary-foreground text-primary-foreground"
            />
            <div className="h-5 w-px bg-border mx-3" />
            <Mic
              className="text-secondary-foreground cursor-pointer hover:text-primary transition"
              size={18}
            />
          </div>

          <div className="flex items-center gap-4 bg-white border border-border rounded-xl px-4 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <FilterGroup label="Status" value="All" />
            <span className="w-px h-6 bg-border" />
            <FilterGroup label="Barangay" value="All" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/10 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live Procurement Board
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-primary-foreground">
                Official <span className="text-primary">SK</span> Procurement &
                Bidding Board
              </h1>
              <p className="text-secondary-foreground text-sm mt-2">
                Ensuring 100% transparency in local youth governance and public
                spending.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<FileText size={20} className="text-primary" />}
                label="ACTIVE SOLICITATIONS"
                value={`${openBidsCount} Projects`}
                lineColor="bg-primary"
              />
              <StatCard
                icon={<Wallet size={20} className="text-tertiary" />}
                label="TOTAL BUDGET POSTED"
                value="₱ 4,500,000"
                lineColor="bg-tertiary"
                isActive
              />
              <StatCard
                icon={<CheckCircle2 size={20} className="text-success" />}
                label="RECENTLY AWARDED"
                value="5 Projects"
                subtitle="this month"
                lineColor="bg-success"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)]">
                <p className="text-[10px] uppercase tracking-widest font-black text-secondary-foreground">
                  Marketplace Status
                </p>
                <p className="text-3xl font-extrabold mt-4 text-primary-foreground tabular-nums">
                  {totalBids}
                </p>
                <p className="text-sm text-secondary-foreground mt-2">
                  Total published bid opportunities
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)]">
                <p className="text-[10px] uppercase tracking-widest font-black text-secondary-foreground">
                  Open for Submission
                </p>
                <p className="text-3xl font-extrabold mt-4 text-success tabular-nums">
                  {openBidsCount}
                </p>
                <p className="text-sm text-secondary-foreground mt-2">
                  Ongoing procurement projects accepting proposals
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)]">
                <p className="text-[10px] uppercase tracking-widest font-black text-secondary-foreground">
                  Vendor Readiness
                </p>
                <p className="text-3xl font-extrabold mt-4 text-primary tabular-nums">
                  24/7
                </p>
                <p className="text-sm text-secondary-foreground mt-2">
                  Support and tender documents available online
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] border border-border">
              <div className="p-5 border-b border-border flex justify-between items-center">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-primary-foreground">
                  Bidding Ledger
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/40 text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Project</th>
                      <th className="px-6 py-4">P Value</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Deadline</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {biddingProjects.map((project, idx) => (
                      <tr
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className={`hover:bg-secondary/40 transition-colors cursor-pointer ${
                          selectedProject.id === project.id ? "bg-secondary/60" : ""
                        }`}
                      >
                        <td className="px-6 py-5 font-bold text-secondary-foreground">
                          {idx + 1}.
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-black text-sm leading-tight text-primary-foreground">
                            {project.name}
                          </p>
                          <p className="text-[10px] text-secondary-foreground font-bold uppercase mt-1 tracking-tighter">
                            {project.location}
                          </p>
                        </td>
                        <td className="px-6 py-5 font-black text-sm text-primary-foreground tabular-nums">
                          ₱{" "}
                          {project.abc.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-black text-xs text-primary-foreground">
                            {project.deadline}
                          </p>
                          {project.daysLeft > 0 && (
                            <p className="text-[10px] font-bold text-pending mt-0.5 tracking-tighter">
                              {project.daysLeft} Days Left
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-5 text-secondary-foreground">
                          <ChevronRight size={20} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-secondary/20 border-t border-border flex justify-end">
                <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase transition shadow-lg shadow-primary/20 active:scale-95">
                  View All Solicitations
                </button>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 bg-white border border-border rounded-3xl p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] flex flex-col min-h-150 relative overflow-hidden">
            <div className="absolute -right-20 top-40 w-40 h-40 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex-1">
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-primary-foreground">
                {selectedProject.name}
              </h2>
              <p className="text-secondary-foreground text-sm mt-1">
                ({selectedProject.location.split(";")[0]})
              </p>

              <div className="mt-4">
                <StatusBadge status={selectedProject.status} isLarge />
              </div>

              <div className="mt-8 space-y-1">
                <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-widest">
                  Reference: {selectedProject.id}
                </p>
                <p className="text-secondary-foreground text-[13px] leading-relaxed mt-4">
                  {selectedProject.description}
                </p>
              </div>

              <div className="mt-10 space-y-8 relative">
                <div className="absolute left-2.75 top-2 bottom-2 w-px bg-border" />
                <TimelineItem
                  label="Pre-Bid Conference"
                  date={selectedProject.preBid}
                  active
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

              {selectedProject.status === "Awarded" && (
                <div className="mt-10 bg-tertiary/10 border border-tertiary/30 p-6 rounded-2xl relative overflow-hidden">
                  <h4 className="font-black text-xs uppercase tracking-widest text-secondary-foreground mb-2">
                    Winning Bidder Reveal
                  </h4>
                  <div className="h-px bg-border w-full mb-3" />
                  <p className="text-[10px] font-bold text-secondary-foreground uppercase">
                    Winning Bidder:{" "}
                    <span className="text-primary-foreground">
                      {selectedProject.winner}
                    </span>
                  </p>
                  <p className="text-[10px] font-bold text-secondary-foreground uppercase mt-1">
                    Winning Bid:{" "}
                    <span className="text-primary-foreground font-black text-sm">
                      ₱ {selectedProject.winningBid?.toLocaleString()}
                    </span>
                  </p>
                </div>
              )}

              <div className="mt-10 rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)]">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-secondary-foreground">
                      Vendor Participation
                    </p>
                    <h3 className="text-xl font-extrabold mt-2 text-primary-foreground">
                      Submit your proposal
                    </h3>
                  </div>
                  <div className="rounded-full bg-success/10 text-success border border-success/20 px-3 py-1 text-[10px] uppercase font-black tracking-widest">
                    Open Now
                  </div>
                </div>
                <ol className="space-y-4 text-sm text-secondary-foreground">
                  <li className="flex gap-3">
                    <span className="mt-1 font-black text-primary">1.</span>
                    Download the bid documents and review the scope.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 font-black text-primary">2.</span>
                    Prepare your technical and financial proposal package.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 font-black text-primary">3.</span>
                    Submit before the deadline through the SK procurement office.
                  </li>
                </ol>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="mt-6 w-full rounded-xl bg-primary text-white font-black uppercase tracking-widest py-3 transition hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95"
                >
                  Request Bid Package
                </button>
              </div>
            </div>

            <button className="mt-8 w-full py-4 bg-primary text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition hover:bg-primary/90 active:scale-95">
              <Download size={18} strokeWidth={3} /> Download Bidding Documents
              (PDF)
            </button>
          </div>
        </div>
      </div>

      <RequestModal
        visible={isRequestModalOpen}
        onClose={handleRequestClose}
        onSubmit={handleRequestSubmit}
        requestSubmitted={requestSubmitted}
        vendorName={vendorName}
        vendorCompany={vendorCompany}
        vendorEmail={vendorEmail}
        vendorNote={vendorNote}
        onVendorNameChange={setVendorName}
        onVendorCompanyChange={setVendorCompany}
        onVendorEmailChange={setVendorEmail}
        onVendorNoteChange={setVendorNote}
      />
    </div>
  );
}
