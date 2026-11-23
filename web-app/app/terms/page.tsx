import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | SK-Ledge",
  description:
    "The terms that govern access to and use of the SK-Ledge platform, including account responsibilities, blockchain records, and liability.",
};

export default function TermsOfServicePage() {
  return <LegalPage document="terms" />;
}
