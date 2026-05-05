"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";
import { AlertCircle, UserCircle } from "lucide-react";

export default function AccountPage() {
  // LAYOUT & AUTH STATE
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ACCOUNT FORM STATE
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [userProfile, setUserProfile] = useState({
    id: "",
    username: "",
    full_name: "",
    role_type: "",
    barangay: "",
  });

  // GET USER DATA
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("No active user session found.");
          setIsLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, full_name, role_type, barangay")
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
          });

          // Set Form State
          setUserProfile({
            id: user.id,
            username: profileData.username,
            full_name: profileData.full_name || "",
            role_type: profileData.role_type,
            barangay: profileData.barangay || "N/A",
          });
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // HANDLERS
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserProfile({ ...userProfile, full_name: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: userProfile.full_name })
        .eq("id", userProfile.id);

      if (updateError) throw updateError;

      // Update the sidebar name dynamically without reloading
      if (currentUser) {
        setCurrentUser({ ...currentUser, full_name: userProfile.full_name });
      }

      setSuccessMsg("Account details updated successfully.");
      setIsEditing(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRole = (role: string) => {
    if (!role) return "Unknown Role";
    return role.replace("_", " ");
  };

  // LOADING STATE (Matched from SK Dashboard)
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center text-tertiary font-black text-3xl shadow-lg shadow-primary/20 mb-6 animate-pulse">
          B
        </div>
        <p className="text-[11px] font-bold text-secondary-foreground uppercase tracking-widest animate-pulse">
          Initializing Account...
        </p>
      </div>
    );
  }

  // ERROR / UNAUTHORIZED STATE (Matched from SK Dashboard)
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-primary/5 border border-border p-8 text-center">
          <div className="h-12 w-12 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-danger text-xl">
              <AlertCircle />
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-primary mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary-foreground mb-6">
            You do not have the required credentials or an active session to
            view this official dashboard.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD LAYOUT
  return (
    <div className="flex min-h-screen bg-background selection:bg-tertiary selection:text-primary">
      {/* SIDEBAR */}
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Subtle Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-160 h-160 bg-tertiary/5 rounded-full blur-3xl pointer-events-none z-0"></div>

        {/* HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight flex items-center gap-2">
              Account Settings
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mt-0.5">
              Manage your profile and system credentials
            </p>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* ALERTS */}
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-5 py-4 rounded-xl text-sm font-medium flex items-center gap-3">
                <span className="text-lg">
                  <AlertCircle />
                </span>{" "}
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-[#e8f5e9] border border-[#a5d6a7] text-[#2e7d32] px-5 py-4 rounded-xl text-sm font-medium flex items-center gap-3">
                <span className="text-lg">✅</span> {successMsg}
              </div>
            )}

            {/* PROFILE OVERVIEW CARD */}
            <section className="bg-white p-8 rounded-2xl border border-border shadow-sm relative overflow-hidden group flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>

              <div className="w-28 h-28 shrink-0 rounded-full bg-primary flex items-center justify-center text-5xl font-black text-white shadow-md border-4 border-white z-10">
                {userProfile.full_name
                  ? userProfile.full_name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div className="text-center md:text-left flex-1 z-10">
                <h2 className="text-3xl font-extrabold text-primary tracking-tight">
                  {userProfile.full_name || "Unknown User"}
                </h2>
                <p className="text-sm font-bold text-tertiary mt-1 uppercase tracking-widest">
                  {formatRole(userProfile.role_type)}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-gray-50 border border-border px-3 py-1.5 rounded-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2e7d32]"></span>
                  <span className="text-[10px] font-bold text-secondary-foreground tracking-wider uppercase">
                    Jurisdiction: {userProfile.barangay}
                  </span>
                </div>
              </div>

              <div className="z-10">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white border border-border text-primary px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide hover:bg-gray-50 hover:shadow-sm transition-all active:scale-95 flex items-center gap-2"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Decorative background icon */}
              <UserCircle
                className="absolute right-[-5%] bottom-[-20%] w-48 h-48 text-primary/5 group-hover:scale-110 transition-transform duration-700"
                strokeWidth={1}
              />
            </section>

            {/* DETAILS FORM SECTION */}
            <section className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="px-8 py-5 border-b border-border bg-gray-50/50">
                <h3 className="text-base font-bold text-primary">
                  System & Personal Details
                </h3>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* FULL NAME (Editable) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground ml-1">
                      Full Name
                    </label>
                    {!isEditing ? (
                      <div className="px-4 py-3 bg-white border border-border rounded-xl text-sm font-bold text-primary">
                        {userProfile.full_name || "Not provided"}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={userProfile.full_name}
                        onChange={handleNameChange}
                        className="w-full px-4 py-3 bg-white border border-primary/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                        placeholder="Enter your full name"
                      />
                    )}
                  </div>

                  {/* USERNAME (Read-Only) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground ml-1">
                      System Username
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-border/50 rounded-xl text-sm font-medium text-secondary-foreground cursor-not-allowed">
                      {userProfile.username}
                    </div>
                    <p className="text-[10px] text-secondary-foreground/70 ml-1">
                      Username is fixed to your login credentials.
                    </p>
                  </div>

                  {/* ROLE (Read-Only) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground ml-1">
                      Assigned Role
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-border/50 rounded-xl text-sm font-medium text-secondary-foreground cursor-not-allowed">
                      {formatRole(userProfile.role_type)}
                    </div>
                  </div>

                  {/* BARANGAY (Read-Only) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground ml-1">
                      Barangay / Jurisdiction
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-border/50 rounded-xl text-sm font-medium text-secondary-foreground cursor-not-allowed">
                      {userProfile.barangay}
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS (Only visible when editing) */}
                {isEditing && (
                  <div className="mt-10 pt-6 border-t border-border flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setError("");
                        setSuccessMsg("");
                        // Reset name to original state
                        setUserProfile((prev) => ({
                          ...prev,
                          full_name: currentUser?.full_name || "",
                        }));
                      }}
                      disabled={isSaving}
                      className="px-6 py-3 bg-white border border-border hover:bg-gray-50 text-secondary-foreground rounded-xl text-sm font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !userProfile.full_name.trim()}
                      className="px-6 py-3 bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 disabled:bg-primary/50 disabled:shadow-none text-white rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
