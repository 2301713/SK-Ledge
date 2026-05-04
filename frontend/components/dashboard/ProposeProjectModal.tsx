"use client";

import React, { useState } from "react"; // Removed useEffect from import
import {
  X,
  Target,
  Layers,
  Wallet,
  FileText,
  Rocket,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

interface ProposeProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function ProposeProjectModal({
  isOpen,
  onClose,
  onSubmitSuccess,
}: ProposeProjectModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = [
    "Sports & Development",
    "Education",
    "Health",
    "Environment",
    "Governance",
  ];

  // FIXED: Replaced the useEffect with a direct handleClose function
  const handleClose = () => {
    // 1. Reset all state back to default
    setName("");
    setCategory("");
    setBudget("");
    setDescription("");
    setErrors({});

    // 2. Tell the parent component to hide the modal
    onClose();
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Project name is required.";
    if (!category) newErrors.category = "Category selection required.";
    const budgetNum = parseFloat(budget);
    if (!budget || isNaN(budgetNum) || budgetNum <= 0)
      newErrors.budget = "Enter a valid amount.";
    if (description.trim().length < 20)
      newErrors.description = "Min. 20 characters required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // TODO: Replace this with your actual Supabase insert logic
      await new Promise((resolve) => setTimeout(resolve, 2000));

      onSubmitSuccess();
      handleClose(); // FIXED: Use our new handleClose to reset and hide
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-200/60 overflow-hidden animate-in zoom-in-95 duration-300">
        <header className="px-10 pt-10 pb-6 flex justify-between items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600/70">
                Submission Portal
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
              Propose Project
            </h2>
            <p className="text-slate-400 text-sm mt-1 font-medium italic">
              BMO Initiative Alignment Form
            </p>
          </div>
          <button
            onClick={handleClose} // FIXED: Switched to handleClose
            className="z-10 p-2.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all active:scale-90 border border-slate-100"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-6">
          {/* PROJECT NAME */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Official Project Name
            </label>
            <div
              className={`group relative flex items-center border transition-all duration-300 rounded-[1.25rem] ${errors.name ? "border-red-200 bg-red-50/20" : "border-slate-200 bg-slate-50/40 focus-within:ring-4 focus-within:ring-blue-600/5 focus-within:border-blue-600 focus-within:bg-white"}`}
            >
              <div className="pl-5 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                <Target size={20} strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="e.g. Community Health Hub 2026"
                className="w-full p-4 pl-3 bg-transparent outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>
            {errors.name && (
              <p className="text-[10px] text-red-500 font-bold ml-2 flex items-center gap-1 animate-in slide-in-from-left-2">
                <AlertCircle size={10} /> {errors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* CATEGORY */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Asset Category
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors z-10 pointer-events-none">
                  <Layers size={18} strokeWidth={2.5} />
                </div>
                <select
                  className={`w-full p-4 pl-12 border rounded-[1.25rem] outline-none text-sm font-bold text-slate-800 appearance-none cursor-pointer transition-all ${errors.category ? "border-red-200 bg-red-50/20" : "border-slate-200 bg-slate-50/40 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5"}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" disabled>
                    Select Segment
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-600 transition-colors">
                  <ChevronDown size={16} strokeWidth={3} />
                </div>
              </div>
              {errors.category && (
                <p className="text-[10px] text-red-500 font-bold ml-2 flex items-center gap-1 animate-in slide-in-from-left-2">
                  <AlertCircle size={10} /> {errors.category}
                </p>
              )}
            </div>

            {/* BUDGET */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Est. Budget
              </label>
              <div
                className={`group relative flex items-center border rounded-[1.25rem] transition-all duration-300 ${errors.budget ? "border-red-200 bg-red-50/20" : "border-slate-200 bg-slate-50/40 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/5"}`}
              >
                <div className="pl-5 text-slate-300 group-focus-within:text-blue-600">
                  <Wallet size={18} strokeWidth={2.5} />
                </div>
                <div className="pl-2 font-black text-xs text-blue-600/40 tracking-tighter">
                  PHP
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full p-4 pl-1 bg-transparent outline-none text-sm font-bold text-slate-800"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              {errors.budget && (
                <p className="text-[10px] text-red-500 font-bold ml-2 flex items-center gap-1 animate-in slide-in-from-left-2">
                  <AlertCircle size={10} /> {errors.budget}
                </p>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Impact & Strategic Scope
            </label>
            <div
              className={`group relative flex items-start border rounded-[1.25rem] transition-all duration-300 ${errors.description ? "border-red-200 bg-red-50/20" : "border-slate-200 bg-slate-50/40 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/5"}`}
            >
              <div className="pt-4 pl-5 text-slate-300 group-focus-within:text-blue-600">
                <FileText size={20} strokeWidth={2.5} />
              </div>
              <textarea
                placeholder="Explain objectives, KPIs, and target beneficiaries..."
                rows={4}
                className="w-full p-4 bg-transparent outline-none text-sm font-bold text-slate-800 resize-none placeholder:text-slate-300 leading-relaxed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-between px-1">
              <span
                className={`text-[9px] font-bold uppercase tracking-tight ${description.length < 20 ? "text-slate-400 opacity-60" : "text-emerald-500"}`}
              >
                {description.length < 20
                  ? "Insufficient Detail"
                  : "Ready for Review"}
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {description.length}/500
              </span>
            </div>
          </div>

          {/* 3. FOOTER / ACTIONS */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleClose} // FIXED: Switched to handleClose
              className="flex-1 py-4 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2.5] py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Rocket size={16} strokeWidth={3} />
                  Dispatch Proposal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
