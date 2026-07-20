import type { Metadata } from "next";
import { Inter } from "next/font/google";
import RootLayoutWrapper from "./RootLayoutWrapper";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SK-Ledge",
  description:
    "A Blockchain-Based for Secure SK Fund Tracking and Automated Audit Reporting",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.className}`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <RootLayoutWrapper>{children}</RootLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
