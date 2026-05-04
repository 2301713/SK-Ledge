"use client";

import { useState, useMemo } from "react";
import { projectsData } from "./data";
import PortalNav from "./components/PortalNav";
import PortalHero from "./components/PortalHero";
import MetricsRow from "./components/MetricsRow";
import AnalyticsSection from "./components/AnalyticsSection";
import ProjectRegistry from "./components/ProjectRegistry";
import PortalFooter from "./components/PortalFooter";

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
    <div className="min-h-screen bg-white text-black selection:bg-primary/30 selection:text-white">
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
