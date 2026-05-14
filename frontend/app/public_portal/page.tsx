"use client";

import { useState, useMemo } from "react";
import { projectsData } from "./data";
import PortalNav from "../../components/public_portal/PortalNav";
import PortalHero from "../../components/public_portal/PortalHero";
import MetricsRow from "../../components/public_portal/MetricsRow";
import AnalyticsSection from "../../components/public_portal/AnalyticsSection";
import ProjectRegistry from "../../components/public_portal/ProjectRegistry";
import PortalFooter from "../../components/public_portal/PortalFooter";

export default function PublicDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    return projectsData.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.barangay.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-white text-black selection:bg-primary/30">
      <PortalNav />
      <main>
        <PortalHero />
        <MetricsRow />
        <AnalyticsSection />
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
