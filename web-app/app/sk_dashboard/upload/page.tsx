"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
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

export default function SKUploadPage() {
  const router = useRouter();

  // AUTH STATE
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // FILE STATE
  const [receipts, setReceipts] = useState<FileWithPreview[]>([]);
  const [reports, setReports] = useState<FileWithPreview[]>([]);

  // UI INTERACTION STATE
  const [activeDropzone, setActiveDropzone] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // FILE HANDLERS
  const processFiles = (files: File[], type: "receipts" | "reports") => {
    const mapped = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
    }));

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
  };

  const removeFile = (id: string, type: "receipts" | "reports") => {
    if (type === "receipts") {
      setReceipts((prev) => prev.filter((item) => item.id !== id));
    } else {
      setReports((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // MOCK SUBMIT HANDLER
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setReceipts([]);
      setReports([]);
      alert("Files successfully uploaded to the SK-Ledge vault!");
    }, 2000);
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
          subtitle="Submit official documents for audit verification."
          actions={
            <button
              disabled={isSubmitting || totalFiles === 0}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-30 disabled:grayscale"
            >
              {isSubmitting ? "Processing..." : "Submit for Review"}
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
              subtitle="PDF, DOCX, or XLSX up to 20MB"
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
              Submissions are encrypted and stored in the SK-Ledge private
              vault.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
