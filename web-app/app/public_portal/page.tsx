"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import PortalNav from "../../components/public_portal/PortalNav";
import PortalHero from "../../components/public_portal/PortalHero";
import MetricsRow from "../../components/public_portal/MetricsRow";
import AnalyticsSection from "../../components/public_portal/AnalyticsSection";
import ProjectRegistry from "../../components/public_portal/ProjectRegistry";
import OnChainVerifier from "../../components/public_portal/OnChainVerifier";
import PortalFooter from "../../components/public_portal/PortalFooter";
import { Project } from "../../components/public_portal/ProjectRegistry";

type Disbursement = {
  amount: number;
  created_at?: string;
};

export default function PublicDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchPortalData() {
      try {
        const [projectsRes, allocationsRes, expensesRes] = await Promise.all([
          supabase.from("projects").select("*"),
          supabase.from("allocations").select("amount, created_at"),
          supabase.from("expenses").select("amount, created_at"),
        ]);

        if (!projectsRes.error && projectsRes.data) {
          setProjects(projectsRes.data);
        }

        const merged: Disbursement[] = [];
        if (!allocationsRes.error && allocationsRes.data) {
          merged.push(...allocationsRes.data);
        }
        if (!expensesRes.error && expensesRes.data) {
          merged.push(...expensesRes.data);
        }
        setDisbursements(merged);
      } catch (err) {
        console.error("❌ Network/Fetch Error:", err);
      }
    }

    fetchPortalData();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const name = (p.name || p.title || "").toLowerCase();
      const barangay = (p.barangay || p.location || "").toLowerCase();
      const category = (p.category || "").toLowerCase();

      return (
        name.includes(q) ||
        barangay.includes(q) ||
        category.includes(q)
      );
    });
  }, [searchQuery, projects]);

  return (
    <div className="min-h-screen bg-background selection:bg-tertiary selection:text-primary">
      <PortalNav />
      <main>
        <PortalHero />
        <MetricsRow projects={projects} />
        <AnalyticsSection projects={projects} disbursements={disbursements} />
        <OnChainVerifier />
        <ProjectRegistry
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filteredProjects={filteredProjects}
        />
      </main>
      <PortalFooter />
    </div>
  );
}