"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { useToast } from "@/lib/useToast";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  usePublicClient,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { syncRecord } from "@/lib/syncRecord";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";
import { sumBarangayCentavos } from "@/lib/spending";
import {
  RECEIPT_MAX_FILES,
  buildReceiptUrl,
  validateReceiptFile,
} from "@/lib/receipts";
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
  AlertTriangle,
} from "lucide-react";

interface ExpenseForm {
  amount: string;
  vendor: string;
  category: string;
  projectId: string;
  description: string;
  date: string;
}

interface AbiypProjectOption {
  id: number;
  name: string;
  category: string;
  fiscal_year: number;
  status: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface StoredReceipt {
  id: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  url: string;
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

const formatPesoFromCentavos = (centavos: number | bigint) =>
  `₱${(Number(centavos) / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// The live contract only supports this after the receipt-hash redeploy.
const ONCHAIN_RECEIPT_HASH_ENABLED =
  process.env.NEXT_PUBLIC_ONCHAIN_RECEIPT_HASH_ENABLED === "true";

export default function ExpensesPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  const { isConnected, address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const {
    data: hash,
    error: writeError,
    isPending: isWritePending,
    writeContract,
    reset: resetWriteContract,
  } = useWriteContract();
  const { writeContractAsync: attachHashAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const canonicalBarangay = currentUser?.barangay
    ? canonicalizeBarangay(currentUser.barangay)
    : null;

  const { data: isAuthorizedOfficial } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "isAuthorizedOfficial",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: isAuthorizedForBarangay } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "isOfficialAuthorizedForBarangay",
    args: address && canonicalBarangay ? [address, canonicalBarangay] : undefined,
    query: { enabled: Boolean(address && canonicalBarangay) },
  });

  const walletMatchesProfile = Boolean(
    address &&
      currentUser?.wallet_address &&
      address.toLowerCase() === currentUser.wallet_address.toLowerCase(),
  );

  const walletIssue = (() => {
    if (!isConnected || !address) {
      return "Connect the wallet bound to your profile before logging an expense.";
    }
    if (chainId !== sepolia.id) {
      return "Switch MetaMask to the Sepolia network before logging an expense.";
    }
    if (!currentUser?.wallet_address) {
      return "No blockchain wallet is bound to your profile. Bind one on the Account page first.";
    }
    if (!walletMatchesProfile) {
      return `The connected wallet ${address} is not the wallet bound to your profile (${currentUser.wallet_address}). Switch accounts in MetaMask.`;
    }
    if (isAuthorizedOfficial === false) {
      return "This wallet has not been authorized as an SK Official by the contract owner. Ask the administrator to authorize it.";
    }
    if (isAuthorizedForBarangay === false) {
      return `This wallet is not authorized for ${canonicalBarangay} by the contract owner. Ask the administrator to grant barangay access.`;
    }
    return null;
  })();

  const writeErrorMessage = writeError
    ? /user rejected/i.test(writeError.message)
      ? "You rejected the transaction in MetaMask."
      : /not an authorized SK Official/i.test(writeError.message)
        ? "MetaMask is using a wallet that is not authorized as an SK Official. Switch to your bound wallet."
        : /not authorized for this barangay/i.test(writeError.message)
          ? `MetaMask is using a wallet that is not authorized for ${canonicalBarangay}. Switch to your bound wallet.`
          : writeError.message.split("\n")[0]
    : null;

  const { data: ceilingRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "allocationCeilings",
    args: canonicalBarangay ? [canonicalBarangay] : undefined,
    query: { enabled: Boolean(canonicalBarangay) },
  });

  const { data: ledgerRecords, refetch: refetchLedgerRecords } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: "getAllRecords",
      query: { enabled: Boolean(canonicalBarangay) },
    });

  // The contract caps allocation records only, so spending against the ceiling
  // is derived from the ledger's non-voided expense records for this barangay.
  const spentCentavos = useMemo<number | null>(() => {
    if (!canonicalBarangay || !ledgerRecords) return null;

    return sumBarangayCentavos(
      ledgerRecords.map((record) => ({
        type: record.recordType,
        barangay: record.barangay,
        amount: record.amount,
        voided: record.voided,
      })),
      "expense",
      canonicalBarangay,
    );
  }, [canonicalBarangay, ledgerRecords]);

  const ceilingCentavos = Number(ceilingRaw ?? BigInt(0));
  // A zero ceiling means the contract does not cap this barangay.
  const hasCeiling = ceilingCentavos > 0;
  const remainingCeilingCentavos =
    spentCentavos === null
      ? null
      : Math.max(ceilingCentavos - spentCentavos, 0);

  const [form, setForm] = useState<ExpenseForm>({
    amount: "",
    vendor: "",
    category: "",
    projectId: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [projects, setProjects] = useState<AbiypProjectOption[]>([]);

  const [receipts, setReceipts] = useState<UploadedFile[]>([]);
  const [storedReceipts, setStoredReceipts] = useState<StoredReceipt[]>([]);
  const [isFilingReceipts, setIsFilingReceipts] = useState(false);
  const pendingReceiptsRef = useRef<UploadedFile[]>([]);
  // Held in refs so the receipt-filing effect does not re-run (and re-upload)
  // when wagmi hands back a new client instance.
  const publicClientRef = useRef(publicClient);
  const attachHashRef = useRef(attachHashAsync);

  useEffect(() => {
    publicClientRef.current = publicClient;
    attachHashRef.current = attachHashAsync;
  }, [publicClient, attachHashAsync]);
  const [dragActive, setDragActive] = useState(false);
  const submitRef = useRef<{
    barangay: string;
    amount: number;
    purpose: string;
    category: string;
    projectId: string | null;
  } | null>(null);

  const pendingExpenseCentavos = Number.isFinite(parseFloat(form.amount))
    ? Math.round(parseFloat(form.amount) * 100)
    : 0;
  const ceilingExceeded =
    hasCeiling &&
    spentCentavos !== null &&
    pendingExpenseCentavos > 0 &&
    pendingExpenseCentavos + spentCentavos > ceilingCentavos;
  const ceilingBlockMessage = ceilingExceeded
    ? `This expense of ${formatPesoFromCentavos(
        pendingExpenseCentavos,
      )} would bring ${canonicalBarangay}'s spending to ${formatPesoFromCentavos(
        (spentCentavos ?? 0) + Math.max(pendingExpenseCentavos, 0),
      )}, above its ${formatPesoFromCentavos(
        ceilingCentavos,
      )} allocation ceiling. Lower the amount or raise the ceiling before logging it.`
    : "";

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
            "id, username, role_type, full_name, barangay, email, approval_status, wallet_address",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          return;
        }

        if (profileData) {
          // Logging expenses is an SK Treasurer responsibility.
          if (profileData.role_type !== "SK_Treasurer") {
            console.warn(
              "Unauthorized access: only the SK Treasurer can log expenses.",
            );
            router.push("/unauthorized");
            return;
          }

          if (profileData.approval_status !== "approved") {
            toast.error(
              "Your account must be approved before logging blockchain expenses.",
            );
            router.push("/unauthorized");
            return;
          }

          const canonicalBarangay = canonicalizeBarangay(
            profileData.barangay ?? "",
          );
          if (!canonicalBarangay) {
            toast.error(
              "Your profile must have a valid canonical barangay before logging expenses.",
            );
            router.push("/unauthorized");
            return;
          }

          const profile = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: canonicalBarangay,
            email: profileData.email,
            approval_status: profileData.approval_status,
            wallet_address: profileData.wallet_address || null,
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
  }, [router, toast]);

  // Expenses can be tied to a specific ABYIP project for the fiscal year, which
  // is what makes the ABYIP breakdown project-level instead of category-only.
  useEffect(() => {
    if (!currentUser) return;

    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, category, fiscal_year, status")
        .eq("barangay", currentUser.barangay)
        .eq("fiscal_year", new Date().getFullYear())
        .order("name");

      if (!active) return;
      if (error) {
        console.error("Error fetching ABYIP projects:", error.message);
        return;
      }

      setProjects((data ?? []) as AbiypProjectOption[]);
    })();

    return () => {
      active = false;
    };
  }, [currentUser]);

  const handleInputChange = (field: keyof ExpenseForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProjectChange = (value: string) => {
    const project = projects.find((candidate) => String(candidate.id) === value);
    setForm((prev) => ({
      ...prev,
      projectId: value,
      category: project?.category || prev.category,
    }));
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const incoming = Array.from(files);
    const errors: string[] = [];

    if (receipts.length + incoming.length > RECEIPT_MAX_FILES) {
      errors.push(`You can attach up to ${RECEIPT_MAX_FILES} receipts.`);
    }

    const newFiles: UploadedFile[] = [];
    for (const file of incoming.slice(0, RECEIPT_MAX_FILES - receipts.length)) {
      const error = validateReceiptFile(file);
      if (error) {
        errors.push(error);
        continue;
      }

      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      });
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    if (newFiles.length > 0) {
      setReceipts((prev) =>
        [...prev, ...newFiles].slice(0, RECEIPT_MAX_FILES),
      );
    }
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

    const barangay = canonicalizeBarangay(currentUser?.barangay ?? "");
    if (!barangay) {
      toast.error(
        "Your profile must have a valid canonical barangay before logging expenses.",
      );
      return;
    }

    if (ceilingExceeded) {
      toast.error(
        "This expense would push spending past the barangay's allocation ceiling.",
      );
      return;
    }

    resetWriteContract();

    try {
      pendingReceiptsRef.current = [...receipts];
      setStoredReceipts([]);
      submitRef.current = {
        barangay,
        amount: Math.round(parseFloat(form.amount) * 100),
        purpose: `${form.description} — Vendor: ${form.vendor}`,
        category: form.category,
        projectId: form.projectId || null,
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
    if (!isConfirmed || !hash || !submitRef.current) return;

    const data = submitRef.current;
    const files = pendingReceiptsRef.current;
    submitRef.current = null;
    pendingReceiptsRef.current = [];

    setForm({
      amount: "",
      vendor: "",
      category: "",
      projectId: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setReceipts([]);
    setSynced(true);
    void refetchLedgerRecords();

    toast.success("Expense logged on blockchain!");

    void (async () => {
      let expenseId: string | undefined;
      let recordId: number | undefined;

      try {
        const response = (await syncRecord({
          type: "expense",
          blockchain_tx_hash: hash,
          contract_address: CONTRACT_ADDRESS,
          official_address: address || "",
          barangay: data.barangay,
          amount: data.amount,
          purpose: data.purpose,
          category: data.category,
          ...(data.projectId ? { project_id: data.projectId } : {}),
        })) as unknown as {
          data?: { id?: string; blockchain_record_id?: number };
        };

        expenseId = response?.data?.id;
        recordId = response?.data?.blockchain_record_id;
      } catch (err) {
        console.error("Sync failed:", err);
        toast.error(
          "Recorded on-chain, but syncing to the database failed. Contact an admin.",
        );
      }

      if (files.length === 0) return;

      setIsFilingReceipts(true);
      const stored: StoredReceipt[] = [];
      let failed = 0;

      for (const file of files) {
        const body = new FormData();
        body.append("file", file.file);
        body.append("record_type", "expense");
        body.append("blockchain_tx_hash", hash);
        body.append("contract_address", CONTRACT_ADDRESS);

        if (expenseId) body.append("expense_id", expenseId);
        if (recordId) body.append("blockchain_record_id", String(recordId));

        try {
          const response = await fetch("/api/documents", {
            method: "POST",
            body,
          });
          const payload = (await response.json()) as {
            data?: {
              id: string;
              fileName: string;
              sizeBytes: number;
              sha256: string;
            };
            error?: string;
          };

          if (!response.ok || !payload.data) {
            throw new Error(payload.error || "Receipt upload failed.");
          }

          stored.push({
            ...payload.data,
            url: buildReceiptUrl(payload.data.id),
          });
        } catch (err) {
          failed += 1;
          console.error("Receipt upload failed:", err);
        }
      }

      if (ONCHAIN_RECEIPT_HASH_ENABLED && stored.length > 0) {
        const client = publicClientRef.current;

        if (!recordId || !client) {
          toast.warning(
            "Receipts were filed, but the on-chain fingerprint could not be attached because the ledger record id is unavailable.",
          );
        } else {
          let hashFailures = 0;

          for (const receipt of stored) {
            try {
              const attachTx = await attachHashRef.current({
                address: CONTRACT_ADDRESS,
                abi: SK_LEDGE_ABI,
                functionName: "attachDocumentHash",
                args: [
                  BigInt(recordId),
                  `0x${receipt.sha256}` as `0x${string}`,
                ],
              });
              await client.waitForTransactionReceipt({ hash: attachTx });
            } catch (err) {
              hashFailures += 1;
              console.error("Failed to attach receipt fingerprint on-chain:", err);
            }
          }

          if (hashFailures > 0) {
            toast.error(
              `${hashFailures} of ${stored.length} receipt fingerprint(s) could not be recorded on-chain.`,
            );
          } else {
            toast.success(
              `${stored.length} receipt fingerprint${stored.length === 1 ? "" : "s"} recorded on-chain.`,
            );
          }
        }
      }

      setIsFilingReceipts(false);
      setStoredReceipts(stored);

      if (failed > 0) {
        toast.error(
          `${failed} of ${files.length} receipts could not be filed. The expense is still on-chain.`,
        );
      } else {
        toast.success(
          `${stored.length} receipt${stored.length === 1 ? "" : "s"} filed with SHA-256 fingerprints.`,
        );
      }
    })();
  }, [isConfirmed, hash, currentUser, address, toast, refetchLedgerRecords]);

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

        {walletIssue && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs font-medium text-danger"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{walletIssue}</span>
          </div>
        )}

        {writeErrorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs font-medium text-danger"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{writeErrorMessage}</span>
          </div>
        )}

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

              {/* ABYIP PROJECT LINK */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  ABYIP Project (optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Tag className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <select
                    value={form.projectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Not linked to a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={String(project.id)}>
                        {project.name} ({project.fiscal_year})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-secondary-foreground">
                  Linking an expense to a project attributes its amount to that
                  project in the ABYIP breakdown for the fiscal year.
                </p>
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

          {/* CEILING GUARD */}
          {hasCeiling && remainingCeilingCentavos !== null && (
            <div className="space-y-3">
              <p className="text-right text-xs font-medium text-secondary-foreground">
                Ceiling {formatPesoFromCentavos(ceilingCentavos)} · Spent{" "}
                {formatPesoFromCentavos(spentCentavos ?? BigInt(0))} · Remaining{" "}
                {formatPesoFromCentavos(remainingCeilingCentavos)}
              </p>

              {ceilingExceeded && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs font-medium text-danger"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="break-words">{ceilingBlockMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                isWritePending ||
                isConfirming ||
                Boolean(walletIssue) ||
                ceilingExceeded
              }
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

          {/* FILED RECEIPTS */}
          {(isFilingReceipts || storedReceipts.length > 0) && (
            <Card>
              <CardHeader eyebrow="Audit trail" title="Filed Receipts" />
              {isFilingReceipts ? (
                <p className="flex items-center gap-2 text-sm font-bold text-secondary-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading receipts and computing SHA-256 fingerprints...
                </p>
              ) : (
                <div className="space-y-3">
                  {storedReceipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/40 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-primary-foreground">
                          {receipt.fileName}
                        </p>
                        <p className="truncate font-mono text-[10px] text-secondary-foreground">
                          SHA-256: {receipt.sha256}
                        </p>
                      </div>
                      <a
                        href={receipt.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-xs font-bold text-primary underline"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

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
