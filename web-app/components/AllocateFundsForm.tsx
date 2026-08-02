"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_programName", type: "string" },
      { internalType: "string", name: "_category", type: "string" },
      { internalType: "uint256", name: "_amountPhp", type: "uint256" },
    ],
    name: "allocateFund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export default function AllocateFundsForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [programName, setProgramName] = useState("");
  const [category, setCategory] = useState("Health & Sports");
  const [amountPhp, setAmountPhp] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

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
        abi: CONTRACT_ABI,
        functionName: "allocateFund",
        args: [programName, category, BigInt(amountPhp)],
      });
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSuccess(true);
      setProgramName("");
      setAmountPhp("");
      setCurrentStep(1);
    }
  }, [isConfirmed]);

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "₱0.00";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(num);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* STEP PROGRESS HEADER */}
      <div className="bg-slate-900 p-6 text-white">
        <div className="flex items-center justify-between max-w-md mx-auto mb-6">
          {/* Step 1 Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                currentStep >= 1
                  ? "bg-blue-600 text-white ring-4 ring-blue-500/30"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              1
            </div>
            <span className="text-xs font-bold text-slate-300 hidden sm:inline">
              Project
            </span>
          </div>

          <div
            className={`flex-1 h-1 mx-3 rounded transition-all ${
              currentStep >= 2 ? "bg-blue-600" : "bg-slate-800"
            }`}
          />

          {/* Step 2 Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                currentStep >= 2
                  ? "bg-blue-600 text-white ring-4 ring-blue-500/30"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold text-slate-300 hidden sm:inline">
              Budget
            </span>
          </div>

          <div
            className={`flex-1 h-1 mx-3 rounded transition-all ${
              currentStep >= 3 ? "bg-blue-600" : "bg-slate-800"
            }`}
          />

          {/* Step 3 Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                currentStep === 3
                  ? "bg-blue-600 text-white ring-4 ring-blue-500/30"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              3
            </div>
            <span className="text-xs font-bold text-slate-300 hidden sm:inline">
              Sign & Disburse
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
            Step {currentStep} of 3
          </p>
          <h3 className="text-lg font-black tracking-tight">
            {currentStep === 1 && "Project Identification"}
            {currentStep === 2 && "Fund Amount & Allocation"}
            {currentStep === 3 && "Blockchain Ledger Sign-off"}
          </h3>
        </div>
      </div>

      {/* FORM CONTENT */}
      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit}>
          {/* STEP 1: PROJECT DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-5 max-w-xl mx-auto animate-fadeIn">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-blue-600" />
                  Program / Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Youth Leadership Summit 2026"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
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
                className="w-full mt-4 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
              >
                Next: Enter Amount <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: BUDGET AMOUNT */}
          {currentStep === 2 && (
            <div className="space-y-5 max-w-xl mx-auto animate-fadeIn">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-blue-600" />
                  Allocated Amount (in PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">
                    ₱
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="25000"
                    value={amountPhp}
                    onChange={(e) => setAmountPhp(e.target.value)}
                    className="w-full pl-9 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-2xl font-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Formatted preview:{" "}
                  <strong className="text-slate-700 font-bold">
                    {formatCurrency(amountPhp)}
                  </strong>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-1/3 py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-2/3 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
                >
                  Review Allocation <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FINAL REVIEW & BLOCKCHAIN SIGN */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-xl mx-auto animate-fadeIn">
              {/* Summary Voucher Card */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-blue-600" /> Allocation Summary
                  </span>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    READY FOR SIGNATURE
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Program:</span>
                    <span className="font-bold text-slate-900">{programName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-bold text-slate-700">{category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Amount:</span>
                    <span className="font-black text-blue-600 text-lg">
                      {formatCurrency(amountPhp)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-500">Signing Wallet:</span>
                    <span className="font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
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
                  className="w-1/3 py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Edit
                </button>

                <button
                  type="submit"
                  disabled={isWritePending || isConfirming || !isConnected}
                  className={`w-2/3 py-4 px-6 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isWrongNetwork
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : isWritePending || isConfirming
                        ? "bg-slate-400 text-white cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25"
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
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Budget allocation successfully recorded on Sepolia!
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="underline flex items-center gap-1 text-emerald-700"
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