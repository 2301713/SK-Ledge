"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  FolderPlus,
  Layers,
  Coins,
  Wallet,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  Sparkles,
  ExternalLink,
  MapPin,
  Check,
  AlertTriangle,
} from "lucide-react";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { useToast } from "@/lib/useToast";
import { syncRecord } from "@/lib/syncRecord";
import { describeWalletError } from "@/lib/walletErrors";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";
import Select from "@/components/ui/Select";
import AmountPreview from "@/components/AmountPreview";
import { describePesoInput } from "@/lib/money";

const STEPS = [
  { n: 1, label: "Project" },
  { n: 2, label: "Budget" },
  { n: 3, label: "Sign & Disburse" },
];

const STEP_TITLES: Record<number, string> = {
  1: "Project Identification",
  2: "Fund Amount & Allocation",
  3: "Blockchain Ledger Sign-off",
};

const formatCentavos = (centavos: number | bigint) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(centavos) / 100);

export default function AllocateFundsForm({
  assignedBarangay,
}: {
  assignedBarangay: string | null;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [programName, setProgramName] = useState("");
  const [category, setCategory] = useState("Health & Sports");
  const [amountPhp, setAmountPhp] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState("");
  const barangay = assignedBarangay
    ? canonicalizeBarangay(assignedBarangay)
    : null;

  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const toast = useToast();

  const pendingSubmissionRef = useRef<{
    barangay: string;
    amountCentavos: number;
    purpose: string;
    officialAddress: string;
  } | null>(null);

  const {
    data: hash,
    error: writeError,
    isPending: isWritePending,
    writeContract,
    reset: resetWriteContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const { data: ceilingRaw, refetch: refetchCeiling } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "allocationCeilings",
    args: barangay ? [barangay] : undefined,
    query: { enabled: Boolean(barangay) },
  });

  const { data: allocatedRaw, refetch: refetchAllocated } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "getAllocated",
    args: barangay ? [barangay] : undefined,
    query: { enabled: Boolean(barangay) },
  });

  const ceilingKnown = ceilingRaw !== undefined && allocatedRaw !== undefined;
  const ceilingCentavos = ceilingRaw ?? BigInt(0);
  const allocatedCentavos = allocatedRaw ?? BigInt(0);
  // A zero ceiling means the contract does not cap this barangay.
  const hasCeiling = ceilingCentavos > BigInt(0);
  const remainingCentavos =
    ceilingCentavos > allocatedCentavos
      ? ceilingCentavos - allocatedCentavos
      : BigInt(0);

  const ceilingViolation = (amountCentavos: number): string | null => {
    if (!ceilingKnown || !hasCeiling) return null;
    if (BigInt(amountCentavos) <= remainingCentavos) return null;

    return `This allocation of ${formatCentavos(amountCentavos)} exceeds the remaining ceiling of ${formatCentavos(remainingCentavos)} for ${barangay}. The ceiling is ${formatCentavos(ceilingCentavos)} and ${formatCentavos(allocatedCentavos)} is already allocated. Lower the amount or raise the ceiling first.`;
  };

  const reviewAmountCentavos = Math.round(Number(amountPhp) * 100);
  const headroomAfterCentavos =
    Number(remainingCentavos) - reviewAmountCentavos;

  const isWrongNetwork = chainId !== sepolia.id;

  const handleNext = () => {
    setFormError("");

    if (currentStep === 1 && !programName.trim()) {
      setFormError("Enter a program or project title to continue.");
      return;
    }
    if (currentStep === 1) {
      // Match the contract's MAX_PURPOSE_BYTES limit before signing.
      const purposeByteLength = new TextEncoder().encode(
        programName.trim(),
      ).length;
      if (purposeByteLength > 256) {
        setFormError(
          `Program title is too long (${purposeByteLength}/256 bytes). Please shorten it.`,
        );
        return;
      }
    }
    if (currentStep === 1 && !barangay) {
      setFormError(
        "Your profile has no valid barangay assigned, so funds cannot be allocated. Ask an admin to assign your barangay first.",
      );
      return;
    }
    if (currentStep === 2) {
      const amount = Number(amountPhp);
      if (!amountPhp || !Number.isFinite(amount) || amount <= 0) {
        setFormError("Enter an allocation amount greater than zero.");
        return;
      }

      const violation = ceilingViolation(Math.round(amount * 100));
      if (violation) {
        setFormError(violation);
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setFormError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(false);
    resetWriteContract();

    // Enter in an earlier step should advance the wizard, not sign a transaction.
    if (currentStep !== 3) {
      handleNext();
      return;
    }

    setFormError("");

    if (isWrongNetwork) {
      switchChain({ chainId: sepolia.id });
      return;
    }

    if (!barangay) {
      setFormError(
        "Your profile has no valid barangay assigned, so funds cannot be allocated. Ask an admin to assign your barangay first.",
      );
      return;
    }

    const purpose = programName.trim();
    if (!purpose) {
      setFormError("Enter a program or project title before allocating funds.");
      return;
    }

    const amountCentavos = Math.round(Number(amountPhp) * 100);
    if (!Number.isFinite(amountCentavos) || amountCentavos <= 0) {
      setFormError("Enter an allocation amount greater than zero.");
      return;
    }

    // Re-check at signing time: the ceiling may have changed since review.
    const violation = ceilingViolation(amountCentavos);
    if (violation) {
      setFormError(violation);
      setCurrentStep(2);
      return;
    }

    try {
      // Capture the submitted values: the form is cleared once the transaction
      // confirms, so the sync effect must not read live state.
      pendingSubmissionRef.current = {
        barangay,
        amountCentavos,
        purpose,
        officialAddress: address ?? "",
      };

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: SK_LEDGE_ABI,
        functionName: "addRecord",
        args: [barangay, BigInt(amountCentavos), purpose, "Allocation"],
      });
    } catch (err) {
      pendingSubmissionRef.current = null;
      console.error("Submission error:", err);
      toast.error("Failed to submit the allocation. Please try again.");
    }
  };

  useEffect(() => {
    const submission = pendingSubmissionRef.current;
    if (isConfirmed && hash && submission) {
      pendingSubmissionRef.current = null;
      setIsSuccess(true);
      setProgramName("");
      setAmountPhp("");
      setCurrentStep(1);

      // The new allocation changes the remaining ceiling immediately.
      void refetchCeiling();
      void refetchAllocated();

      // Sync to Supabase via API
      syncRecord({
        type: "allocation",
        blockchain_tx_hash: hash,
        contract_address: CONTRACT_ADDRESS,
        official_address: submission.officialAddress,
        barangay: submission.barangay,
        amount: submission.amountCentavos,
        purpose: submission.purpose,
      })
        .then(() => {
          toast.success("Allocation recorded on-chain and synced to the ledger.");
        })
        .catch((err) => {
          console.error("Sync failed:", err);
          toast.error("Recorded on-chain, but syncing to the database failed.");
        });
    }
  }, [isConfirmed, hash, toast, refetchCeiling, refetchAllocated]);

  const describedAmount = describePesoInput(amountPhp);
  const amountDescription = describedAmount.ok ? describedAmount.text : "";

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "₱0.00";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(num);
  };

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)]">
      {/* STEP PROGRESS HEADER */}
      <div className="border-b border-border bg-secondary/40 px-6 py-5 md:px-8">
        <div className="flex items-center gap-3">
          {STEPS.map((step, i) => (
            <Fragment key={step.n}>
              {i > 0 && (
                <div
                  className={`h-1 flex-1 rounded ${
                    currentStep >= step.n ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all ${
                    currentStep === step.n
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : currentStep > step.n
                        ? "bg-success text-white"
                        : "border border-border bg-white text-secondary-foreground"
                  }`}
                >
                  {currentStep > step.n ? <Check className="h-4 w-4" /> : step.n}
                </div>
                <span className="hidden text-xs font-bold text-primary-foreground sm:inline">
                  {step.label}
                </span>
              </div>
            </Fragment>
          ))}
        </div>

        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-foreground">
          Step {currentStep} of 3 · {STEP_TITLES[currentStep]}
        </p>
      </div>

      {/* FORM CONTENT */}
      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit}>
          {formError && (
            <div
              role="alert"
              className="mx-auto mb-5 flex max-w-xl items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-medium text-danger animate-fadein"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{formError}</span>
            </div>
          )}

          {/* STEP 1: PROJECT DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-5 max-w-xl mx-auto animate-fadein">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-secondary-foreground mb-2 flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-primary" />
                  Program / Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Youth Leadership Summit 2026"
                  value={programName}
                  onChange={(e) => {
                    setProgramName(e.target.value);
                    setFormError("");
                  }}
                  className="w-full px-4 py-3.5 bg-white border border-border rounded-2xl text-primary-foreground text-sm font-semibold placeholder:text-secondary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-secondary-foreground mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Barangay
                </label>
                <input
                  type="text"
                  value={barangay ?? ""}
                  readOnly
                  placeholder="Set a valid barangay in your profile"
                  className="w-full px-4 py-3.5 bg-secondary/50 border border-border rounded-2xl text-primary-foreground text-sm font-semibold placeholder:text-secondary-foreground/60"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-secondary-foreground mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Category
                </label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Health & Sports">Health & Sports</option>
                  <option value="Education & Training">Education & Training</option>
                  <option value="Environmental Protection">Environmental Protection</option>
                  <option value="Youth Empowerment">Youth Empowerment</option>
                  <option value="Disaster Relief">Disaster Relief</option>
                  <option value="Administrative">Administrative</option>
                </Select>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full mt-4 py-4 px-6 bg-primary hover:bg-primary/90 text-white font-black text-sm rounded-2xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                Next: Enter Amount <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: BUDGET AMOUNT */}
          {currentStep === 2 && (
            <div className="space-y-5 max-w-xl mx-auto animate-fadein">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-secondary-foreground mb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" />
                  Allocated Amount (in PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-secondary-foreground/50 text-lg">
                    ₱
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="25000"
                    value={amountPhp}
                    onChange={(e) => {
                      setAmountPhp(e.target.value);
                      setFormError("");
                    }}
                    className="w-full pl-9 pr-4 py-4 bg-white border border-border rounded-2xl text-primary-foreground text-2xl font-black placeholder:text-secondary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <AmountPreview value={amountPhp} />
                {ceilingKnown && hasCeiling && (
                  <p className="mt-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs text-secondary-foreground">
                    Remaining ceiling for {barangay}:{" "}
                    <strong className="font-bold text-primary-foreground">
                      {formatCentavos(remainingCentavos)}
                    </strong>{" "}
                    of {formatCentavos(ceilingCentavos)} (
                    {formatCentavos(allocatedCentavos)} already allocated)
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-1/3 py-4 px-4 bg-secondary hover:bg-secondary-foreground/10 text-primary-foreground font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-2/3 py-4 px-6 bg-primary hover:bg-primary/90 text-white font-black text-sm rounded-2xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                  Review Allocation <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FINAL REVIEW & BLOCKCHAIN SIGN */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-xl mx-auto animate-fadein">
              {/* Summary Voucher Card */}
              <div className="bg-secondary/40 rounded-2xl p-6 border border-border space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-xs font-black uppercase text-secondary-foreground flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-primary" /> Allocation Summary
                  </span>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-success/10 text-success">
                    READY FOR SIGNATURE
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">Program:</span>
                    <span className="font-bold text-primary-foreground">{programName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">Barangay:</span>
                    <span className="font-bold text-primary-foreground">{barangay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-foreground">Category:</span>
                    <span className="font-bold text-primary-foreground">{category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-foreground">Amount:</span>
                    <span className="font-black text-primary text-lg">
                      {formatCurrency(amountPhp)}
                    </span>
                  </div>
                  <p className="text-right text-[11px] leading-snug text-secondary-foreground">
                    {amountDescription}
                  </p>
                  {ceilingKnown && hasCeiling && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-secondary-foreground">
                          Ceiling:
                        </span>
                        <span className="font-bold text-primary-foreground">
                          {formatCentavos(ceilingCentavos)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-foreground">
                          Headroom after this allocation:
                        </span>
                        <span
                          className={`font-bold ${
                            headroomAfterCentavos < 0
                              ? "text-danger"
                              : "text-primary-foreground"
                          }`}
                        >
                          {formatCentavos(headroomAfterCentavos)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border text-xs">
                    <span className="text-secondary-foreground">Signing Wallet:</span>
                    <span className="font-mono text-primary-foreground bg-white px-2 py-1 rounded border border-border">
                      {isConnected
                        ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
                        : "Not Connected"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isWritePending || isConfirming}
                  className="w-1/3 py-4 px-4 bg-secondary hover:bg-secondary-foreground/10 text-primary-foreground font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Edit
                </button>

                <button
                  type="submit"
                  disabled={isWritePending || isConfirming || !isConnected}
                  className={`w-2/3 py-4 px-6 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isWrongNetwork
                      ? "bg-pending hover:bg-pending/90 text-white"
                      : isWritePending || isConfirming
                        ? "bg-secondary-foreground/30 text-white cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90 text-white shadow-primary/25"
                  }`}
                >
                  {isWritePending && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Signing...
                    </>
                  )}
                  {isConfirming && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Recording...
                    </>
                  )}
                  {!isWritePending && !isConfirming && isWrongNetwork && (
                    <>
                      <Wallet className="w-5 h-5" /> Switch Network
                    </>
                  )}
                  {!isWritePending && !isConfirming && !isWrongNetwork && (
                    <>
                      <Sparkles className="w-5 h-5" /> Execute & Sign
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TRANSACTION ERROR */}
          {writeError && (
            <div className="mt-6 flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs font-medium text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">
                {describeWalletError(
                  writeError,
                  "The allocation transaction failed. Please try again.",
                )}
              </span>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {isSuccess && hash && (
            <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-2xl flex items-center justify-between text-xs font-bold text-success">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                Budget allocation successfully recorded on Sepolia!
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="underline flex items-center gap-1 text-success"
              >
                View Etherscan <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}