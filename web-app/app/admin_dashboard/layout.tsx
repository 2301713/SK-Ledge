import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | SK-Ledge",
  description:
    "Administrators manage user accounts and approvals for SK-Ledge.",
};

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
