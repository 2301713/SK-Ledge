"use client";

import { useEffect } from "react";
import { MapPin, Tag, X } from "lucide-react";
import type { BiddingProject } from "../../app/open_bidding/types";
import StatusBadge from "./StatusBadge";
import TimelineItem from "./TimelineItem";

interface ProcurementDetailModalProps {
  visible: boolean;
  project: BiddingProject | null;
  onClose: () => void;
  onRequestPackage: () => void;
}

export default function ProcurementDetailModal({
  visible,
  project,
  onClose,
  onRequestPackage,
}: ProcurementDetailModalProps) {
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, onClose]);

  if (!visible || !project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm animate-fadein"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="procurement-detail-title"
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-primary via-primary to-tertiary" />

        <header className="relative shrink-0 border-b border-border bg-gradient-to-br from-primary/[0.07] via-white to-white px-6 py-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close procurement details"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-secondary-foreground transition hover:bg-secondary hover:text-primary-foreground"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1 pr-12 lg:pr-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Selected Procurement
              </p>
              <h2
                id="procurement-detail-title"
                className="mt-2 text-xl font-black leading-tight tracking-tight text-primary-foreground sm:text-2xl"
              >
                {project.name}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  <MapPin className="h-3 w-3" />
                  {project.location.split(";")[0] || "—"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  <Tag className="h-3 w-3" />
                  {project.location.split(";")[1] || "General"}
                </span>
                <StatusBadge status={project.status} />
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3 sm:max-w-sm lg:w-[340px]">
              <div className="rounded-2xl border border-border bg-white/90 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Approved Budget
                </p>
                <p className="mt-1 text-sm font-black tabular-nums text-primary-foreground">
                  ₱{" "}
                  {project.abc.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white/90 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Deadline
                </p>
                <p className="mt-1 text-sm font-black text-primary-foreground">
                  {project.deadline}
                </p>
                {project.daysLeft > 0 && (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-pending">
                    {project.daysLeft} days left
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary-foreground">
                Scope of Work
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-secondary-foreground">
                {project.description}
              </p>

              <div className="relative mt-8 space-y-7">
                <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
                <TimelineItem
                  label="Pre-Bid Conference"
                  date="Upon publication"
                  active
                />
                <TimelineItem
                  label="Bid Opening & Evaluation"
                  date={project.opening}
                  active={
                    project.status === "Evaluation" ||
                    project.status === "Awarded"
                  }
                  isInactive={project.status === "Accepting Bids"}
                />
                <TimelineItem
                  label="Notice of Award"
                  isStar={project.status === "Awarded"}
                  isInactive={project.status !== "Awarded"}
                />
              </div>

              {project.status === "Awarded" && (
                <div className="relative mt-8 overflow-hidden rounded-2xl border border-tertiary/30 bg-tertiary/10 p-5">
                  <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-secondary-foreground">
                    Winning Bidder Reveal
                  </h4>
                  <div className="mb-3 h-px w-full bg-border" />
                  <p className="text-[10px] font-bold uppercase text-secondary-foreground">
                    Winning Bidder:{" "}
                    <span className="text-primary-foreground">
                      {project.winner || "Pending publication"}
                    </span>
                  </p>
                  {project.awardTxHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${project.awardTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex break-all text-[10px] font-bold uppercase text-primary hover:underline"
                    >
                      Verified on-chain — View transaction
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="rounded-2xl border border-border bg-secondary/25 p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-foreground">
                      Vendor Participation
                    </p>
                    <h3 className="mt-1 text-lg font-black text-primary-foreground">
                      Submit your proposal
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-success">
                    Open Now
                  </span>
                </div>

                <ol className="space-y-3 text-xs leading-relaxed text-secondary-foreground">
                  {[
                    "Review the project scope and budget details above.",
                    "Prepare your technical and financial proposal package.",
                    "Submit before the deadline through the SK procurement office.",
                  ].map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>

                <p className="mt-5 rounded-xl border border-border bg-white px-3 py-3 text-xs leading-relaxed text-secondary-foreground">
                  Vendors submit bids through the SK-Ledge mobile app.
                </p>

                <button
                  type="button"
                  onClick={onRequestPackage}
                  className="mt-4 w-full rounded-xl bg-primary py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-95"
                >
                  Request Bid Package
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
