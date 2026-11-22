"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  FileText,
  Gavel,
  Loader2,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import {
  canRecordProjectDecision,
  isProjectApproved,
  projectDisplayStatus,
} from "@/lib/projectApproval";

export interface ApprovalProject {
  id: number;
  name: string;
  status: string;
  is_open_for_bidding: boolean;
  bid_deadline?: string | null;
  approval_date?: string | null;
  approval_remarks?: string | null;
  rejection_date?: string | null;
  rejection_reason?: string | null;
  approval_document_id?: string | null;
  status_updated_at?: string | null;
  approver?: { full_name?: string | null } | null;
}

interface ProjectApprovalModalProps {
  project: ApprovalProject;
  roleType: string | null | undefined;
  approvalStatus: string | null | undefined;
  onClose: () => void;
  onUpdated: () => void;
}

const inputClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold text-primary-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const readError = async (response: Response) => {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "The request failed. Please try again.";
  } catch {
    return "The request failed. Please try again.";
  }
};

export default function ProjectApprovalModal({
  project,
  roleType,
  approvalStatus,
  onClose,
  onUpdated,
}: ProjectApprovalModalProps) {
  const isChairperson = canRecordProjectDecision(roleType, approvalStatus);
  const [approvalDate, setApprovalDate] = useState(today());
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [rejectionDate, setRejectionDate] = useState(today());
  const [rejectionReason, setRejectionReason] = useState("");
  const [deadline, setDeadline] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [busy, setBusy] = useState<
    "approve" | "reject" | "publish" | "close" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const isProposed = project.status === "Proposed";
  const isApproved = isProjectApproved(project);

  const post = async (payload: Record<string, unknown>) => {
    const response = await fetch(`/api/projects/${project.id}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    return response.json();
  };

  const uploadDocument = async () => {
    if (!document) return null;

    const formData = new FormData();
    formData.append("file", document);
    formData.append("document_kind", "project_approval");

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const body = (await response.json()) as { data?: { id?: string } };
    if (!body.data?.id) {
      throw new Error("The approval document could not be saved.");
    }

    return body.data.id;
  };

  const handleApprove = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy("approve");

    try {
      const documentId = await uploadDocument();
      await post({
        action: "approve",
        approval_date: approvalDate,
        approval_remarks: approvalRemarks,
        approval_document_id: documentId,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy("reject");

    try {
      await post({
        action: "reject",
        rejection_date: rejectionDate,
        rejection_reason: rejectionReason,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setBusy(null);
    }
  };

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy("publish");

    try {
      await post({ action: "publish_bidding", bid_deadline: deadline });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open bidding.");
    } finally {
      setBusy(null);
    }
  };

  const handleCloseBidding = async () => {
    setError(null);
    setBusy("close");

    try {
      await post({ action: "close_bidding" });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not close bidding.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-approval-title"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border bg-secondary/30 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary-foreground">
              Official Approval Record
            </p>
            <h2
              id="project-approval-title"
              className="mt-1 truncate text-xl font-black text-primary-foreground"
            >
              {project.name}
            </h2>
            <p className="mt-1 text-xs text-secondary-foreground">
              Current status:{" "}
              <span className="font-bold text-primary-foreground">
                {projectDisplayStatus(project)}
              </span>
              {" · "}Last changed {formatDate(project.status_updated_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close approval dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-secondary-foreground transition hover:bg-secondary"
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-6 overflow-y-auto px-6 py-6">
          <p className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 text-xs leading-relaxed text-secondary-foreground">
            SK-Ledge does not grant legal approval. Recording an approval stores
            the decision issued through the official SK/Sangguniang Bayan
            process and unlocks procurement for this project.
          </p>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger"
            >
              {error}
            </div>
          )}

          {/* APPROVED / REJECTED RECORD */}
          {isApproved && (
            <section className="space-y-3 rounded-2xl border border-success/30 bg-success/[0.06] p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-success">
                <CheckCircle2 size={16} /> Approved
              </div>
              <dl className="grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-bold uppercase tracking-wider text-secondary-foreground">
                    Approval date
                  </dt>
                  <dd className="mt-0.5 font-semibold text-primary-foreground">
                    {formatDate(project.approval_date)}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase tracking-wider text-secondary-foreground">
                    Recorded by
                  </dt>
                  <dd className="mt-0.5 font-semibold text-primary-foreground">
                    {project.approver?.full_name || "SK Chairperson"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-bold uppercase tracking-wider text-secondary-foreground">
                    Remarks
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap font-medium text-primary-foreground">
                    {project.approval_remarks || "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-bold uppercase tracking-wider text-secondary-foreground">
                    Resolution document
                  </dt>
                  <dd className="mt-0.5">
                    {project.approval_document_id ? (
                      <a
                        href={`/api/documents/${project.approval_document_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                      >
                        <FileText size={13} /> View document
                      </a>
                    ) : (
                      <span className="text-secondary-foreground">
                        No document filed
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {project.status === "Rejected" && (
            <section className="space-y-2 rounded-2xl border border-danger/30 bg-danger/[0.06] p-4 text-xs">
              <div className="flex items-center gap-2 text-sm font-bold text-danger">
                <XCircle size={16} /> Rejected
              </div>
              <p>
                <span className="font-bold text-secondary-foreground">
                  Rejected on:
                </span>{" "}
                <span className="font-semibold text-primary-foreground">
                  {formatDate(project.rejection_date)}
                </span>
              </p>
              <p className="whitespace-pre-wrap font-medium text-primary-foreground">
                {project.rejection_reason || "—"}
              </p>
            </section>
          )}

          {/* DECISION FORMS: Chairperson only, Proposed only */}
          {isProposed && isChairperson && (
            <div className="grid gap-5 lg:grid-cols-2">
              <form
                onSubmit={handleApprove}
                className="space-y-3 rounded-2xl border border-border p-4"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-primary-foreground">
                  <CheckCircle2 size={16} className="text-success" />
                  Record Official Approval
                </div>

                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Approval date
                  </span>
                  <input
                    type="date"
                    required
                    value={approvalDate}
                    onChange={(event) => setApprovalDate(event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Approval remarks / notes
                  </span>
                  <textarea
                    required
                    maxLength={1000}
                    rows={3}
                    value={approvalRemarks}
                    onChange={(event) => setApprovalRemarks(event.target.value)}
                    placeholder="Reference the resolution or approval issued by the official process."
                    className={inputClass}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Approval document / resolution PDF (optional)
                  </span>
                  <span className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 px-3 py-2.5 text-xs font-semibold text-secondary-foreground transition hover:border-primary">
                    <UploadCloud size={15} className="text-primary" />
                    {document ? document.name : "Choose a PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={(event) =>
                        setDocument(event.target.files?.[0] ?? null)
                      }
                    />
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={busy !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {busy === "approve" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Record Official Approval
                </button>
              </form>

              <form
                onSubmit={handleReject}
                className="space-y-3 rounded-2xl border border-border p-4"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-primary-foreground">
                  <XCircle size={16} className="text-danger" />
                  Record Rejection
                </div>

                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Rejection date
                  </span>
                  <input
                    type="date"
                    required
                    value={rejectionDate}
                    onChange={(event) => setRejectionDate(event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Rejection reason
                  </span>
                  <textarea
                    required
                    maxLength={1000}
                    rows={5}
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="State why the proposal was not approved."
                    className={inputClass}
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-danger transition hover:bg-danger/15 disabled:opacity-50"
                >
                  {busy === "reject" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  Record Rejection
                </button>
              </form>
            </div>
          )}

          {isProposed && !isChairperson && (
            <p className="rounded-2xl border border-dashed border-border bg-secondary/40 p-4 text-xs font-medium text-secondary-foreground">
              Only the SK Chairperson may record official approval or rejection
              for this project.
            </p>
          )}

          {/* BIDDING CONTROLS: approved projects only */}
          {isApproved && isChairperson && (
            <section className="space-y-3 rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-primary-foreground">
                <Gavel size={16} className="text-primary" />
                Bidding controls
              </div>

              {project.is_open_for_bidding ? (
                <div className="space-y-3 text-xs">
                  <p className="font-semibold text-secondary-foreground">
                    Bidding is open until{" "}
                    <span className="text-primary-foreground">
                      {formatDate(project.bid_deadline)}
                    </span>
                    .
                  </p>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={handleCloseBidding}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-secondary disabled:opacity-50"
                  >
                    {busy === "close" && (
                      <Loader2 size={13} className="animate-spin" />
                    )}
                    Close Bidding
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePublish} className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                      Bid deadline
                    </span>
                    <input
                      type="date"
                      required
                      value={deadline}
                      onChange={(event) => setDeadline(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy !== null}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    {busy === "publish" ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Calendar size={13} />
                    )}
                    Open for Bidding
                  </button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
