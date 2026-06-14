"use client";

import React from "react";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/80 backdrop-blur-sm p-6">
      <div className="relative w-full max-w-2xl rounded-4xl border border-border bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-secondary-foreground font-black">
              Package Request
            </p>
            <h2 className="mt-3 text-2xl font-black text-primary tracking-tight">
              Request Bidding Documents
            </h2>
            <p className="text-sm text-secondary-foreground mt-2">
              Fill this quick form and our procurement team will send the
              package.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {requestSubmitted ? (
            <div className="rounded-3xl border border-success/30 bg-success/10 p-6 text-success">
              <p className="text-sm font-black">Request Sent</p>
              <p className="mt-2 text-sm text-slate-700">
                Thank you! Our team will reach out to you shortly with the bid
                package details.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 inline-flex rounded-xl bg-primary text-tertiary px-5 py-3 text-sm font-black uppercase tracking-widest transition hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                  Your Name
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(event) => onVendorNameChange(event.target.value)}
                    placeholder="Jane Doe"
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </label>
                <label className="block text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                  Company
                  <input
                    type="text"
                    value={vendorCompany}
                    onChange={(event) =>
                      onVendorCompanyChange(event.target.value)
                    }
                    placeholder="Metro Builders"
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                Email Address
                <input
                  type="email"
                  value={vendorEmail}
                  onChange={(event) => onVendorEmailChange(event.target.value)}
                  placeholder="jane@vendor.com"
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </label>

              <label className="block text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                Notes / Inquiry
                <textarea
                  value={vendorNote}
                  onChange={(event) => onVendorNoteChange(event.target.value)}
                  placeholder="Please include any questions about the scope, timeline, or submission process."
                  rows={4}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </label>

              <button
                type="submit"
                className="mt-3 w-full rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-widest text-tertiary transition hover:bg-primary/90"
              >
                Send Request
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
