"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAvatarUrl } from "@/lib/useAvatarUrl";
import { useToast } from "@/lib/useToast";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";
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
  Receipt,
  FileBarChart,
  ShieldCheck,
  LogOut,
  Activity,
  ChartPie,
  Sliders,
  X,
  Loader2,
} from "lucide-react";

interface SidebarProps {
  userName: string;
  roleType: string;
  barangay?: string;
  avatarUrl?: string;
}

const ROLE_LINKS: Record<
  string,
  { id: string; label: string; href: string; icon: React.ElementType }[]
> = {
  SK_Chairperson: [
    {
      id: "id_1",
      label: "Overview",
      href: "/sk_dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "id_2",
      label: "Projects",
      href: "/sk_dashboard/projects",
      icon: FolderKanban,
    },
    {
      id: "id_3",
      label: "ABYIP",
      href: "/sk_dashboard/abyip",
      icon: ChartPie,
    },
    {
      id: "id_30",
      label: "Ceilings",
      href: "/sk_dashboard/ceiling",
      icon: Sliders,
    },
    {
      id: "id_29",
      label: "Approvals",
      href: "/sk_dashboard/approvals",
      icon: CheckSquare,
    },
    {
      id: "id_4",
      label: "Expenses",
      href: "/sk_dashboard/expenses",
      icon: Receipt,
    },
    {
      id: "id_5",
      label: "Reports",
      href: "/sk_dashboard/reports",
      icon: FileBarChart,
    },
    {
      id: "id_6",
      label: "Documents",
      href: "/sk_dashboard/upload",
      icon: UploadCloud,
    },
    {
      id: "id_7",
      label: "Account",
      href: "/sk_dashboard/account",
      icon: UserCircle,
    },
  ],
  SK_Treasurer: [
    {
      id: "id_8",
      label: "Overview",
      href: "/sk_dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "id_9",
      label: "Projects",
      href: "/sk_dashboard/projects",
      icon: FolderKanban,
    },
    {
      id: "id_10",
      label: "ABYIP",
      href: "/sk_dashboard/abyip",
      icon: ChartPie,
    },
    {
      id: "id_31",
      label: "Ceilings",
      href: "/sk_dashboard/ceiling",
      icon: Sliders,
    },
    {
      id: "id_11",
      label: "Expenses",
      href: "/sk_dashboard/expenses",
      icon: Receipt,
    },
    {
      id: "id_12",
      label: "Reports",
      href: "/sk_dashboard/reports",
      icon: FileBarChart,
    },
    {
      id: "id_13",
      label: "Documents",
      href: "/sk_dashboard/upload",
      icon: UploadCloud,
    },
    {
      id: "id_14",
      label: "Account",
      href: "/sk_dashboard/account",
      icon: UserCircle,
    },
  ],
  COA: [
    {
      id: "id_15",
      label: "Overview",
      href: "/coa_dashboard",
      icon: TrendingUp,
    },
    {
      id: "id_16",
      label: "Approvals",
      href: "/coa_dashboard/approvals",
      icon: CheckSquare,
    },
    {
      id: "id_17",
      label: "Disbursements",
      href: "/coa_dashboard/disbursements",
      icon: FileText,
    },
    {
      id: "id_18",
      label: "Auditor Portal",
      href: "/coa_dashboard/auditor",
      icon: ShieldCheck,
    },
    {
      id: "id_19",
      label: "Account",
      href: "/coa_dashboard/account",
      icon: UserCircle,
    },
  ],
  BMO: [
    { id: "id_20", label: "Overview", href: "/bmo_dashboard", icon: PieChart },
    {
      id: "id_21",
      label: "Budget Review",
      href: "/bmo_dashboard/review",
      icon: TextSearch,
    },
    {
      id: "id_22",
      label: "Bidding",
      href: "/bmo_dashboard/bidding",
      icon: Activity,
    },
    {
      id: "id_23",
      label: "Account",
      href: "/bmo_dashboard/account",
      icon: UserCircle,
    },
  ],
  SK_Federation: [
    { id: "id_24", label: "Overview", href: "/skfed_dashboard", icon: Globe },
    {
      id: "id_25",
      label: "Reports",
      href: "/skfed_dashboard/reports",
      icon: FileText,
    },
    {
      id: "id_26",
      label: "Account",
      href: "/skfed_dashboard/account",
      icon: UserCircle,
    },
  ],
  Admin: [
    {
      id: "id_27",
      label: "Overview",
      href: "/admin_dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "id_28",
      label: "Approval",
      href: "/admin_dashboard/approval",
      icon: UserCircle,
    },
  ],
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-secondary-foreground">
      {children}
    </p>
  );
}

export default function Sidebar({
  userName,
  roleType,
  barangay,
  avatarUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const displayBarangay = barangay
    ? (canonicalizeBarangay(barangay) ?? barangay)
    : undefined;
  const toast = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const resolvedAvatarUrl = useAvatarUrl(avatarUrl);

  const navLinks = ROLE_LINKS[roleType] || [];

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      // Full navigation: clearing the session in-place briefly rendered the
      // dashboard without a user, flashing the unauthorized screen.
      window.location.replace("/login");
    } catch (error) {
      setIsLoggingOut(false);
      toast.error("Failed to logout. Please try again.");
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      <aside className="sticky top-4 z-50 flex h-[calc(100vh-2rem)] w-65 shrink-0 flex-col rounded-3xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
        {/* BRAND */}
        <div className="flex items-center gap-3 px-2 pb-6 pt-1">
          <Image
            src="/skledge-logo.png"
            height={40}
            width={40}
            alt="SK-Ledge Logo"
          />
          <div>
            <p className="text-lg font-bold leading-none tracking-tight text-primary-foreground">
              SK-Ledge
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Portal
            </p>
          </div>
        </div>

        {/* MENU */}
        <nav className="thin-scrollbar flex-1 overflow-y-auto">
          <SectionLabel>Menu</SectionLabel>
          {navLinks.length > 0 ? (
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all ${
                      isActive ? "bg-primary/5" : "hover:bg-secondary"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isActive
                          ? "bg-primary text-white shadow-[0_4px_12px_-4px_rgba(1,56,168,0.5)]"
                          : "bg-secondary text-secondary-foreground group-hover:text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        isActive ? "text-primary" : "text-primary-foreground"
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="px-3 text-xs text-secondary-foreground">
              No navigation available.
            </p>
          )}
        </nav>

        {/* GENERAL */}
        <div className="pt-5">
          <SectionLabel>General</SectionLabel>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-white">
                {resolvedAvatarUrl ? (
                  <Image
                    src={resolvedAvatarUrl}
                    alt={userName}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p
                  className="truncate text-sm font-semibold text-primary-foreground"
                  title={userName}
                >
                  {userName}
                </p>
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  {roleType.replace("_", " ")}
                </p>
                {displayBarangay && displayBarangay !== "N/A" && (
                  <p className="truncate text-[10px] text-secondary-foreground">
                    {displayBarangay}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign Out"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-secondary-foreground shadow-sm transition hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* LOGOUT CONFIRMATION DRAWER */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-slate-950/45 backdrop-blur-sm animate-fadein"
          onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-border bg-white shadow-[-24px_0_60px_-24px_rgba(1,56,168,0.35)] animate-slidein"
          >
            {/* BRAND ACCENT */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-primary to-tertiary" />

            {/* HEADER */}
            <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/skledge-logo.png"
                  height={36}
                  width={36}
                  alt="SK-Ledge Logo"
                />
                <div>
                  <p className="text-sm font-bold leading-none tracking-tight text-primary-foreground">
                    SK-Ledge
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    Portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                aria-label="Close sign out confirmation"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-secondary-foreground transition hover:bg-secondary hover:text-primary-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-7">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/[0.04]">
                <LogOut className="h-6 w-6" />
              </div>

              <h3
                id="logout-title"
                className="mt-5 text-2xl font-black tracking-tight text-primary-foreground"
              >
                Sign out of your account?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
                You are about to end this session on the SK-Ledge official
                portal. You will be returned to the sign-in page.
              </p>

              {/* ACTIVE SESSION */}
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-white">
                  {resolvedAvatarUrl ? (
                    <Image
                      src={resolvedAvatarUrl}
                      alt={userName}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-primary-foreground">
                    {userName}
                  </p>
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-secondary-foreground">
                    {roleType.replace("_", " ")}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Active
                </span>
              </div>

              {/* SAFETY NOTE */}
              <div className="mt-4 flex gap-3 rounded-2xl border border-tertiary/40 bg-tertiary/10 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-secondary-foreground">
                  Your ledger records stay safe on-chain and in the database.
                  Sign in again with your registered account to continue
                  auditing or managing barangay funds.
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <footer className="space-y-2.5 border-t border-border px-6 py-5">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={confirmLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-bold text-white shadow-[0_6px_16px_-8px_rgba(220,38,38,0.6)] transition hover:bg-danger/90 active:scale-[0.98] disabled:opacity-60"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Yes, Log Out</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-secondary active:scale-[0.98] disabled:opacity-50"
              >
                Stay Signed In
              </button>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
