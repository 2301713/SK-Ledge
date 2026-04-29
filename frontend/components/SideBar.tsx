"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Adjust path if necessary

// --- TYPES ---
interface SidebarProps {
  userName: string;
  roleType: string;
  barangay?: string;
}

// --- CONFIGURATION: ROLE-BASED LINKS ---
// We define all possible dashboard links here. The sidebar will map through the array that matches the user's role.
const ROLE_LINKS: Record<
  string,
  { label: string; href: string; icon: string }[]
> = {
  SK_Chairperson: [
    { label: "Dashboard", href: "/sk_dashboard", icon: "fas fa-th-large" },
    { label: "Projects", href: "/sk_dashboard/projects", icon: "fas fa-tasks" },
    {
      label: "Upload Files",
      href: "/sk_dashboard/upload",
      icon: "fas fa-cloud-upload-alt",
    },
    {
      label: "Account Info",
      href: "/sk_dashboard/account",
      icon: "fas fa-user-circle",
    },
  ],
  SK_Treasurer: [
    { label: "Dashboard", href: "/sk_dashboard", icon: "fas fa-th-large" },
    { label: "Projects", href: "/sk_dashboard/projects", icon: "fas fa-tasks" },
    {
      label: "Upload Files",
      href: "/sk_dashboard/upload",
      icon: "fas fa-cloud-upload-alt",
    },
    {
      label: "Account Info",
      href: "/sk_dashboard/account",
      icon: "fas fa-user-circle",
    },
  ],
  COA: [
    { label: "Dashboard", href: "/coa_dashboard", icon: "fas fa-chart-line" },
    {
      label: "Approvals",
      href: "/coa_dashboard/approvals",
      icon: "fas fa-check-double",
    },
    {
      label: "Disbursements",
      href: "/coa_dashboard/disbursements",
      icon: "fas fa-file-invoice-dollar",
    },
    {
      label: "Account Info",
      href: "/coa_dashboard/account",
      icon: "fas fa-user-circle",
    },
  ],
  BMO: [
    { label: "Dashboard", href: "/bmo_dashboard", icon: "fas fa-chart-pie" },
    {
      label: "Budget Review",
      href: "/bmo_dashboard/review",
      icon: "fas fa-search-dollar",
    },
    {
      label: "Account Info",
      href: "/bmo_dashboard/account",
      icon: "fas fa-user-circle",
    },
  ],
  SK_Fed: [
    { label: "Dashboard", href: "/skfed_dashboard", icon: "fas fa-globe" },
    {
      label: "Consolidated Reports",
      href: "/skfed_dashboard/reports",
      icon: "fas fa-file-alt",
    },
    {
      label: "Account Info",
      href: "/skfed_dashboard/account",
      icon: "fas fa-user-circle",
    },
  ],
};

export default function Sidebar({
  userName,
  roleType,
  barangay,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Look up the links for the current user's role. Fallback to an empty array if role is missing.
  const navLinks = ROLE_LINKS[roleType] || [];

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Helper to format role names nicely in the UI
  const formatRole = (role: string) => {
    return role.replace("_", " ");
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 border-r border-slate-800">
      {/* BRANDING */}
      <div className="p-6 text-2xl font-bold border-b border-slate-800 tracking-tight">
        SK-Ledge
        <span className="text-xs block font-normal text-slate-400 mt-1">
          Governance Portal
        </span>
      </div>

      {/* USER PROFILE INFO */}
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800/50">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white shrink-0">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate w-full" title={userName}>
            {userName}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {formatRole(roleType)}{" "}
            {barangay && barangay !== "N/A" ? `• ${barangay}` : ""}
          </p>
        </div>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="grow p-4 space-y-1 overflow-y-auto">
        {navLinks.length > 0 ? (
          navLinks.map((link) => {
            // Check if the current route matches the link href so we can highlight it
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <i className={`${link.icon} w-6 text-center mr-2 text-lg`}></i>
                {link.label}
              </Link>
            );
          })
        ) : (
          <p className="text-xs text-slate-500 text-center mt-4">
            No navigation available for this role.
          </p>
        )}
      </nav>

      {/* LOGOUT BUTTON */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-medium"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> Sign Out
        </button>
      </div>
    </aside>
  );
}
