"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRecordsSync } from "@/lib/useRecordsSync";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";
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
  const [searchQuery, setSearchQuery] = useState("");
  const { records: allocations } = useRecordsSync({
    type: "allocation",
    public: true,
    limit: 500,
  });
  const { records: expenses } = useRecordsSync({
    type: "expense",
    public: true,
    limit: 500,
  });

  const disbursements = useMemo<Disbursement[]>(() => {
    return [...allocations, ...expenses].map((record) => ({
      amount: Number(record.amount) || 0,
      created_at: record.created_at ?? undefined,
    }));
  }, [allocations, expenses]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data, error } = await supabase.from("projects").select("*");

        if (!error && data) {
          setProjects(data);
        }
      } catch (err) {
        console.error("❌ Network/Fetch Error:", err);
      }
    }

    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const name = (p.name || p.title || "").toLowerCase();
      const location = p.barangay || p.location || "";
      const barangay = (
        canonicalizeBarangay(location) ?? location
      ).toLowerCase();
      const category = (p.category || "").toLowerCase();

      return (
        name.includes(q) ||
        barangay.includes(q) ||
        category.includes(q)
      );
    });
  }, [searchQuery, projects]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background selection:bg-tertiary selection:text-primary">
      {/* AMBIENT BACKDROP */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-gradient-to-b from-primary/[0.07] via-background to-background"
      />
      <div
        aria-hidden
        className="ledger-grid pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60"
      />

      <div className="relative">
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
    </div>
  );
}