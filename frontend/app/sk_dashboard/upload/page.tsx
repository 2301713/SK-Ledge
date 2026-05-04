"use client";

import { useState, useEffect, DragEvent } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar"; // Verify path
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";
import {
  UploadCloud,
  FileText,
  X,
  Receipt,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

type FileWithPreview = {
  id: string; // Added an ID for easier removal
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
  const [dragActiveReceipts, setDragActiveReceipts] = useState(false);
  const [dragActiveReports, setDragActiveReports] = useState(false);
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

        if (profileError)
          console.error("Error fetching profile:", profileError.message);

        if (profileData) {
          if (
            profileData.role_type !== "SK_Chairperson" &&
            profileData.role_type !== "SK_Treasurer"
          ) {
            console.warn(
              "Unauthorized: Only SK Officials can upload documents.",
            );
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
      id: Math.random().toString(36).substring(7), // Generate simple unique ID
      file,
      preview: URL.createObjectURL(file),
    }));

    if (type === "receipts") {
      setReceipts((prev) => [...prev, ...mapped]);
    } else {
      setReports((prev) => [...prev, ...mapped]);
    }
  };

  const handleDrop = (
    e: DragEvent<HTMLLabelElement>,
    type: "receipts" | "reports",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Fixed the ESLint error by changing the ternary to a standard if/else
    if (type === "receipts") {
      setDragActiveReceipts(false);
    } else {
      setDragActiveReports(false);
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(Array.from(e.dataTransfer.files), type);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "receipts" | "reports",
  ) => {
    if (e.target.files && e.target.files[0]) {
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
    // TODO: Implement actual Supabase Storage upload here
    setTimeout(() => {
      setIsSubmitting(false);
      setReceipts([]);
      setReports([]);
      alert("Files successfully uploaded to the SK-Ledge vault!");
    }, 2000);
  };

  // UI HELPERS
  const renderFilePreview = (
    item: FileWithPreview,
    type: "receipts" | "reports",
  ) => {
    const isImage = item.file.type.startsWith("image/");
    const fileSize = (item.file.size / 1024 / 1024).toFixed(2); // Convert to MB

    return (
      <div
        key={item.id}
        className="relative group bg-white border border-border rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
      >
        {/* Thumbnail Icon/Image */}
        <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-border flex items-center justify-center">
          {isImage ? (
            <Image
              src={item.preview}
              alt="preview"
              className="w-full h-full object-cover"
              height={60}
              width={60}
            />
          ) : (
            <FileText className="w-6 h-6 text-primary/60" />
          )}
        </div>

        {/* File Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-primary-foreground truncate">
            {item.file.name}
          </p>
          <p className="text-xs text-secondary-foreground font-medium">
            {fileSize} MB
          </p>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => removeFile(item.id, type)}
          className="p-1.5 bg-red-50 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 bg-primary rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  const totalFiles = receipts.length + reports.length;

  return (
    <div className="flex min-h-screen bg-background">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* HEADER */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border px-10 py-8 sticky top-0 z-10">
          <h1 className="text-3xl font-extrabold text-primary-foreground tracking-tight">
            Document Center
          </h1>
          <p className="text-secondary-foreground mt-1">
            Securely upload official SK receipts and liquidation reports to the
            ledger.
          </p>
        </header>

        <div className="p-10 max-w-5xl space-y-10">
          {/* RECEIPTS SECTION */}
          <section className="bg-white p-8 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary-foreground">
                  Official Receipts
                </h2>
                <p className="text-xs text-secondary-foreground uppercase tracking-wider font-bold">
                  JPEG, PNG, PDF up to 10MB
                </p>
              </div>
            </div>

            {/* Dropzone */}
            <label
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActiveReceipts(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActiveReceipts(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => handleDrop(e, "receipts")}
              className={`relative flex flex-col items-center justify-center w-full py-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                dragActiveReceipts
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <UploadCloud
                className={`w-10 h-10 mb-3 transition-colors ${dragActiveReceipts ? "text-primary" : "text-gray-400"}`}
              />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold text-primary">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileChange(e, "receipts")}
              />
            </label>

            {/* Previews */}
            {receipts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                {receipts.map((file) => renderFilePreview(file, "receipts"))}
              </div>
            )}
          </section>

          {/* REPORTS SECTION */}
          <section className="bg-white p-8 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-tertiary/20 flex items-center justify-center text-tertiary">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary-foreground">
                  Liquidation Reports
                </h2>
                <p className="text-xs text-secondary-foreground uppercase tracking-wider font-bold">
                  PDF, DOCX, XLSX up to 20MB
                </p>
              </div>
            </div>

            {/* Dropzone */}
            <label
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActiveReports(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActiveReports(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => handleDrop(e, "reports")}
              className={`relative flex flex-col items-center justify-center w-full py-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                dragActiveReports
                  ? "border-tertiary bg-tertiary/5 scale-[1.01]"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <UploadCloud
                className={`w-10 h-10 mb-3 transition-colors ${dragActiveReports ? "text-tertiary" : "text-gray-400"}`}
              />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold text-tertiary">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileChange(e, "reports")}
              />
            </label>

            {/* Previews */}
            {reports.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                {reports.map((file) => renderFilePreview(file, "reports"))}
              </div>
            )}
          </section>

          {/* SUBMISSION FOOTER */}
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-2">
              {totalFiles > 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-bold text-primary-foreground">
                    {totalFiles} document{totalFiles > 1 ? "s" : ""} ready for
                    upload
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-secondary-foreground" />
                  <span className="text-sm font-medium text-secondary-foreground">
                    No documents selected yet.
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={totalFiles === 0 || isSubmitting}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 disabled:bg-primary/50 disabled:shadow-none transition-all active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? "Processing..." : "Submit to Ledger"}
              {!isSubmitting && <UploadCloud className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
