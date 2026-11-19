"use client";

import LogoLoader from "@/components/LogoLoader";
import {
  useState,
  useEffect,
  useCallback,
  DragEvent,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { useToast } from "@/lib/useToast";
import {
  RECEIPT_MAX_FILES,
  validateReceiptFile,
} from "@/lib/receipts";
import {
  UploadCloud,
  FileText,
  X,
  ShieldCheck,
  Plus,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import Image from "next/image";

type FileWithPreview = {
  id: string;
  file: File;
  preview: string;
};

type VaultDocument = {
  id: string;
  file_name: string;
  document_kind: string | null;
  size_bytes: number;
  sha256: string;
  created_at: string;
};

const DOCUMENT_KIND_LABELS: Record<string, string> = {
  receipt: "Receipt",
  liquidation_report: "Liquidation report",
  supporting_document: "Supporting document",
};

const ACCEPTED_FILE_TYPES =
  "application/pdf,image/jpeg,image/png,image/webp";

export default function SKUploadPage() {
  const router = useRouter();
  const toast = useToast();

  // AUTH STATE
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // FILE STATE
  const [receipts, setReceipts] = useState<FileWithPreview[]>([]);
  const [reports, setReports] = useState<FileWithPreview[]>([]);

  // UI INTERACTION STATE
  const [activeDropzone, setActiveDropzone] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FILED DOCUMENTS
  const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const loadVaultDocuments = useCallback(async (userId: string) => {
    setIsLoadingDocuments(true);

    try {
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, file_name, document_kind, size_bytes, sha256, created_at",
        )
        .eq("uploaded_by", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        throw new Error(error.message);
      }

      setVaultDocuments((data ?? []) as VaultDocument[]);
    } catch (err) {
      console.error("Failed to load vault documents:", err);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  // AUTHENTICATION
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select(
            "id, username, full_name, role_type, barangay, email, approval_status",
          )
          .eq("id", user.id)
          .single();

        if (profileData) {
          if (
            profileData.role_type !== "SK_Chairperson" &&
            profileData.role_type !== "SK_Treasurer"
          ) {
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          } as UserAccount);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      void loadVaultDocuments(currentUser.id);
    }
  }, [currentUser, loadVaultDocuments]);

  // FILE HANDLERS
  const processFiles = (files: File[], type: "receipts" | "reports") => {
    const staged = type === "receipts" ? receipts : reports;
    const remaining = RECEIPT_MAX_FILES - staged.length;

    if (remaining <= 0) {
      toast.error(
        `You can stage up to ${RECEIPT_MAX_FILES} files per section.`,
      );
      return;
    }

    if (files.length > remaining) {
      toast.error(
        `Only ${remaining} more file${remaining === 1 ? "" : "s"} can be staged in this section.`,
      );
    }

    const mapped: FileWithPreview[] = [];
    for (const file of files.slice(0, remaining)) {
      const error = validateReceiptFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      mapped.push({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (mapped.length === 0) return;

    if (type === "receipts") {
      setReceipts((prev) => [...prev, ...mapped]);
    } else {
      setReports((prev) => [...prev, ...mapped]);
    }
  };

  const handleDrop = (e: DragEvent, type: "receipts" | "reports") => {
    e.preventDefault();
    setActiveDropzone(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(Array.from(e.dataTransfer.files), type);
    }
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: "receipts" | "reports",
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files), type);
    }

    // Allow re-selecting the same file after a removal or failed upload.
    e.target.value = "";
  };

  const removeFile = (id: string, type: "receipts" | "reports") => {
    const remove = (items: FileWithPreview[]) => {
      const target = items.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return items.filter((item) => item.id !== id);
    };

    if (type === "receipts") {
      setReceipts(remove);
    } else {
      setReports(remove);
    }
  };

  const uploadDocument = async (
    item: FileWithPreview,
    documentKind: "receipt" | "liquidation_report",
  ) => {
    const formData = new FormData();
    formData.append("file", item.file);
    formData.append("document_kind", documentKind);

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      throw new Error(body?.error || `Failed to upload ${item.file.name}.`);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || totalFiles === 0) return;

    setIsSubmitting(true);

    const queue: {
      item: FileWithPreview;
      documentKind: "receipt" | "liquidation_report";
    }[] = [
      ...receipts.map((item) => ({
        item,
        documentKind: "receipt" as const,
      })),
      ...reports.map((item) => ({
        item,
        documentKind: "liquidation_report" as const,
      })),
    ];

    const uploadedIds = new Set<string>();
    const failures: string[] = [];

    for (const { item, documentKind } of queue) {
      try {
        await uploadDocument(item, documentKind);
        uploadedIds.add(item.id);
      } catch (error) {
        failures.push(
          error instanceof Error
            ? error.message
            : `Failed to upload ${item.file.name}.`,
        );
      }
    }

    for (const { item } of queue) {
      if (uploadedIds.has(item.id)) {
        URL.revokeObjectURL(item.preview);
      }
    }

    setReceipts((prev) => prev.filter((item) => !uploadedIds.has(item.id)));
    setReports((prev) => prev.filter((item) => !uploadedIds.has(item.id)));
    setIsSubmitting(false);

    if (uploadedIds.size > 0) {
      toast.success(
        `${uploadedIds.size} document${uploadedIds.size === 1 ? "" : "s"} stored in the vault.`,
      );
      void loadVaultDocuments(currentUser.id);
    }

    if (failures.length > 0) {
      const extra =
        failures.length > 1 ? ` (+${failures.length - 1} more failed)` : "";
      toast.error(`${failures[0]}${extra}`);
    }
  };

  // UI HELPERS
  const renderFileQueue = (
    files: FileWithPreview[],
    type: "receipts" | "reports",
  ) => (
    <div className="mt-4 max-h-60 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
      {files.map((item) => (
        <div
          key={item.id}
          className="group flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3 transition-all"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
              {item.file.type.startsWith("image/") ? (
                <Image
                  src={item.preview}
                  alt="preview"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FileText className="h-5 w-5 text-secondary-foreground" />
              )}
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-semibold text-primary-foreground">
                {item.file.name}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-secondary-foreground">
                {(item.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={() => removeFile(item.id, type)}
            className="rounded-md p-1.5 text-secondary-foreground transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );

  if (isLoading) return <LogoLoader />;

  if (!currentUser) return null;

  const totalFiles = receipts.length + reports.length;

  return (
    <div className="flex min-h-screen gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser.full_name}
          userEmail={currentUser.email}
          hideSearch
        />

        <PageHeader
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Document Vault
            </span>
          }
          title="Upload Documents"
          subtitle="File receipts and reports in the private vault for audit access."
          actions={
            <button
              disabled={isSubmitting || totalFiles === 0}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-30 disabled:grayscale"
            >
              {isSubmitting ? "Uploading..." : "Upload to Vault"}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MODULE 01: RECEIPTS */}
          <Card>
            <CardHeader
              eyebrow="Queue"
              title="Official Receipts"
              subtitle="JPG, PNG, or PDF up to 10MB"
              action={
                <span className="rounded-full bg-information/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-information">
                  Queue: {receipts.length}
                </span>
              }
            />

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setActiveDropzone("receipts");
              }}
              onDragLeave={() => setActiveDropzone(null)}
              onDrop={(e) => handleDrop(e, "receipts")}
              className={`flex h-60 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all ${
                activeDropzone === "receipts"
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-border bg-secondary/40 hover:bg-secondary"
              }`}
            >
              <div className="mb-4 rounded-xl bg-white p-3 shadow-sm">
                <UploadCloud
                  className={`h-6 w-6 ${
                    activeDropzone === "receipts"
                      ? "text-primary"
                      : "text-secondary-foreground"
                  }`}
                />
              </div>
              <p className="text-sm font-bold text-primary-foreground">
                Drop receipts here
              </p>
              <p className="mt-1 text-xs text-secondary-foreground">
                or{" "}
                <span className="text-primary underline">
                  browse files
                </span>
              </p>
              <input
                type="file"
                multiple
                hidden
                accept={ACCEPTED_FILE_TYPES}
                onChange={(e) => handleFileChange(e, "receipts")}
              />
            </label>

            {receipts.length > 0 && renderFileQueue(receipts, "receipts")}
          </Card>

          {/* MODULE 02: REPORTS */}
          <Card>
            <CardHeader
              eyebrow="Queue"
              title="Liquidation Reports"
              subtitle="PDF or image up to 10MB"
              action={
                <span className="rounded-full bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-success">
                  Queue: {reports.length}
                </span>
              }
            />

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setActiveDropzone("reports");
              }}
              onDragLeave={() => setActiveDropzone(null)}
              onDrop={(e) => handleDrop(e, "reports")}
              className={`flex h-60 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all ${
                activeDropzone === "reports"
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-border bg-secondary/40 hover:bg-secondary"
              }`}
            >
              <div className="mb-4 rounded-xl bg-white p-3 shadow-sm">
                <Plus
                  className={`h-6 w-6 ${
                    activeDropzone === "reports"
                      ? "text-primary"
                      : "text-secondary-foreground"
                  }`}
                />
              </div>
              <p className="text-sm font-bold text-primary-foreground">
                Add liquidation reports
              </p>
              <p className="mt-1 text-xs text-secondary-foreground">
                or{" "}
                <span className="text-primary underline">
                  browse documents
                </span>
              </p>
              <input
                type="file"
                multiple
                hidden
                accept={ACCEPTED_FILE_TYPES}
                onChange={(e) => handleFileChange(e, "reports")}
              />
            </label>

            {reports.length > 0 && renderFileQueue(reports, "reports")}
          </Card>
        </div>

        {/* SYSTEM STATUS */}
        <div className="flex items-center gap-6 rounded-3xl border border-border bg-primary-foreground p-6 text-white">
          <div
            className={`rounded-full p-2 ${
              totalFiles > 0
                ? "bg-success/20 text-success"
                : "bg-white/10 text-white/60"
            }`}
          >
            <FileCheck2 size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">
              {totalFiles > 0
                ? `${totalFiles} items staged for secure upload`
                : "No documents selected for submission"}
            </p>
            <p className="text-xs text-white/60">
              Files are stored privately and can only be opened by authorized
              officials.
            </p>
          </div>
        </div>

        {/* FILED DOCUMENTS */}
        <Card>
          <CardHeader
            eyebrow="Vault"
            title="Filed documents"
            subtitle="Your most recent uploads"
            action={
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                {vaultDocuments.length}
              </span>
            }
          />

          {isLoadingDocuments ? (
            <p className="py-8 text-center text-xs font-medium text-secondary-foreground">
              Loading filed documents…
            </p>
          ) : vaultDocuments.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary">
                <FileText className="h-5 w-5 text-secondary-foreground" />
              </div>
              <p className="text-sm font-bold text-primary-foreground">
                No documents filed yet
              </p>
              <p className="mt-1 text-xs text-secondary-foreground">
                Uploaded receipts and reports will appear here.
              </p>
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {vaultDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white">
                      <FileText className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-primary-foreground">
                        {document.file_name}
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-secondary-foreground">
                        {DOCUMENT_KIND_LABELS[document.document_kind ?? ""] ??
                          "Document"}{" "}
                        · {(document.size_bytes / 1024 / 1024).toFixed(2)} MB ·{" "}
                        {new Date(document.created_at).toLocaleDateString(
                          "en-PH",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </p>
                      <p
                        className="mt-0.5 font-mono text-[10px] text-secondary-foreground/70"
                        title={document.sha256}
                      >
                        SHA-256 {document.sha256.slice(0, 12)}…
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/api/documents/${document.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
