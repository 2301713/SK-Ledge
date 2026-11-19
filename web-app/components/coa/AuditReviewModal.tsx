"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AUDIT_FINDINGS_MAX_LENGTH,
  AUDIT_STATUS_LABELS,
  type AuditStatus,
  type ExpenseAudit,
} from "@/lib/audits";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

interface AuditReviewModalProps {
  expenseId: string;
  reference: string;
  payee: string;
  category: string;
  amount: string;
  barangay: string;
  purpose: string;
  txHash: string | null;
  latestAudit: ExpenseAudit | null;
  onClose: () => void;
  onSaved: (audit: ExpenseAudit) => void;
}

interface SupportingDocument {
  id: string;
  file_name: string;
  size_bytes: number;
  sha256: string;
}

const OUTCOME_OPTIONS: {
  status: AuditStatus;
  label: string;
  description: string;
}[] = [
  {
    status: "clean",
    label: AUDIT_STATUS_LABELS.clean,
    description: "Records and supporting documents are compliant.",
  },
  {
    status: "flagged",
    label: AUDIT_STATUS_LABELS.flagged,
    description: "Irregularity, disallowed expense, or policy issue.",
  },
  {
    status: "incomplete",
    label: AUDIT_STATUS_LABELS.incomplete,
    description: "Required supporting documents are missing.",
  },
];

export default function AuditReviewModal({
  expenseId,
  reference,
  payee,
  category,
  amount,
  barangay,
  purpose,
  txHash,
  latestAudit,
  onClose,
  onSaved,
}: AuditReviewModalProps) {
  const [status, setStatus] = useState<AuditStatus>(
    latestAudit?.status ?? "clean",
  );
  const [findings, setFindings] = useState(latestAudit?.findings ?? "");
  const [documents, setDocuments] = useState<SupportingDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let active = true;

    const loadDocuments = async () => {
      setIsLoadingDocuments(true);
      try {
        const { data, error: documentsError } = await supabase
          .from("documents")
          .select("id, file_name, size_bytes, sha256")
          .eq("expense_id", expenseId)
          .order("created_at", { ascending: false });

        if (!active) return;

        if (documentsError) {
          throw new Error(documentsError.message);
        }

        setDocuments((data ?? []) as SupportingDocument[]);
      } catch (err) {
        if (active) {
          console.error("Failed to load voucher documents:", err);
        }
      } finally {
        if (active) setIsLoadingDocuments(false);
      }
    };

    void loadDocuments();
    return () => {
      active = false;
    };
  }, [expenseId]);

  const findingsRequired = status !== "clean";
  const canSubmit =
    !isSaving && (!findingsRequired || findings.trim().length > 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_id: expenseId,
          status,
          findings,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        data?: {
          id: string;
          expenseId: string;
          reviewedBy: string | null;
          status: AuditStatus;
          findings: string;
          createdAt: string;
        };
        error?: string;
      } | null;

      if (!response.ok || !body?.data) {
        throw new Error(body?.error || "Failed to record the audit review.");
      }

      onSaved({
        id: body.data.id,
        expense_id: body.data.expenseId,
        reviewed_by: body.data.reviewedBy,
        status: body.data.status,
        findings: body.data.findings,
        created_at: body.data.createdAt,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record the audit review.",
      );
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary-foreground/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary-foreground">
              COA Review
            </p>
            <h2
              id="audit-modal-title"
              className="mt-1 text-xl font-black tracking-tight text-primary-foreground"
            >
              Audit Voucher {reference}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit dialog"
            className="rounded-xl p-2 text-secondary-foreground transition hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-secondary/30 p-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
              Payee / Entity
            </p>
            <p className="mt-1 text-sm font-bold text-primary-foreground">
              {payee}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
              Amount
            </p>
            <p className="mt-1 text-sm font-bold tabular-nums text-primary-foreground">
              {amount}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
              Barangay
            </p>
            <p className="mt-1 text-sm font-semibold text-primary-foreground">
              {barangay}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
              Category
            </p>
            <p className="mt-1 text-sm font-semibold text-primary-foreground">
              {category}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
              Purpose
            </p>
            <p className="mt-1 text-sm text-primary-foreground">{purpose}</p>
          </div>
          {txHash ? (
            <div className="sm:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                Ledger Transaction
              </p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block break-all font-mono text-[11px] font-semibold text-primary underline"
              >
                {txHash}
              </a>
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
              Supporting Documents
            </p>
            <span className="text-[10px] font-semibold text-secondary-foreground">
              {documents.length} filed
            </span>
          </div>

          {isLoadingDocuments ? (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-border p-3 text-xs text-secondary-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading documents…
            </div>
          ) : documents.length === 0 ? (
            <p className="mt-2 rounded-xl border border-pending/30 bg-pending/10 p-3 text-xs font-medium text-pending">
              No receipt documents are linked to this voucher.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {documents.map((document) => (
                <a
                  key={document.id}
                  href={`/api/documents/${document.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition hover:bg-secondary/40"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-secondary-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-primary-foreground">
                        {document.file_name}
                      </span>
                      <span
                        className="block font-mono text-[10px] text-secondary-foreground/70"
                        title={document.sha256}
                      >
                        SHA-256 {document.sha256.slice(0, 12)}…
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-primary">
                    View
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <fieldset>
            <legend className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
              Audit Outcome
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {OUTCOME_OPTIONS.map((option) => {
                const selected = status === option.status;
                return (
                  <label
                    key={option.status}
                    className={`cursor-pointer rounded-2xl border-2 p-3 transition ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-secondary-foreground/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="audit-status"
                      value={option.status}
                      checked={selected}
                      onChange={() => setStatus(option.status)}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2 text-xs font-bold text-primary-foreground">
                      {option.status === "clean" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : option.status === "flagged" ? (
                        <AlertTriangle className="h-4 w-4 text-danger" />
                      ) : (
                        <FileText className="h-4 w-4 text-pending" />
                      )}
                      {option.label}
                    </span>
                    <span className="mt-1 block text-[10px] leading-relaxed text-secondary-foreground">
                      {option.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="audit-findings"
              className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-secondary-foreground"
            >
              <span>
                Findings {findingsRequired ? "(required)" : "(optional)"}
              </span>
              <span className="font-medium normal-case tracking-normal">
                {findings.length}/{AUDIT_FINDINGS_MAX_LENGTH}
              </span>
            </label>
            <textarea
              id="audit-findings"
              value={findings}
              onChange={(event) => setFindings(event.target.value)}
              maxLength={AUDIT_FINDINGS_MAX_LENGTH}
              rows={4}
              placeholder="Document the basis for this outcome, missing documents, or the corrective action needed."
              className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-sm text-primary-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {latestAudit ? (
            <p className="rounded-xl border border-border bg-secondary/30 p-3 text-[11px] text-secondary-foreground">
              Last review: {AUDIT_STATUS_LABELS[latestAudit.status]} on{" "}
              {new Date(latestAudit.created_at).toLocaleString("en-PH")}. Saving
              adds a new entry; earlier findings stay in the audit trail.
            </p>
          ) : null}

          {error ? (
            <p className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-secondary-foreground transition hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-secondary-foreground/30"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {isSaving ? "Recording review…" : "Save Audit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
