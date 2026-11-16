"use client";

import { ExternalLink, FileText, X } from "lucide-react";
import { parseProposalUrl } from "@/lib/bidProposal";

interface ProposalPreviewModalProps {
  proposalUrl: string;
  vendorName: string;
  onClose: () => void;
}

function canPreviewInline(url: string): boolean {
  const storagePath = parseProposalUrl(url);
  if (storagePath) {
    return storagePath.toLowerCase().endsWith(".pdf");
  }

  try {
    const parsed = new URL(url, "https://local.invalid");
    return parsed.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

export default function ProposalPreviewModal({
  proposalUrl,
  vendorName,
  onClose,
}: ProposalPreviewModalProps) {
  const previewable = canPreviewInline(proposalUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${vendorName} bid proposal`}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-primary-foreground">
                {vendorName}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                Bid proposal
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={proposalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-[11px] font-bold text-secondary-foreground transition hover:bg-secondary hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close proposal preview"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary-foreground transition hover:bg-secondary hover:text-primary-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {previewable ? (
          <iframe
            src={proposalUrl}
            title={`${vendorName} proposal document`}
            className="h-[72vh] w-full border-0 bg-white"
          />
        ) : (
          <div className="flex h-[52vh] flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <FileText className="h-6 w-6 text-secondary-foreground" />
            </div>
            <p className="text-sm font-bold text-primary-foreground">
              This document can&apos;t be previewed inline
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-secondary-foreground">
              Word documents open in a new tab or download instead of rendering
              in the browser.
            </p>
            <a
              href={proposalUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" />
              Open document
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
