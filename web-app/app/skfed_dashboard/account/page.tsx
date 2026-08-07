"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect } from "react";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { useAuthStore, UserAccount } from "@/lib/useAuthStore";
import { AlertCircle, UserCircle, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/useToast";

export default function AccountPage() {
  const toast = useToast();
  const router = useRouter();

  const {
    currentUser,
    isLoading,
    isEditing,
    isSaving,
    error,
    successMsg,
    userProfile,
    setCurrentUser,
    setIsLoading,
    setIsEditing,
    setIsSaving,
    setError,
    setSuccessMsg,
    setUserProfile,
  } = useAuthStore();

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
          .select(
            "id, username, full_name, role_type, barangay, email, approval_status",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          // SK Federation Protection
          if (profileData.role_type !== "SK_Federation") {
            console.warn(
              "Unauthorized access: User is not a SK Federation member.",
            );
            router.push("/unauthorized");
            return;
          }

          const profile = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          };

          setCurrentUser(profile as UserAccount);
          setUserProfile(profile);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && (!userProfile || userProfile.id !== currentUser.id)) {
      fetchUserProfile();
    }
  }, [
    currentUser,
    setCurrentUser,
    setIsLoading,
    setUserProfile,
    userProfile,
    router,
  ]);

  // HANDLERS
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, full_name: e.target.value });
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;

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
        setCurrentUser({
          ...currentUser,
          full_name: userProfile.full_name,
        });
      }

      setSuccessMsg("Account details updated successfully.");
      toast.success("Account details updated successfully!");
      setIsEditing(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatRole = (role: string) => {
    if (!role) return "Unknown Role";
    return role.replace("_", " ");
  };

  // LOADING STATE
  if (isLoading) return <LogoLoader />;

  // ERROR / UNAUTHORIZED STATE
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-primary/5 border border-border p-8 text-center">
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

  const staticField =
    "w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm font-medium text-secondary-foreground";
  const editableField =
    "w-full rounded-xl border border-primary/50 bg-white px-4 py-3 text-sm font-bold text-primary-foreground outline-none transition focus:ring-2 focus:ring-primary/20 shadow-sm";

  // MAIN DASHBOARD LAYOUT
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
          hideSearch
        />

        <PageHeader
          eyebrow="Account"
          title="Account Settings"
          subtitle="Manage your profile and system credentials."
        />

        {/* ALERTS */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm font-medium text-danger">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-5 py-4 text-sm font-medium text-success">
            <CheckCircleIcon />
            {successMsg}
          </div>
        )}

        {/* PROFILE OVERVIEW CARD */}
        <Card className="relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="z-10 flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-primary text-5xl font-bold text-white shadow-md ring-4 ring-white">
              {userProfile?.full_name
                ? userProfile.full_name.charAt(0).toUpperCase()
                : "U"}
            </div>

            <div className="z-10 flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-primary-foreground">
                {userProfile?.full_name || "Unknown User"}
              </h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary">
                {userProfile ? formatRole(userProfile.role_type) : "Unknown"}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                  Jurisdiction: {userProfile?.barangay || "N/A"}
                </span>
              </div>
            </div>

            <div className="z-10">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-primary transition-all hover:bg-secondary active:scale-95"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Decorative background icon */}
          <UserCircle
            className="absolute -right-[5%] -bottom-[20%] h-48 w-48 text-primary/5 transition-transform duration-700 group-hover:scale-110"
            strokeWidth={1}
          />
        </Card>

        {/* DETAILS FORM SECTION */}
        <Card>
          <CardHeader eyebrow="Credentials" title="System & Personal Details" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FULL NAME (Editable) */}
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                Full Name
              </label>
              {!isEditing ? (
                <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-primary-foreground">
                  {userProfile?.full_name || "Not provided"}
                </div>
              ) : (
                <input
                  type="text"
                  value={userProfile?.full_name || ""}
                  onChange={handleNameChange}
                  className={editableField}
                  placeholder="Enter your full name"
                />
              )}
            </div>

            {/* USERNAME (Read-Only) */}
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                System Username
              </label>
              <div className={staticField}>{userProfile?.username || "N/A"}</div>
              <p className="ml-1 text-[10px] text-secondary-foreground/70">
                Username is fixed to your login credentials.
              </p>
            </div>

            {/* ROLE (Read-Only) */}
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                Assigned Role
              </label>
              <div className={staticField}>
                {userProfile ? formatRole(userProfile.role_type) : "N/A"}
              </div>
            </div>

            {/* BARANGAY (Read-Only) */}
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                Barangay / Jurisdiction
              </label>
              <div className={staticField}>{userProfile?.barangay || "N/A"}</div>
            </div>
          </div>

          {/* ACTION BUTTONS (Only visible when editing) */}
          {isEditing && (
            <div className="mt-10 flex justify-end gap-4 border-t border-border pt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                  setSuccessMsg("");
                  // Reset name to original state
                  if (currentUser) {
                    setUserProfile({
                      id: currentUser.id,
                      username: currentUser.username,
                      full_name: currentUser.full_name,
                      role_type: currentUser.role_type,
                      barangay: currentUser.barangay,
                      email: currentUser.email,
                      approval_status: currentUser.approval_status,
                    });
                  }
                }}
                disabled={isSaving}
                className="rounded-xl border border-border bg-white px-6 py-3 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !userProfile?.full_name?.trim()}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:bg-primary/50 disabled:shadow-none"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
