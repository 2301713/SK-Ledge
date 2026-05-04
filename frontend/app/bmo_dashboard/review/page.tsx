"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar"; // Make sure this path matches your setup!
import { INITIAL_PROJECTS } from "@/lib/dummyData";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";

const BMOReviewPage = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
          .select("id, username, full_name, role_type, barangay")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          if (profileData.role_type !== "BMO") {
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
          });
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  // 2. Filter projects (Using the corrected "Pending" status from our last fix)
  const filteredProjects = INITIAL_PROJECTS.filter(
    (p) => p.status === "Pending",
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 bg-primary rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* 3. Pass required props to SideBar */}
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
      />

      <main className="flex-1 p-10">
        <div className="mb-8 border-l-4 border-primary pl-4">
          <h1 className="text-2xl font-bold text-primary-foreground">
            Review Queue
          </h1>
          <p className="text-secondary-foreground">
            Cross-referencing projects with SK-Ledge budget constraints.
          </p>
        </div>

        <div className="overflow-hidden bg-white border border-border rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-foreground uppercase">
                  Project
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-foreground uppercase">
                  Allocation
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-secondary-foreground uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-foreground">
                    {/* NOTE: Make sure this is project.name or project.title based on dummyData.ts */}
                    {project.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                    {/* NOTE: If your dummy data uses 'budget', change this to project.budget */}
                    ₱{project.budget?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-all text-xs font-bold shadow-sm">
                      Align Budget
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProjects.length === 0 && (
            <div className="p-10 text-center text-secondary-foreground italic bg-white">
              No projects pending alignment.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BMOReviewPage;
