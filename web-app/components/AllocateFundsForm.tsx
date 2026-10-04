"use client";

import { Fragment, useState, useEffect } from "react";
import {
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
} from "lucide-react";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { useAuthStore } from "@/lib/useAuthStore";
import { useToast } from "@/lib/useToast";
import { syncRecord } from "@/lib/syncRecord";

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

export default function AllocateFundsForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [programName, setProgramName] = useState("");
  const [barangay, setBarangay] = useState("");
  const [category, setCategory] = useState("Health & Sports");
  const [amountPhp, setAmountPhp] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { currentUser } = useAuthStore();
  const toast = useToast();

  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const isWrongNetwork = chainId !== sepolia.id;

  const handleNext = () => {
    if (currentStep === 1 && !programName) {
      alert("Please enter a Program Title");
      return;
    }
    if (currentStep === 1 && !barangay) {
      alert("Please enter a Barangay name");
      return;
    }
    if (currentStep === 2 && (!amountPhp || Number(amountPhp) <= 0)) {
      alert("Please enter a valid amount");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(false);

    if (isWrongNetwork) {
      switchChain({ chainId: sepolia.id });
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: SK_LEDGE_ABI,
        functionName: "addRecord",
        args: [barangay || "General", BigInt(Math.round(Number(amountPhp) * 100)), programName, "Allocation"],
      });
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  useEffect(() => {
    if (isConfirmed && hash) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSuccess(true);
      setProgramName("");
      setBarangay("");
      setAmountPhp("");
      setCurrentStep(1);

      // Sync to Supabase via API
      syncRecord({
        type: "allocation",
        user_id: currentUser?.id || "",
        blockchain_tx_hash: hash,
        contract_address: CONTRACT_ADDRESS,
        official_address: address || "",
        barangay: barangay || "General",
        amount: Math.round(Number(amountPhp) * 100),
        purpose: programName,
      }).catch((err) => {
        console.error("Sync failed:", err);
        toast.error("Recorded on-chain, but syncing to the database failed.");
      });
    }
  }, [isConfirmed, hash, currentUser, address, barangay, amountPhp, programName, toast]);

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
                  onChange={(e) => setProgramName(e.target.value)}
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
                  required
                  placeholder="e.g., Barangay San Jose"
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-border rounded-2xl text-primary-foreground text-sm font-semibold placeholder:text-secondary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-secondary-foreground mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-border rounded-2xl text-primary-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="Health & Sports">Health & Sports</option>
                  <option value="Education & Training">Education & Training</option>
                  <option value="Environmental Protection">Environmental Protection</option>
                  <option value="Youth Empowerment">Youth Empowerment</option>
                  <option value="Disaster Relief">Disaster Relief</option>
                  <option value="Administrative">Administrative</option>
                </select>
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
                    onChange={(e) => setAmountPhp(e.target.value)}
                    className="w-full pl-9 pr-4 py-4 bg-white border border-border rounded-2xl text-primary-foreground text-2xl font-black placeholder:text-secondary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <p className="text-xs text-secondary-foreground mt-2">
                  Formatted preview:{" "}
                  <strong className="text-primary-foreground font-bold">
                    {formatCurrency(amountPhp)}
                  </strong>
                </p>
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