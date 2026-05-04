"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/SideBar";
import { UserAccount } from "./types";
import { INITIAL_PROJECTS } from "@/lib/dummyData";
import { supabase } from "@/lib/supabase";

const BMODashboard = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
            console.warn("Unauthorized access: User is not a BMO");
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type as "BMO",
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

  const pendingCount = INITIAL_PROJECTS.filter(
    (p) => p.status === "Pending",
  ).length;

  const totalValue = INITIAL_PROJECTS.reduce(
    (acc, curr) => acc + curr.budget,
    0,
  );

  // Show a loading state while fetching from Supabase
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 bg-primary rounded-full animate-pulse"></div>
      </div>
    );
  }

  // Prevent rendering if currentUser failed to load
  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
      />

      <main className="flex-1 p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-primary-foreground">
            BMO Overview
          </h1>
          <p className="text-secondary-foreground mt-1">
            Welcome back,{" "}
            <span className="font-semibold text-primary">
              {currentUser.full_name} {/* Fixed the greeting variable! */}
            </span>
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Highlighted Card with Tertiary Accent */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-tertiary">
            <p className="text-sm font-medium text-secondary-foreground uppercase tracking-wider">
              Pending Alignment
            </p>
            <h2 className="text-4xl font-bold text-primary-foreground mt-2">
              {pendingCount}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
            <p className="text-sm font-medium text-secondary-foreground uppercase tracking-wider">
              Total Managed
            </p>
            <h2 className="text-4xl font-bold text-primary-foreground mt-2">
              ₱{totalValue.toLocaleString()}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
            <p className="text-sm font-medium text-secondary-foreground uppercase tracking-wider">
              System Status
            </p>
            <div className="flex items-center mt-4 text-success">
              <div className="w-3 h-3 bg-success rounded-full animate-pulse mr-2"></div>
              <span className="font-semibold">Live / Secure</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BMODashboard;
