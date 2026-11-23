import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | SK-Ledge",
  description:
    "How SK-Ledge collects, uses, shares, and protects personal data, including Google sign-in data, under the Philippine Data Privacy Act of 2012.",
};

export default function PrivacyPolicyPage() {
  return <LegalPage document="privacy" />;
}
