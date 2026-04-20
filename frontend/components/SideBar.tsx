"use client"; // Required for interactivity (logout button) and routing hooks

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAccount } from "@/app/dashboard/types";
import { supabase } from "@/lib/supabase";

export default function Sidebar({ user }: { user: UserAccount }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
    console.log("Logging out...");
  };

  const getRoleLabel = (role: string) => {
    if (role === "SK_Chairperson") {
      return "SK Chairperson";
    } else if (role === "SK_Treasurer") {
      return "SK Treasurer";
    } else {
      return "SK Official";
    }
  };

  return (
    <aside className="w-64 bg-indigo-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 text-2xl font-bold border-b border-indigo-800 tracking-tight">
        SK-Ledge{" "}
        <span className="text-xs block font-normal text-indigo-400">
          Governance Portal
        </span>
      </div>

      <div className="p-6 flex items-center space-x-3 border-b border-indigo-800/50">
        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold">
          {user.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold truncate w-32">{user.name}</p>
          <p className="text-xs text-indigo-300">{getRoleLabel(user.role)}</p>
        </div>
      </div>

      <nav className="grow p-4 space-y-1">
        {/* Next.js Link prevents full page reloads */}
        <Link
          href="/dashboard"
          className={`flex items-center p-2 rounded-md transition-colors ${pathname === "/dashboard" ? "bg-indigo-800 text-white" : "text-indigo-200 hover:bg-indigo-800 hover:text-white"}`}
        >
          <i className="fas fa-th-large w-6"></i> Dashboard
        </Link>
        <Link
          href="/dashboard/projects"
          className={`flex items-center p-2 rounded-md transition-colors ${pathname === "/dashboard/projects" ? "bg-indigo-800 text-white" : "text-indigo-200 hover:bg-indigo-800 hover:text-white"}`}
        >
          <i className="fas fa-tasks w-6"></i> Projects
        </Link>
        <Link
          href="/dashboard/upload"
          className={`flex items-center p-2 rounded-md transition-colors ${pathname === "/dashboard/upload" ? "bg-indigo-800 text-white" : "text-indigo-200 hover:bg-indigo-800 hover:text-white"}`}
        >
          <i className="fas fa-cloud-upload-alt w-6"></i> Upload Files
        </Link>
      </nav>

      <div className="p-4 bg-indigo-950">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center p-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white transition-all"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> Sign Out
        </button>
      </div>
    </aside>
  );
}
