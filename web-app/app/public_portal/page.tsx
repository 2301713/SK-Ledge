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

export default function PublicDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchProjects() {

      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*");

        if (error) {
        } else if (data) {
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
    <div className="min-h-screen bg-white text-black selection:bg-primary/30">
      <PortalNav />
      <main>
        <PortalHero />
        <MetricsRow />
        <AnalyticsSection />
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