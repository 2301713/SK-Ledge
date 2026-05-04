"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  FolderKanban,
  UploadCloud,
  UserCircle,
  TrendingUp,
  CheckSquare,
  FileText,
  PieChart,
  TextSearch,
  Globe,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  userName: string;
  roleType: string;
  barangay?: string;
}

const ROLE_LINKS: Record<
  string,
  { label: string; href: string; icon: React.ElementType }[]
> = {
  SK_Chairperson: [
    { label: "Overview", href: "/sk_dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/sk_dashboard/projects", icon: FolderKanban },
    { label: "Documents", href: "/sk_dashboard/upload", icon: UploadCloud },
    { label: "Account", href: "/sk_dashboard/account", icon: UserCircle },
  ],
  SK_Treasurer: [
    { label: "Overview", href: "/sk_dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/sk_dashboard/projects", icon: FolderKanban },
    { label: "Documents", href: "/sk_dashboard/upload", icon: UploadCloud },
    { label: "Account", href: "/sk_dashboard/account", icon: UserCircle },
  ],
  COA: [
    { label: "Overview", href: "/coa_dashboard", icon: TrendingUp },
    { label: "Approvals", href: "/coa_dashboard/approvals", icon: CheckSquare },
    {
      label: "Disbursements",
      href: "/coa_dashboard/disbursements",
      icon: FileText,
    },
    { label: "Account", href: "/coa_dashboard/account", icon: UserCircle },
  ],
  BMO: [
    { label: "Overview", href: "/bmo_dashboard", icon: PieChart },
    { label: "Budget Review", href: "/bmo_dashboard/review", icon: TextSearch },
    { label: "Account", href: "/bmo_dashboard/account", icon: UserCircle },
  ],
  SK_Fed: [
    { label: "Overview", href: "/skfed_dashboard", icon: Globe },
    {
      label: "Reports",
      href: "/skfed_dashboard/reports",
      icon: FileText,
    },
    {
      label: "Account",
      href: "/skfed_dashboard/account",
      icon: UserCircle,
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

  const navLinks = ROLE_LINKS[roleType] || [];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const formatRole = (role: string) => {
    return role.replace("_", " ");
  };

  return (
    <aside className="w-[280px] bg-primary text-white flex flex-col h-screen sticky top-0 shadow-2xl z-50">
      {/* BRANDING HEADER */}
      <div className="h-24 flex items-center px-8 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center shadow-lg shadow-tertiary/20">
            <span className="font-black text-primary text-base">SK</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-white leading-none">
              SK-Ledge
            </h1>
            <p className="text-[10px] text-tertiary uppercase tracking-[0.2em] font-bold mt-1">
              Portal
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        {navLinks.length > 0 ? (
          navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center px-4 py-3.5 rounded-xl text-sm font-bold transition-all group overflow-hidden ${
                  isActive
                    ? "text-primary bg-white shadow-md"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary" />
                )}
                <Icon
                  className={`w-5 h-5 mr-3 transition-colors ${
                    isActive
                      ? "text-tertiary"
                      : "text-white/50 group-hover:text-white"
                  }`}
                />
                {link.label}
              </Link>
            );
          })
        ) : (
          <p className="text-xs text-white/50 text-center mt-4">
            No navigation available.
          </p>
        )}
      </nav>

      {/* UNIFIED USER PROFILE & LOGOUT CARD AT BOTTOM */}
      <div className="p-5 border-t border-white/10 shrink-0 bg-primary/80 backdrop-blur-md">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-tertiary rounded-full flex items-center justify-center font-black text-primary shrink-0 shadow-inner">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <p
                className="text-sm font-bold truncate text-white"
                title={userName}
              >
                {userName}
              </p>
              <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold truncate">
                {formatRole(roleType)}
              </p>
              {barangay && (
                <p className="text-[10px] text-foreground">{barangay}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-danger/20 text-white/70 hover:text-danger flex items-center justify-center transition-all shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
