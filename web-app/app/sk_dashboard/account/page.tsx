"use client";

import LogoLoader from "@/components/LogoLoader";
import Image from "next/image";
import { useEffect, useRef } from "react";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { useAuthStore, UserAccount } from "@/lib/useAuthStore";
import { AlertCircle, UserCircle, Pencil } from "lucide-react";
import { useToast } from "@/lib/useToast";
import { WalletBinding } from "@/components/WalletBinding";
import DeleteAccountCard from "@/components/DeleteAccountCard";
import {
  isValidContactNumber,
  normalizeContactNumber,
} from "@/lib/contactNumber";

export default function AccountPage() {
  const toast = useToast();
  const authAttemptedRef = useRef(false);
  const {
    currentUser,
    isLoading,
    isEditing,
    isSaving,
    userProfile,
    setCurrentUser,
    setIsLoading,
    setIsEditing,
    setIsSaving,
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
            "id, username, full_name, role_type, barangay, email, contact_number, approval_status, avatar_url, wallet_address",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type as "Chairman" | "Treasurer",
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            contact_number: profileData.contact_number || null,
            approval_status: profileData.approval_status,
            avatar_url: profileData.avatar_url || undefined,
            wallet_address: profileData.wallet_address || null,
          } as UserAccount);

          // Set Form State
          setUserProfile({
            id: user.id,
            username: profileData.username,
            full_name: profileData.full_name || "",
            role_type: profileData.role_type,
            barangay: profileData.barangay || "N/A",
            contact_number: profileData.contact_number || null,
            avatar_url: profileData.avatar_url || undefined,
            wallet_address: profileData.wallet_address || null,
          });
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      fetchUserProfile();
    }
  }, [setCurrentUser, setIsLoading, setUserProfile]);

  // HANDLERS
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, full_name: e.target.value });
    }
  };

  const handleContactNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, contact_number: e.target.value });
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, username: e.target.value });
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;

    setIsSaving(true);

    const rawContact = (userProfile.contact_number || "").trim();
    const contactNumber = rawContact
      ? normalizeContactNumber(rawContact)
      : null;

    if (contactNumber && !isValidContactNumber(contactNumber)) {
      toast.error(
        "That mobile number does not look right. Use the 0917 123 4567 format.",
      );
      setIsSaving(false);
      return;
    }

    const username = (userProfile.username || "").trim();

    if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) {
      toast.error(
        "Usernames must be 3–32 characters using letters, numbers, dots, dashes, or underscores.",
      );
      setIsSaving(false);
      return;
    }

    try {
      const { data: updatedRows, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: userProfile.full_name,
          username,
          contact_number: contactNumber,
        })
        .eq("id", userProfile.id)
        .select("id, full_name, username, contact_number");

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error("That username is already taken.");
        }
        throw updateError;
      }

      // RLS silently filters rows, so an empty result means nothing was saved.
      const saved = updatedRows?.[0];
      if (!saved) {
        throw new Error("The profile update was rejected. Please sign in again.");
      }

      // Update the sidebar name dynamically without reloading
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          full_name: saved.full_name ?? userProfile.full_name,
          username: saved.username,
          contact_number: saved.contact_number ?? contactNumber,
        });
      }

      toast.success("Profile updated — your name, username, and contact number are saved.");
      setIsEditing(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Please try again.";
      toast.error(`Could not save your profile — ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatRole = (role: string) => {
    if (!role) return "Unknown Role";
    return role.replace("_", " ");
  };

  // LOADING STATE (Matched from SK Dashboard)
  if (isLoading) return <LogoLoader />;

  // ERROR / UNAUTHORIZED STATE (Matched from SK Dashboard)
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
    <div className="flex min-h-screen flex-col lg:flex-row gap-2 bg-background p-2 selection:bg-tertiary selection:text-primary sm:gap-4 sm:p-4">
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

        {/* PROFILE OVERVIEW CARD */}
        <Card className="relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="z-10 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-5xl font-bold text-white shadow-md ring-4 ring-white">
              {userProfile?.avatar_url ? (
                <Image
                  src={userProfile.avatar_url}
                  alt={userProfile.full_name || "User"}
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                />
              ) : userProfile?.full_name ? (
                userProfile.full_name.charAt(0).toUpperCase()
              ) : (
                "U"
              )}
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

        <Card>
          <CardHeader eyebrow="Blockchain" title="Wallet authorization" />
          <WalletBinding boundWallet={userProfile?.wallet_address} />
        </Card>

        {/* DETAILS FORM SECTION */}
        <Card>
          <CardHeader eyebrow="Credentials" title="System & Personal Details" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
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

            {/* CONTACT NUMBER (Editable) */}
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                Contact Number
              </label>
              {!isEditing ? (
                <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-primary-foreground">
                  {userProfile?.contact_number || "Not provided"}
                </div>
              ) : (
                <input
                  type="tel"
                  inputMode="tel"
                  value={userProfile?.contact_number || ""}
                  onChange={handleContactNumberChange}
                  className={editableField}
                  placeholder="0917 123 4567"
                />
              )}
            </div>

            {/* USERNAME (Editable) */}
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                System Username
              </label>
              {!isEditing ? (
                <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-primary-foreground">
                  {userProfile?.username || "N/A"}
                </div>
              ) : (
                <input
                  type="text"
                  value={userProfile?.username || ""}
                  onChange={handleUsernameChange}
                  className={editableField}
                  placeholder="Enter a username"
                  autoComplete="off"
                />
              )}
              <p className="ml-1 text-[10px] text-secondary-foreground/70">
                Used across the portal. Your Google sign-in email does not
                change.
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
              <div className={staticField}>
                {userProfile?.barangay || "N/A"}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS (Only visible when editing) */}
          {isEditing && (
            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end sm:gap-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  // Reset name to original state
                  if (currentUser) {
                    setUserProfile({
                      id: currentUser.id,
                      username: currentUser.username,
                      full_name: currentUser.full_name,
                      role_type: currentUser.role_type,
                      barangay: currentUser.barangay,
                      email: currentUser.email,
                      contact_number: currentUser.contact_number,
                      approval_status: currentUser.approval_status,
                      avatar_url: currentUser.avatar_url,
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

        <DeleteAccountCard username={userProfile?.username} />
      </main>
    </div>
  );
}
