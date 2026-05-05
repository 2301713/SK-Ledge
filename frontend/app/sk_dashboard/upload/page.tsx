"use client";

import { useState, useEffect, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";
import {
  UploadCloud,
  FileText,
  X,
  Receipt,
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

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, full_name, role_type, barangay")
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
          });
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
    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
      {files.map((item) => (
        <div
          key={item.id}
          className="group flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-all animate-in fade-in slide-in-from-bottom-1"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 bg-white border rounded-lg overflow-hidden flex items-center justify-center">
              {item.file.type.startsWith("image/") ? (
                <Image
                  src={item.preview}
                  alt="preview"
                  width={40}
                  height={40}
                  className="object-cover h-full w-full"
                />
              ) : (
                <FileText className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-700 truncate">
                {item.file.name}
              </p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {(item.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={() => removeFile(item.id, type)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-3xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          SK
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  if (!currentUser) return null;

  const totalFiles = receipts.length + reports.length;

  return (
    <div className="flex min-h-screen bg-secondary">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOP HEADER */}
        <header className="px-12 py-10 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                Document Vault
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Upload Documents
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Submit official documents for audit verification.
            </p>
          </div>

          <button
            disabled={isSubmitting || totalFiles === 0}
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-slate-950 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 hover:shadow-blue-100 disabled:opacity-20 disabled:grayscale"
          >
            {isSubmitting ? "Processing..." : "Submit for Review"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-12 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* MODULE 01: RECEIPTS */}
            <div className="flex flex-col">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <Receipt size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Official Receipts
                      </h3>
                      <p className="text-xs text-slate-400">
                        JPG, PNG, or PDF up to 10MB
                      </p>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                    Queue: {receipts.length}
                  </span>
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setActiveDropzone("receipts");
                  }}
                  onDragLeave={() => setActiveDropzone(null)}
                  onDrop={(e) => handleDrop(e, "receipts")}
                  className={`
                    flex flex-col items-center justify-center h-60 border-2 border-dashed rounded-4xl transition-all cursor-pointer
                    ${activeDropzone === "receipts" ? "border-blue-500 bg-blue-50/50 scale-[0.98]" : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300"}
                  `}
                >
                  <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                    <UploadCloud
                      className={`w-6 h-6 ${activeDropzone === "receipts" ? "text-blue-600" : "text-slate-400"}`}
                    />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    Drop receipts here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    or{" "}
                    <span className="text-blue-600 underline">
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
              </div>
            </div>

            {/* MODULE 02: REPORTS */}
            <div className="flex flex-col">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Liquidation Reports
                      </h3>
                      <p className="text-xs text-slate-400">
                        PDF, DOCX, or XLSX up to 20MB
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                    Queue: {reports.length}
                  </span>
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setActiveDropzone("reports");
                  }}
                  onDragLeave={() => setActiveDropzone(null)}
                  onDrop={(e) => handleDrop(e, "reports")}
                  className={`
                    flex flex-col items-center justify-center h-60 border-2 border-dashed rounded-4xl transition-all cursor-pointer
                    ${activeDropzone === "reports" ? "border-emerald-500 bg-emerald-50/50 scale-[0.98]" : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300"}
                  `}
                >
                  <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                    <Plus
                      className={`w-6 h-6 ${activeDropzone === "reports" ? "text-emerald-600" : "text-slate-400"}`}
                    />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    Add liquidation reports
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    or{" "}
                    <span className="text-emerald-600 underline">
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
              </div>
            </div>
          </div>

          {/* SYSTEM STATUS FOOTER */}
          <div className="max-w-7xl mx-auto mt-8 flex items-center gap-6 p-6 bg-slate-900/5 rounded-3xl border border-slate-200/50 backdrop-blur-sm">
            <div
              className={`p-2 rounded-full ${totalFiles > 0 ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500"}`}
            >
              <FileCheck2 size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">
                {totalFiles > 0
                  ? `${totalFiles} items staged for secure upload`
                  : "No documents selected for submission"}
              </p>
              <p className="text-xs text-slate-500">
                Submissions are encrypted and stored in the SK-Ledge private
                vault.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
