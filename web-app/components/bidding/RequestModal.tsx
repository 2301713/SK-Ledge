"use client";

import React from "react";
import { CheckCircle2, FileText, Send, X } from "lucide-react";

interface RequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  requestSubmitted: boolean;
  vendorName: string;
  vendorCompany: string;
  vendorEmail: string;
  vendorNote: string;
  onVendorNameChange: (value: string) => void;
  onVendorCompanyChange: (value: string) => void;
  onVendorEmailChange: (value: string) => void;
  onVendorNoteChange: (value: string) => void;
}

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-primary-foreground outline-none transition placeholder:text-secondary-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

const labelClass =
  "block text-[10px] font-bold uppercase tracking-[0.16em] text-secondary-foreground";

export default function RequestModal({
  visible,
  onClose,
  onSubmit,
  requestSubmitted,
  vendorName,
  vendorCompany,
  vendorEmail,
  vendorNote,
  onVendorNameChange,
  onVendorCompanyChange,
  onVendorEmailChange,
  onVendorNoteChange,
}: RequestModalProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm animate-fadein"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary to-tertiary" />

        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/5">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Package Request
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-primary-foreground">
                Request bidding documents
              </h2>
              <p className="mt-1 text-xs text-secondary-foreground">
                Fill this quick form and our procurement team will send the
                package.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close request form"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-secondary-foreground transition hover:bg-secondary hover:text-primary-foreground"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="p-6">
          {requestSubmitted ? (
            <div className="rounded-2xl border border-success/25 bg-success/[0.07] p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm font-black text-success">Request sent</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-secondary-foreground">
                Thank you. Our procurement team will reach out shortly with the
                bid package details.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-95"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className={labelClass}>
                  Your Name
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(event) => onVendorNameChange(event.target.value)}
                    placeholder="Jane Doe"
                    className={inputClass}
                    required
                  />
                </label>
                <label className={labelClass}>
                  Company
                  <input
                    type="text"
                    value={vendorCompany}
                    onChange={(event) =>
                      onVendorCompanyChange(event.target.value)
                    }
                    placeholder="Metro Builders"
                    className={inputClass}
                    required
                  />
                </label>
              </div>

              <label className={labelClass}>
                Email Address
                <input
                  type="email"
                  value={vendorEmail}
                  onChange={(event) => onVendorEmailChange(event.target.value)}
                  placeholder="jane@vendor.com"
                  className={inputClass}
                  required
                />
              </label>

              <label className={labelClass}>
                Notes / Inquiry
                <textarea
                  value={vendorNote}
                  onChange={(event) => onVendorNoteChange(event.target.value)}
                  placeholder="Include any questions about scope, timeline, or the submission process."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </label>

              <button
                type="submit"
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-[0.99]"
              >
                <Send className="h-3.5 w-3.5" />
                Send Request
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
