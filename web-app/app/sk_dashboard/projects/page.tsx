"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect, useMemo } from "react";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { Project, ProjectStatus, PROJECT_CATEGORIES } from "@/lib/dummyData";
import {
  Plus,
  CheckCircle2,
  X,
  AlertCircle,
  Wallet,
  Clock,
} from "lucide-react";

// HELPERS
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount,
  );

export default function ProjectsPage() {
  // STATE
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    budget?: string;
  }>({});

  // FETCH PROJECTS FROM SUPABASE
  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        return;
      }

      if (data) {
        // Map Supabase project fields to UI Project type
        const mappedProjects: Project[] = data.map((item) => ({
          id: String(item.id),
          name: item.name || "Unnamed Project",
          category: item.category || "General Fund",
          status: (item.status as ProjectStatus) || "Pending",
          budget: Number(item.budget) || 0,
          proposedBy: item.proposedBy || "SK Official",
          dateProposed: item.dateProposed
            ? new Date(item.dateProposed).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A",
        }));

        setProjects(mappedProjects);
      }
    } catch (err) {
      console.error("Unexpected fetch error:", err);
    }
  };

  // FETCH USER DATA & ALLOCATIONS ON MOUNT
  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setIsLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile && !error) {
          setCurrentUser({
            id: session.user.id,
            username: profile.username,
            full_name: profile.full_name || profile.username,
            role_type: profile.role_type,
            barangay: profile.barangay || "N/A",
            email: profile.email,
            approval_status: profile.approval_status,
          });
        }

        // Fetch records from projects
        await fetchProjects();
      } catch (error) {
        console.error("Error fetching user session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndData();
  }, []);

  // VARIABLES
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const approvedCount = projects.filter((p) => p.status === "Approved").length;
  const pendingCount = projects.filter((p) => p.status === "Pending").length;

  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return projects;
    return projects.filter((p) =>
      `${p.name} ${p.category} ${p.proposedBy}`.toLowerCase().includes(query),
    );
  }, [projects, search]);

  // HANDLERS
  const handleSubmit = async () => {
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

    setIsSubmitting(true);

    try {
      // Save to Supabase 'projects' table
      const { error } = await supabase.from("projects").insert([
        {
          user_id: currentUser?.id,
          name: formName.trim(),
          category: formCategory,
          status: "Pending",
          budget: budgetNum,
          proposedBy: currentUser?.full_name,
          dateProposed: new Date().toISOString(),
          barangay: currentUser?.barangay ?? null,
        },
      ]);

      if (error) {
        console.error("Error saving project:", error);
        alert("Failed to submit proposal: " + error.message);
        return;
      }

      // Refresh UI data
      await fetchProjects();

      setFormName("");
      setFormCategory("");
      setFormBudget("");
      setErrors({});
      setShowForm(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormName("");
    setFormCategory("");
    setFormBudget("");
    setErrors({});
  };

  // LOADING STATE
  if (isLoading) return <LogoLoader />;

  // ERROR / UNAUTHORIZED STATE
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-primary/5 border border-border p-8 text-center">
          <div className="h-12 w-12 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-danger text-xl">
              <AlertCircle />
            </span>
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
    <div className="flex min-h-screen gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser.full_name}
          userEmail={currentUser.email}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <PageHeader
          eyebrow="SK Officials"
          title="Projects"
          subtitle="Manage and propose SK projects across your barangay."
          actions={
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Propose Project
            </button>
          }
        />

        {successMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-5 py-3.5 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Project proposal submitted successfully — now pending for review.
          </div>
        )}

        {showForm && (
          <Card>
            <CardHeader
              eyebrow="New"
              title="Propose a New Project"
              action={
                <button
                  onClick={handleCancel}
                  className="text-secondary-foreground transition hover:text-primary"
                  aria-label="Close form"
                >
                  <X className="h-5 w-5" />
                </button>
              }
            />

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
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
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-primary-foreground outline-none transition-all focus:ring-2 placeholder:text-secondary-foreground/50 ${
                    errors.name
                      ? "border-danger/50 bg-danger/5 focus:ring-danger/20"
                      : "border-border bg-white focus:border-primary focus:ring-primary/20"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-danger">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      setErrors((p) => ({ ...p, category: undefined }));
                    }}
                    className={`w-full appearance-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 cursor-pointer ${
                      errors.category
                        ? "border-danger/50 bg-danger/5 text-danger focus:ring-danger/20"
                        : formCategory
                          ? "border-border bg-white text-primary-foreground focus:border-primary focus:ring-primary/20"
                          : "border-border bg-white text-secondary-foreground focus:border-primary focus:ring-primary/20"
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
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-danger">
                      <AlertCircle className="h-3 w-3" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Budget (PHP) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-sm font-bold text-secondary-foreground">
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
                      className={`w-full rounded-xl border py-2.5 pl-8 pr-4 text-sm outline-none transition-all focus:ring-2 ${
                        errors.budget
                          ? "border-danger/50 bg-danger/5 text-danger focus:ring-danger/20"
                          : "border-border bg-white text-primary-foreground focus:border-primary focus:ring-primary/20"
                      }`}
                    />
                  </div>
                  {errors.budget && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-danger">
                      <AlertCircle className="h-3 w-3" />
                      {errors.budget}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold tracking-wide text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Proposal"}
                </button>
                <button
                  onClick={handleCancel}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-secondary-foreground transition-all hover:border-primary/30 hover:text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Total Proposed Budget"
            value={formatCurrency(totalBudget)}
            icon={Wallet}
            variant="brand"
            trend={`${projects.length} total proposals`}
          />
          <StatCard
            label="Approved Projects"
            value={approvedCount}
            icon={CheckCircle2}
            trend={`of ${projects.length} total proposals`}
          />
          <StatCard
            label="Pending Review"
            value={pendingCount}
            icon={Clock}
            trend={pendingCount > 0 ? "Awaiting approval" : "All caught up"}
          />
        </div>

        {/* PROPOSALS TABLE */}
        <Card>
          <CardHeader
            eyebrow="Records"
            title="Project Proposals"
            subtitle={`${filteredProjects.length} ${
              filteredProjects.length === 1 ? "record" : "records"
            } · showing ${filteredProjects.length} of ${projects.length}`}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
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
                      className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-primary-foreground">
                        {p.name}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-secondary-foreground">
                        ID: PRJ-
                        {p.id.length > 8
                          ? p.id.slice(0, 8).toUpperCase()
                          : p.id.padStart(4, "0")}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-primary-foreground">
                      {p.proposedBy}
                    </td>
                    <td className="px-4 py-4 font-medium text-secondary-foreground">
                      {p.dateProposed}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={p.status} showDot />
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold tracking-tight text-primary-foreground">
                        {formatCurrency(p.budget)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm font-medium text-secondary-foreground"
                    >
                      {projects.length === 0
                        ? "No project proposals found for this barangay."
                        : "No proposals match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
