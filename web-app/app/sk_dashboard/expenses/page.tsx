"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { useToast } from "@/lib/useToast";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { syncRecord } from "@/lib/syncRecord";
import {
  Upload,
  Building,
  Tag,
  Calendar,
  CheckCircle2,
  Save,
  X,
  PhilippinePeso,
  Loader2,
  ExternalLink,
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

const inputClass =
  "w-full rounded-xl border border-border bg-white py-3 pl-10 pr-3 text-sm font-bold text-primary-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function ExpensesPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  const { isConnected, address } = useAccount();
  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const [form, setForm] = useState<ExpenseForm>({
    amount: "",
    vendor: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [receipts, setReceipts] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const submitRef = useRef<{
    barangay: string;
    amount: number;
    purpose: string;
  } | null>(null);

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
          .select(
            "id, username, role_type, full_name, barangay, email, approval_status",
          )
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
            email: profileData.email,
            approval_status: profileData.approval_status,
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

    try {
      submitRef.current = {
        barangay: currentUser?.barangay || "General",
        amount: Math.round(parseFloat(form.amount) * 100),
        purpose: `${form.description} — Vendor: ${form.vendor}`,
      };

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: SK_LEDGE_ABI,
        functionName: "addRecord",
        args: [
          submitRef.current.barangay,
          BigInt(submitRef.current.amount),
          submitRef.current.purpose,
          "Expense",
        ],
      });
    } catch (err) {
      console.error("Submission failed:", err);
      toast.error("Failed to submit expense. Please try again.");
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

  useEffect(() => {
    if (isConfirmed && hash && submitRef.current) {
      const data = submitRef.current;
      submitRef.current = null;

      setForm({
        amount: "",
        vendor: "",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setReceipts([]);
      setSynced(true);

      toast.success("Expense logged on blockchain!");

      syncRecord({
        type: "expense",
        user_id: currentUser?.id || "",
        blockchain_tx_hash: hash,
        contract_address: CONTRACT_ADDRESS,
        official_address: address || "",
        barangay: data.barangay,
        amount: data.amount,
        purpose: data.purpose,
      }).catch((err) => {
        console.error("Sync failed:", err);
        toast.error(
          "Recorded on-chain, but syncing to the database failed. Contact an admin.",
        );
      });
    }
  }, [isConfirmed, hash, currentUser, address, toast]);

  if (isLoading) return <LogoLoader />;

  return (
    <div className="flex min-h-screen gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser?.full_name ?? "SK Official"}
          userEmail={currentUser?.email}
          hideSearch
        />

        <PageHeader
          eyebrow="SK Officials"
          title="Expense Logger"
          subtitle="Record transactions with digital receipts, secured on the Sepolia ledger."
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* EXPENSE DETAILS */}
          <Card>
            <CardHeader
              eyebrow="Details"
              title="Transaction Details"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AMOUNT */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Amount (₱)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <PhilippinePeso className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* DATE */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Transaction Date
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* VENDOR */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Vendor/Supplier
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Building className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={(e) =>
                      handleInputChange("vendor", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Enter vendor name"
                  />
                </div>
              </div>

              {/* CATEGORY */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Category
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Tag className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className={inputClass}
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-white px-3 py-3 text-sm font-medium text-primary-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Describe the expense and purpose..."
              />
            </div>
          </Card>

          {/* RECEIPT UPLOAD */}
          <Card>
            <CardHeader eyebrow="Attachments" title="Digital Receipts" />

            {/* DRAG & DROP AREA */}
            <div
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-secondary-foreground/40"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto mb-4 h-12 w-12 text-secondary-foreground/40" />
              <p className="mb-2 text-sm font-bold text-primary-foreground">
                Drop receipt files here, or{" "}
                <label className="cursor-pointer text-primary underline hover:text-primary/80">
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
              <p className="text-xs text-secondary-foreground">
                Supports JPG, PNG, PDF • Max 10MB each
              </p>
            </div>

            {/* UPLOADED FILES */}
            {receipts.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-bold text-primary-foreground">
                  Uploaded Files ({receipts.length})
                </h3>
                {receipts.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-success/10 p-2 text-success">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary-foreground">
                          {file.name}
                        </p>
                        <p className="text-xs text-secondary-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-secondary-foreground transition-colors hover:text-danger"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isWritePending || isConfirming || !isConnected}
              className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-secondary-foreground/30"
            >
              {isWritePending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Awaiting Signature...
                </>
              ) : isConfirming ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Recording on Chain...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Log Expense
                </>
              )}
            </button>
          </div>

          {/* SUCCESS MESSAGE */}
          {synced && hash && (
            <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-bold text-success">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Expense successfully recorded on Sepolia!
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-success underline"
              >
                View Etherscan <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
