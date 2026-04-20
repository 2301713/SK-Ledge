import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SK-Ledge",
  description:
    "A Blockchain-Based for Secure SK Fund Tracking and Automated Audit Reporting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className=" h-full antialiased"
      style={{ fontFamily: "Inter,sans-serif" }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
