"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { useToast } from "@/lib/useToast";
import {
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Receipt,
  TrendingUp,
} from "lucide-react";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "liquidation",
    name: "Liquidation Report",
    description: "COA-compliant expense liquidation with receipts verification",
    icon: <Receipt className="w-5 h-5" />,
    required: true,
  },
  {
    id: "financial-summary",
    name: "Financial Summary",
    description: "Monthly/quarterly budget utilization and remaining funds",
    icon: <TrendingUp className="w-5 h-5" />,
    required: false,
  },
];

const inputClass =
  "w-full rounded-xl border border-border bg-white py-3 pl-10 pr-3 text-sm font-bold text-primary-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function ReportsPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 1: Report Selection
  const [selectedReports, setSelectedReports] = useState<string[]>([
    "liquidation",
  ]);

  // Step 2: Date Range
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Step 3: Filters
  const [filters, setFilters] = useState({
    category: "",
    project: "",
    includeReceipts: true,
  });

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
              "Unauthorized access: Only SK officials can generate reports.",
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

  const toggleReportSelection = (reportId: string) => {
    const template = REPORT_TEMPLATES.find((t) => t.id === reportId);
    if (template?.required) return;

    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId],
    );
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return selectedReports.length > 0;
      case 2:
        return (
          dateRange.startDate &&
          dateRange.endDate &&
          new Date(dateRange.startDate) <= new Date(dateRange.endDate)
        );
      case 3:
        return true; // Filters are optional
      default:
        return false;
    }
  };

  const generateReports = async () => {
    setIsGenerating(true);
    try {
      // TODO: Generate reports based on selections and save to Supabase/blockchain
      await new Promise((resolve) => setTimeout(resolve, 4000));

      toast.success(
        "Reports generated successfully! Download links sent to your email.",
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to generate reports.";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

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
          title="Report Generator"
          subtitle="COA-compliant automated reporting."
          actions={
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 shadow-sm">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      step <= currentStep
                        ? "bg-primary text-white"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <ChevronRight className="mx-1 h-4 w-4 text-secondary-foreground/50" />
                  )}
                </div>
              ))}
            </div>
          }
        />

        {/* STEP 1: REPORT SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadein">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold tracking-tight text-primary-foreground">
                Select Reports
              </h2>
              <p className="mt-1 text-sm text-secondary-foreground">
                Choose which COA-compliant reports to generate
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REPORT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  onClick={() => toggleReportSelection(template.id)}
                  className={`cursor-pointer rounded-3xl border-2 p-6 transition-all ${
                    selectedReports.includes(template.id)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-white hover:border-secondary-foreground/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-xl p-2 ${
                        selectedReports.includes(template.id)
                          ? "bg-primary text-white"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="font-bold text-primary-foreground">
                          {template.name}
                        </h3>
                        {template.required && (
                          <span className="rounded-full bg-danger/10 px-2 py-1 text-xs font-bold text-danger">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-secondary-foreground">
                        {template.description}
                      </p>
                    </div>
                    {selectedReports.includes(template.id) && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DATE RANGE */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadein">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold tracking-tight text-primary-foreground">
                Select Date Range
              </h2>
              <p className="mt-1 text-sm text-secondary-foreground">
                Specify the reporting period
              </p>
            </div>

            <Card className="mx-auto max-w-md">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Start Date
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    End Date
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                {new Date(dateRange.startDate) > new Date(dateRange.endDate) && (
                  <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3">
                    <AlertCircle className="h-5 w-5 text-danger" />
                    <p className="text-sm font-medium text-danger">
                      Start date cannot be after end date
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* STEP 3: FILTERS & GENERATE */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadein">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold tracking-tight text-primary-foreground">
                Review & Generate
              </h2>
              <p className="mt-1 text-sm text-secondary-foreground">
                Configure filters and generate your reports
              </p>
            </div>

            {/* SUMMARY */}
            <div className="rounded-3xl border border-border bg-secondary/40 p-6">
              <h3 className="mb-4 font-bold text-primary-foreground">
                Report Summary
              </h3>
              <div className="space-y-2 text-sm text-secondary-foreground">
                <p>
                  <span className="font-semibold text-primary-foreground">
                    Reports:
                  </span>{" "}
                  {selectedReports
                    .map(
                      (id) => REPORT_TEMPLATES.find((t) => t.id === id)?.name,
                    )
                    .join(", ")}
                </p>
                <p>
                  <span className="font-semibold text-primary-foreground">
                    Period:
                  </span>{" "}
                  {dateRange.startDate} to {dateRange.endDate}
                </p>
                <p>
                  <span className="font-semibold text-primary-foreground">
                    Generated by:
                  </span>{" "}
                  {currentUser?.full_name}
                </p>
              </div>
            </div>

            {/* OPTIONAL FILTERS */}
            <Card>
              <CardHeader
                eyebrow="Optional"
                title="Filters"
              />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeReceipts"
                    checked={filters.includeReceipts}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        includeReceipts: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="includeReceipts"
                    className="text-sm font-medium text-primary-foreground"
                  >
                    Include digital receipt attachments
                  </label>
                </div>
              </div>
            </Card>

            {/* GENERATE BUTTON */}
            <div className="flex justify-center pt-2">
              <button
                onClick={generateReports}
                disabled={isGenerating}
                className="flex items-center gap-3 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-secondary-foreground/30"
              >
                {isGenerating ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Download size={18} />
                )}
                {isGenerating
                  ? "Generating Reports..."
                  : "Generate COA Reports"}
              </button>
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="font-medium text-secondary-foreground transition-colors hover:text-primary-foreground disabled:text-secondary-foreground/40"
          >
            Previous
          </button>

          <div className="text-sm text-secondary-foreground">
            Step {currentStep} of 3
          </div>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              disabled={!validateCurrentStep()}
              className="rounded-xl bg-primary px-6 py-2 font-medium text-white transition-colors hover:bg-primary/90 disabled:bg-secondary-foreground/30"
            >
              Next
            </button>
          ) : (
            <div />
          )}
        </div>
      </main>
    </div>
  );
}
