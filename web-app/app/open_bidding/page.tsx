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
    <div className="min-h-screen text-primary-foreground p-6 relative">
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex-1 bg-white border border-border rounded-2xl flex items-center px-4 py-3 shadow-sm">
          <Search className="text-primary/70 mr-3" size={20} />
          <input
            type="text"
            placeholder='"Construction of Youth..."'
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 text-primary-foreground"
          />
          <div className="h-6 w-px bg-border mx-3" />
          <Mic
            className="text-slate-400 cursor-pointer hover:text-primary transition"
            size={18}
          />
        </div>

        <FilterGroup label="Status" value="All" />
        <FilterGroup label="Barangay" value="All" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary">
              Official <span className="text-tertiary">SK</span> Procurement &
              Bidding Board
            </h1>
            <p className="text-secondary-foreground text-sm mt-1">
              Ensuring 100% transparency in local youth governance and public
              spending.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={<FileText size={20} className="text-sky-600" />}
              label="ACTIVE SOLICITATIONS"
              value={`${openBidsCount} Projects`}
              lineColor="bg-sky-500"
            />
            <StatCard
              icon={<Wallet size={20} className="text-amber-500" />}
              label="TOTAL BUDGET POSTED"
              value="₱ 4,500,000"
              lineColor="bg-amber-400"
              isActive
            />
            <StatCard
              icon={<CheckCircle2 size={20} className="text-emerald-600" />}
              label="RECENTLY AWARDED"
              value="5 Projects"
              subtitle="this month"
              lineColor="bg-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                Marketplace Status
              </p>
              <p className="text-3xl font-black mt-4 text-slate-900">
                {totalBids}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Total published bid opportunities
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                Open for Submission
              </p>
              <p className="text-3xl font-black mt-4 text-emerald-700">
                {openBidsCount}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Ongoing procurement projects accepting proposals
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                Vendor Readiness
              </p>
              <p className="text-3xl font-black mt-4 text-sky-700">24/7</p>
              <p className="text-sm text-slate-600 mt-2">
                Support and tender documents available online
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-primary-foreground">
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
                  {biddingProjects.map((project, idx) => (
                    <tr
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        selectedProject.id === project.id
                          ? "bg-slate-100/80"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-5 font-bold text-slate-400">
                        {idx + 1}.
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-sm leading-tight">
                          {project.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">
                          {project.location}
                        </p>
                      </td>
                      <td className="px-6 py-5 font-black text-sm">
                        ₱{" "}
                        {project.abc.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-xs">{project.deadline}</p>
                        {project.daysLeft > 0 && (
                          <p className="text-[10px] font-bold text-orange-500 mt-0.5 tracking-tighter">
                            {project.daysLeft} Days Left
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
              <button className="bg-tertiary hover:bg-tertiary/90 text-slate-950 px-6 py-2 rounded-xl font-black text-xs uppercase transition shadow-sm">
                View All Solicitations
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 bg-white border border-border rounded-4xl p-8 shadow-sm flex flex-col min-h-150 relative overflow-hidden">
          <div className="absolute -right-20 top-40 w-40 h-40 bg-slate-200/50 blur-[80px] rounded-full pointer-events-none" />

          <div className="flex-1">
            <h2 className="text-2xl font-black leading-tight tracking-tight text-primary">
              {selectedProject.name}
            </h2>
            <p className="text-secondary-foreground text-sm mt-1">
              ({selectedProject.location.split(";")[0]})
            </p>

            <div className="mt-4">
              <StatusBadge status={selectedProject.status} isLarge />
            </div>

            <div className="mt-8 space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Reference: {selectedProject.id}
              </p>
              <p className="text-slate-600 text-[13px] leading-relaxed mt-4">
                {selectedProject.description}
              </p>
            </div>

            <div className="mt-10 space-y-8 relative">
              <div className="absolute left-2.75 top-2 bottom-2 w-px bg-slate-200" />
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
              <div className="mt-10 bg-tertiary/10 border border-tertiary/20 p-6 rounded-2xl relative overflow-hidden group">
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-700 mb-2">
                  Winning Bidder Reveal
                </h4>
                <div className="h-px bg-slate-200 w-full mb-3" />
                <p className="text-[10px] font-bold text-slate-700 uppercase">
                  Winning Bidder:{" "}
                  <span className="text-slate-900">
                    {selectedProject.winner}
                  </span>
                </p>
                <p className="text-[10px] font-bold text-slate-700 uppercase mt-1">
                  Winning Bid:{" "}
                  <span className="text-slate-900 font-black text-sm">
                    ₱ {selectedProject.winningBid?.toLocaleString()}
                  </span>
                </p>
              </div>
            )}

            <div className="mt-10 rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-secondary-foreground">
                    Vendor Participation
                  </p>
                  <h3 className="text-xl font-black mt-2 text-primary">
                    Submit your proposal
                  </h3>
                </div>
                <div className="rounded-full bg-tertiary/20 text-tertiary px-3 py-1 text-[10px] uppercase font-black tracking-widest">
                  Open Now
                </div>
              </div>
              <ol className="space-y-4 text-sm text-secondary-foreground">
                <li className="flex gap-3">
                  <span className="mt-1 font-black text-tertiary">1.</span>
                  Download the bid documents and review the scope.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 font-black text-tertiary">2.</span>
                  Prepare your technical and financial proposal package.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 font-black text-tertiary">3.</span>
                  Submit before the deadline through the SK procurement office.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="mt-6 w-full rounded-xl bg-primary text-tertiary font-black uppercase tracking-widest py-3 shadow-sm transition hover:bg-primary/90"
              >
                Request Bid Package
              </button>
            </div>
          </div>

          <button className="mt-8 w-full py-4 bg-primary text-tertiary rounded-xl font-black uppercase text-[11px] tracking-widest shadow-sm flex items-center justify-center gap-3 transition hover:bg-primary/90">
            <Download size={18} strokeWidth={3} /> Download Bidding Documents
            (PDF)
          </button>
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
