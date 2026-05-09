"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";
import { useToast } from "@/lib/useToast";
import {
  Receipt,
  Upload,
  DollarSign,
  Building,
  Tag,
  FileText,
  Calendar,
  CheckCircle2,
  Save,
  X,
} from "lucide-react";

interface ExpenseForm {
  amount: string;
  vendor: string;
  category: string;
  description: string;
  date: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

const CATEGORIES = [
  "Sports & Development",
  "Education",
  "Health",
  "Environment",
  "Governance",
  "Office Supplies",
  "Transportation",
  "Communication",
  "Utilities",
  "Other",
];

export default function ExpensesPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<ExpenseForm>({
    amount: "",
    vendor: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [receipts, setReceipts] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("No active user session found.");
          router.push("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, role_type, full_name, barangay")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          return;
        }

        if (profileData) {
          if (
            !["SK_Chairperson", "SK_Treasurer"].includes(profileData.role_type)
          ) {
            console.warn(
              "Unauthorized access: Only SK officials can log expenses.",
            );
            router.push("/unauthorized");
            return;
          }

          const profile = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
          };

          setCurrentUser(profile as UserAccount);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleInputChange = (field: keyof ExpenseForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }));

    setReceipts((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setReceipts((prev) => prev.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!form.amount || parseFloat(form.amount) <= 0) {
      errors.push("Please enter a valid amount");
    }

    if (!form.vendor.trim()) {
      errors.push("Vendor name is required");
    }

    if (!form.category) {
      errors.push("Please select a category");
    }

    if (!form.description.trim()) {
      errors.push("Description is required");
    }

    if (receipts.length === 0) {
      errors.push("At least one receipt must be uploaded");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Save to Supabase/blockchain with file uploads
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Reset form
      setForm({
        amount: "",
        vendor: "",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setReceipts([]);

      toast.success("Expense logged successfully!");
    } catch {
      toast.error("Failed to log expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          SK
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Expense Logger...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background selection:bg-tertiary selection:text-primary">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Receipt size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Expense Logger
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                Record transactions with digital receipts
              </p>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* EXPENSE DETAILS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <FileText size={20} />
                  Transaction Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AMOUNT */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Amount (₱)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.amount}
                        onChange={(e) =>
                          handleInputChange("amount", e.target.value)
                        }
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* DATE */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Transaction Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) =>
                          handleInputChange("date", e.target.value)
                        }
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* VENDOR */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Vendor/Supplier
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={form.vendor}
                        onChange={(e) =>
                          handleInputChange("vendor", e.target.value)
                        }
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="Enter vendor name"
                      />
                    </div>
                  </div>

                  {/* CATEGORY */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Category
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="h-5 w-5 text-slate-400" />
                      </div>
                      <select
                        value={form.category}
                        onChange={(e) =>
                          handleInputChange("category", e.target.value)
                        }
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="mt-6 space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                    placeholder="Describe the expense and purpose..."
                  />
                </div>
              </div>

              {/* RECEIPT UPLOAD */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Upload size={20} />
                  Digital Receipts
                </h2>

                {/* DRAG & DROP AREA */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-sm font-bold text-slate-900 mb-2">
                    Drop receipt files here, or{" "}
                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                      browse
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports JPG, PNG, PDF • Max 10MB each
                  </p>
                </div>

                {/* UPLOADED FILES */}
                {receipts.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-bold text-slate-700">
                      Uploaded Files ({receipts.length})
                    </h3>
                    {receipts.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 text-green-600 rounded">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSubmitting ? "Logging Expense..." : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
