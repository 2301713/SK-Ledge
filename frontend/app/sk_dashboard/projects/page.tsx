"use client";

import { useState } from "react";
import SideBar from "@/components/SideBar";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  Project,
  ProjectStatus,
  PROJECT_CATEGORIES,
  INITIAL_PROJECTS,
} from "@/lib/dummyData";

// HELPERS
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount,
  );

const statusStyles: Record<ProjectStatus, string> = {
  Approved: "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]",
  Pending: "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]",
  Rejected: "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]",
};

const statusAccent: Record<ProjectStatus, string> = {
  Approved: "bg-[#2e7d32]",
  Pending: "bg-[#f57f17]",
  Rejected: "bg-[#c62828]",
};

export default function ProjectsPage() {
  // STATE
  const { currentUser, isLoading } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    budget?: string;
  }>({});

  // VARIABLES
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const approvedCount = projects.filter((p) => p.status === "Approved").length;
  const pendingCount = projects.filter((p) => p.status === "Pending").length;

  // HANDLERS
  const handleSubmit = () => {
    const newErrors: typeof errors = {};
    if (!formName.trim()) newErrors.name = "Project name is required.";
    if (!formCategory) newErrors.category = "Please select a category.";
    const budgetNum = parseFloat(formBudget.replace(/,/g, ""));
    if (!formBudget.trim() || isNaN(budgetNum) || budgetNum <= 0)
      newErrors.budget = "Enter a valid budget amount.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newProject: Project = {
      id: String(projects.length + 1),
      name: formName.trim(),
      category: formCategory,
      status: "Pending",
      budget: budgetNum,
      proposedBy: currentUser?.name || "Unknown User",
      dateProposed: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    setProjects([newProject, ...projects]);
    setFormName("");
    setFormCategory("");
    setFormBudget("");
    setErrors({});
    setShowForm(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 4000);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormName("");
    setFormCategory("");
    setFormBudget("");
    setErrors({});
  };

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center text-tertiary font-black text-3xl shadow-lg shadow-primary/20 mb-6 animate-pulse">
          B
        </div>
        <p className="text-[11px] font-bold text-secondary-foreground uppercase tracking-widest animate-pulse">
          Loading Projects...
        </p>
      </div>
    );
  }

  // ERROR / UNAUTHORIZED STATE
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-primary/5 border border-border p-8 text-center">
          <div className="h-12 w-12 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-danger text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-extrabold text-primary mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary-foreground mb-6">
            You do not have the required credentials to view projects.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // MAIN RENDER
  return (
    <div className="flex min-h-screen bg-background font-sans selection:bg-tertiary selection:text-primary">
      <SideBar
        userName={currentUser.name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-160 h-160 bg-tertiary/5 rounded-full blur-3xl pointer-events-none z-0"></div>

        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight flex items-center gap-2">
              <span className="text-tertiary text-2xl">•</span>
              Projects
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mt-0.5">
              Manage & Propose SK Projects
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Propose Project
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {successMsg && (
              <div className="flex items-center gap-3 bg-[#e8f5e9] border border-[#a5d6a7] text-[#2e7d32] px-5 py-3.5 rounded-xl text-sm font-semibold">
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Project proposal submitted successfully — now pending for
                review.
              </div>
            )}

            {showForm && (
              <section className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex items-center justify-between">
                  <h2 className="text-base font-bold text-primary">
                    Propose a New Project
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-secondary-foreground hover:text-primary transition-colors"
                    aria-label="Close form"
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1.5">
                      Project Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Livelihood Training Program"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        setErrors((p) => ({ ...p, name: undefined }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm text-primary-foreground placeholder-secondary-foreground/50 focus:outline-none focus:ring-2 transition-all ${
                        errors.name
                          ? "border-danger/50 focus:ring-danger/20 bg-danger/5"
                          : "border-border focus:ring-primary/20 focus:border-primary bg-white"
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-[11px] font-semibold text-danger flex items-center gap-1">
                        <svg
                          width="12"
                          height="12"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1.5">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          setFormCategory(e.target.value);
                          setErrors((p) => ({ ...p, category: undefined }));
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                          errors.category
                            ? "border-danger/50 focus:ring-danger/20 bg-danger/5 text-danger"
                            : formCategory
                              ? "border-border focus:ring-primary/20 focus:border-primary bg-white text-primary-foreground"
                              : "border-border focus:ring-primary/20 focus:border-primary bg-white text-secondary-foreground"
                        }`}
                      >
                        <option value="" disabled>
                          Select category...
                        </option>
                        {PROJECT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-[11px] font-semibold text-danger flex items-center gap-1">
                          <svg
                            width="12"
                            height="12"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.category}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1.5">
                        Budget (PHP) <span className="text-danger">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-foreground text-sm font-bold select-none">
                          ₱
                        </span>
                        <input
                          type="text"
                          placeholder="0.00"
                          value={formBudget}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9.]/g, "");
                            setFormBudget(v);
                            setErrors((p) => ({ ...p, budget: undefined }));
                          }}
                          className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                            errors.budget
                              ? "border-danger/50 focus:ring-danger/20 bg-danger/5 text-danger"
                              : "border-border focus:ring-primary/20 focus:border-primary bg-white text-primary-foreground"
                          }`}
                        />
                      </div>
                      {errors.budget && (
                        <p className="mt-1 text-[11px] font-semibold text-danger flex items-center gap-1">
                          <svg
                            width="12"
                            height="12"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.budget}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleSubmit}
                      className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                    >
                      Submit Proposal
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold text-secondary-foreground hover:text-primary hover:border-primary/30 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </section>
            )}

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-2 ml-2">
                  Total Proposed Budget
                </h3>
                <p className="text-3xl font-extrabold text-primary tracking-tight ml-2">
                  {formatCurrency(totalBudget)}
                </p>
                <svg
                  className="absolute right-[-5%] bottom-[-10%] w-28 h-28 text-primary/5 group-hover:scale-110 transition-transform duration-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2e7d32]" />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-2 ml-2">
                  Approved Projects
                </h3>
                <p className="text-3xl font-extrabold text-primary tracking-tight ml-2">
                  {approvedCount}
                </p>
                <p className="text-xs font-semibold text-secondary-foreground ml-2 mt-1">
                  of {projects.length} total proposals
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#f57f17]" />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-2 ml-2">
                  Pending Review
                </h3>
                <p className="text-3xl font-extrabold text-primary tracking-tight ml-2">
                  {pendingCount}
                </p>
                {pendingCount > 0 && (
                  <div className="mt-1 ml-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#f57f17]">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f57f17] animate-pulse" />
                    Awaiting approval
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-base font-bold text-primary">
                  Project Proposals
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  {projects.length}{" "}
                  {projects.length === 1 ? "Record" : "Records"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-border">
                    <tr>
                      {[
                        "Project Name",
                        "Category",
                        "Proposed By",
                        "Date Filed",
                        "Approval Status",
                        "Allocated Budget",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {projects.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-primary/2 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-primary text-sm group-hover:text-tertiary transition-colors">
                            {p.name}
                          </p>
                          <p className="text-xs text-secondary-foreground mt-0.5 font-medium">
                            ID: PRJ-{p.id.padStart(4, "0")}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-primary-foreground font-medium">
                          {p.proposedBy}
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary-foreground font-medium">
                          {p.dateProposed}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusStyles[p.status]}`}
                          >
                            <span
                              className={`mr-1.5 w-1.5 h-1.5 rounded-full ${statusAccent[p.status]} ${p.status === "Pending" ? "animate-pulse" : ""}`}
                            />
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary tracking-tight text-sm">
                            {formatCurrency(p.budget)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-sm font-medium text-secondary-foreground"
                        >
                          No project proposals found for this barangay.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
