"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";
import { useToast } from "@/lib/useToast";
import {
  FileText,
  Download,
  Calendar,
  Filter,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          SK
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Report Generator...
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
            <div className="p-2 bg-green-50 text-green-700 rounded-lg">
              <FileText size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Report Generator
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                COA-compliant automated reporting
              </p>
            </div>
          </div>

          {/* PROGRESS INDICATOR */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step <= currentStep
                      ? "bg-green-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
                )}
              </div>
            ))}
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-4xl mx-auto">
            {/* STEP 1: REPORT SELECTION */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">
                    Select Reports
                  </h2>
                  <p className="text-slate-600">
                    Choose which COA-compliant reports to generate
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {REPORT_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => toggleReportSelection(template.id)}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedReports.includes(template.id)
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedReports.includes(template.id)
                              ? "bg-green-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-slate-900">
                              {template.name}
                            </h3>
                            {template.required && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {template.description}
                          </p>
                        </div>
                        {selectedReports.includes(template.id) && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: DATE RANGE */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">
                    Select Date Range
                  </h2>
                  <p className="text-slate-600">Specify the reporting period</p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Start Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-slate-400" />
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
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      End Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-slate-400" />
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
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>

                  {new Date(dateRange.startDate) >
                    new Date(dateRange.endDate) && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-red-700 font-medium">
                        Start date cannot be after end date
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: FILTERS & GENERATE */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">
                    Review & Generate
                  </h2>
                  <p className="text-slate-600">
                    Configure filters and generate your reports
                  </p>
                </div>

                {/* SUMMARY */}
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4">
                    Report Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Reports:</span>{" "}
                      {selectedReports
                        .map(
                          (id) =>
                            REPORT_TEMPLATES.find((t) => t.id === id)?.name,
                        )
                        .join(", ")}
                    </p>
                    <p>
                      <span className="font-medium">Period:</span>{" "}
                      {dateRange.startDate} to {dateRange.endDate}
                    </p>
                    <p>
                      <span className="font-medium">Generated by:</span>{" "}
                      {currentUser?.full_name}
                    </p>
                  </div>
                </div>

                {/* OPTIONAL FILTERS */}
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Filter size={16} />
                    Optional Filters
                  </h3>

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
                        className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                      />
                      <label
                        htmlFor="includeReceipts"
                        className="text-sm font-medium text-slate-700"
                      >
                        Include digital receipt attachments
                      </label>
                    </div>
                  </div>
                </div>

                {/* GENERATE BUTTON */}
                <div className="flex justify-center pt-6">
                  <button
                    onClick={generateReports}
                    disabled={isGenerating}
                    className="flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    {isGenerating ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 text-slate-600 hover:text-slate-900 disabled:text-slate-400 font-medium transition-colors"
              >
                Previous
              </button>

              <div className="text-sm text-slate-500">
                Step {currentStep} of 3
              </div>

              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                >
                  Next
                </button>
              ) : (
                <div></div> // Empty for alignment
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
