"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  FileText,
  Landmark,
  FolderKanban,
} from "lucide-react";

interface ProjectRow {
  id: string;
  name: string;
  budget: number;
  status: string;
  description: string | null;
  location: string | null;
  barangay: string | null;
}

export default function BMOReviewPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [actingProjectId, setActingProjectId] = useState<string | null>(null);
  const router = useRouter();

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setProjects(data as ProjectRow[]);
  };

  // 1. Authenticate and protect the page
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, username, full_name, role_type, barangay, email, approval_status",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          if (profileData.role_type !== "BMO") {
            console.warn("Unauthorized access: User is not a BMO member.");
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          });

          await fetchProjects();
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  // 2. Filter projects (Pending status + Search Query)
  const pendingProjects = projects.filter((p) =>
    ["Pending", "Proposed"].includes(p.status),
  );

  const filteredProjects = pendingProjects.filter((p) =>
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleApprove = async (projectId: string) => {
    setActingProjectId(projectId);
    await supabase
      .from("projects")
      .update({ status: "Approved" })
      .eq("id", projectId);
    await fetchProjects();
    setActingProjectId(null);
  };

  const handleReturn = async (projectId: string) => {
    setActingProjectId(projectId);
    await supabase
      .from("projects")
      .update({ status: "Rejected" })
      .eq("id", projectId);
    await fetchProjects();
    setActingProjectId(null);
  };

  // Helper for currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  const totalValue = pendingProjects.reduce(
    (sum, p) => sum + (p.budget || 0),
    0,
  );

  if (isLoading) return <LogoLoader />;

  if (!currentUser) return null;

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
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <PageHeader
          eyebrow="Action Required"
          title="Budget Alignment Queue"
          subtitle="Review pending SK project proposals, verify their legal compliance, and align them with the Annual Barangay Youth Investment Program (ABYIP)."
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Pending Reviews"
            value={pendingProjects.length}
            icon={ClipboardCheck}
            variant="brand"
            trend="Awaiting BMO alignment"
          />
          <StatCard
            label="Total Value"
            value={formatCurrency(totalValue)}
            icon={Landmark}
            trend="Across pending proposals"
          />
          <StatCard
            label="Active Projects"
            value={projects.length}
            icon={FolderKanban}
            trend="In the overall pipeline"
          />
        </div>

        {/* PROJECT LIST */}
        {filteredProjects.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-secondary-foreground/30" />
              <h3 className="text-lg font-bold text-primary-foreground">
                Inbox Zero!
              </h3>
              <p className="mt-1 text-sm font-medium text-secondary-foreground">
                {searchQuery
                  ? "No proposals match your search."
                  : "There are no pending project proposals requiring budget alignment at this time."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col gap-6 rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] transition-all hover:bg-secondary/40 lg:flex-row lg:items-center lg:justify-between"
              >
                {/* Left: Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status="pending" showDot />
                    <span className="flex items-center gap-1 text-xs font-bold text-secondary-foreground">
                      <MapPin className="h-3 w-3" />
                      {project.barangay || project.location || "Barangay info missing"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold leading-tight text-primary-foreground">
                    {project.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-secondary-foreground">
                    {project.description ||
                      "No detailed description provided by the SK official."}
                  </p>
                </div>

                {/* Middle */}
                <div className="shrink-0 rounded-2xl border border-border bg-secondary/40 p-4 lg:w-52">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                    Requested Budget
                  </p>
                  <p className="mt-1 text-lg font-bold text-primary-foreground">
                    {formatCurrency(project.budget)}
                  </p>
                </div>

                {/* Right */}
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleApprove(project.id)}
                    disabled={actingProjectId === project.id}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50 lg:flex-none"
                  >
                    {actingProjectId === project.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Align &amp; Approve
                  </button>
                  <button
                    onClick={() => handleReturn(project.id)}
                    disabled={actingProjectId === project.id}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-secondary-foreground transition hover:border-danger/30 hover:bg-danger/5 hover:text-danger disabled:opacity-50 lg:flex-none"
                  >
                    {actingProjectId === project.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Return to SK
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
