"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import PortalNav from "../../components/public_portal/PortalNav";
import PortalHero from "../../components/public_portal/PortalHero";
import MetricsRow from "../../components/public_portal/MetricsRow";
import AnalyticsSection from "../../components/public_portal/AnalyticsSection";
import ProjectRegistry from "../../components/public_portal/ProjectRegistry";
import PortalFooter from "../../components/public_portal/PortalFooter";

export default function PublicDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchProjects() {
      // 🔍 DIAGNOSTIC LOGS: I-check kung nababasa ng Next.js ang .env.local
      const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      console.log("-----------------------------------------");
      console.log("🌐 SUPABASE DEBUG INFO:");
      console.log("URL status:", envUrl ? `Loaded (${envUrl})` : "❌ MISSING / UNDEFINED");
      console.log("KEY status:", envKey ? "Loaded (Present)" : "❌ MISSING / UNDEFINED");
      console.log("-----------------------------------------");

      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*");

        if (error) {
          console.error("❌ Supabase query error:", error.message, error);
        } else if (data) {
          console.log("✅ SUPABASE SUCCESS! Data received:", data);
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