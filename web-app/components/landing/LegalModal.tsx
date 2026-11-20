"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, ShieldCheck, X } from "lucide-react";

export type LegalDocument = "terms" | "privacy";

interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface LegalContent {
  label: string;
  title: string;
  icon: typeof FileText;
  sections: LegalSection[];
}

const LAST_UPDATED = "November 20, 2026";

const LEGAL_CONTENT: Record<LegalDocument, LegalContent> = {
  terms: {
    label: "Terms of Service",
    title: "Terms of Service",
    icon: FileText,
    sections: [
      {
        title: "Acceptance of Terms",
        paragraphs: [
          "These Terms of Service govern your access to and use of SK-Ledge (the \u201cPlatform\u201d), including the landing page, web application, public transparency dashboard, and related services. By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.",
        ],
      },
      {
        title: "About the Platform",
        paragraphs: [
          "SK-Ledge is a financial transparency and records-management platform built for Sangguniang Kabataan (SK) governance in the Philippines. It helps authorized users record budgets, disbursements, and supporting documents, and publish transparency information to a public dashboard.",
          "SK-Ledge is not a bank, payment processor, accounting firm, or government agency. Information published through the Platform does not replace official financial statements or records required by law.",
        ],
      },
      {
        title: "Eligibility and Account Responsibilities",
        paragraphs: [
          "The Platform is intended for SK officials, government personnel, auditors, and other users authorized by their respective offices.",
        ],
        bullets: [
          "Provide accurate, current, and complete information when registering or using the Platform.",
          "Keep your login credentials and wallet keys secure and confidential.",
          "Notify us immediately if you suspect unauthorized access to your account or wallet.",
          "You are responsible for all activity performed through your account or connected wallet.",
        ],
      },
      {
        title: "Acceptable Use",
        paragraphs: ["You agree not to use the Platform to:"],
        bullets: [
          "Submit false, misleading, or fraudulent financial records or supporting documents.",
          "Upload malicious code, attempt unauthorized access, or interfere with the Platform\u2019s operation.",
          "Scrape, copy, or resell Platform data except as expressly permitted.",
          "Impersonate another person or misrepresent your affiliation with any office or entity.",
          "Violate any applicable law, including Philippine data privacy and anti-corruption laws.",
        ],
      },
      {
        title: "Records, Blockchain, and Immutability",
        paragraphs: [
          "Certain transaction references and integrity proofs may be recorded on a public blockchain. On-chain records are permanent, publicly visible, and cannot be edited or deleted by SK-Ledge.",
          "Off-chain records are stored with our service providers. You are responsible for verifying the accuracy of all information before it is recorded or published, since some entries may become irreversible once committed to the ledger.",
        ],
      },
      {
        title: "Third-Party Services",
        paragraphs: [
          "The Platform relies on third-party services, including hosting and database providers, wallet providers, and blockchain networks. Your use of those services may be subject to their own terms and privacy policies. We are not responsible for third-party outages, fees, or losses.",
        ],
      },
      {
        title: "Intellectual Property",
        paragraphs: [
          "The Platform, including its software, design, and branding, is owned by SK-Ledge and its licensors and is protected by applicable intellectual property laws. We grant you a limited, non-exclusive, non-transferable license to use the Platform for its intended purpose.",
          "You retain ownership of content you submit. By submitting content, you grant us a license to host, process, and display it as necessary to operate the Platform and provide public transparency.",
        ],
      },
      {
        title: "Disclaimers",
        paragraphs: [
          "The Platform is provided \u201cas is\u201d and \u201cas available.\u201d We do not warrant that it will be uninterrupted, error-free, or that the data it contains will satisfy any audit, legal, or regulatory requirement. Transparency information is provided for public awareness and should not be treated as an official government financial statement.",
        ],
      },
      {
        title: "Limitation of Liability",
        paragraphs: [
          "To the maximum extent permitted by law, SK-Ledge and its officers, employees, and partners will not be liable for any indirect, incidental, special, or consequential damages, including loss of funds, data, or goodwill, arising from unauthorized access, blockchain network issues, or your use of or inability to use the Platform.",
          "Our aggregate liability for any claim arising from these Terms will not exceed the amount you paid to use the Platform, if any, in the twelve months preceding the claim.",
        ],
      },
      {
        title: "Termination and Suspension",
        paragraphs: [
          "We may suspend or terminate your access if you violate these Terms, pose a security risk, or if required by law or by the office that authorized your access. We may also modify or discontinue the Platform. Provisions that by their nature should survive termination will remain in effect.",
        ],
      },
      {
        title: "Changes to These Terms",
        paragraphs: [
          "We may update these Terms from time to time. The updated version will be posted with a new effective date. Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms.",
        ],
      },
      {
        title: "Governing Law and Disputes",
        paragraphs: [
          "These Terms are governed by the laws of the Republic of the Philippines. Any dispute will be subject to the exclusive jurisdiction of the courts of Batangas City, after a good-faith attempt to resolve the matter amicably with us.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "For questions about these Terms, contact us at hello@skledge.ph or write to SK-Ledge, Corner Dona Aurelia, Batangas City, 4200 Batangas, Philippines.",
        ],
      },
    ],
  },
  privacy: {
    label: "Privacy Policy",
    title: "Privacy Policy",
    icon: ShieldCheck,
    sections: [
      {
        title: "Introduction",
        paragraphs: [
          "SK-Ledge respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use the Platform, in accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules and Regulations, and applicable issuances of the National Privacy Commission (NPC).",
        ],
      },
      {
        title: "Information We Collect",
        paragraphs: ["We collect the following categories of information:"],
        bullets: [
          "Account information such as your name, email address, role, barangay or office affiliation, and profile details.",
          "Authentication and wallet data, including wallet addresses, signatures, and session metadata.",
          "Financial and governance records, including budgets, expenses, payees, supporting documents, and audit findings submitted through the Platform.",
          "Usage and technical data such as IP address, browser and device information, pages visited, and timestamps.",
        ],
      },
      {
        title: "How We Use Information",
        paragraphs: ["We use information to:"],
        bullets: [
          "Operate the Platform, authenticate users, and secure accounts.",
          "Record and publish transparency data on the public dashboard as intended.",
          "Support auditing, reporting, and accountability workflows.",
          "Respond to inquiries and provide technical support.",
          "Detect, prevent, and address fraud, security incidents, and abuse.",
          "Comply with legal obligations and lawful requests of competent authorities.",
          "Improve and maintain the Platform\u2019s features and performance.",
        ],
      },
      {
        title: "Legal Basis for Processing",
        paragraphs: [
          "We process personal data based on consent, the performance of our agreement with you, compliance with legal obligations, our legitimate interests in operating and securing the Platform, and the public interest in government transparency and accountability.",
          "Where processing is based on consent, you may withdraw it at any time. Withdrawal may limit certain features and cannot affect processing that has already occurred or records that must be retained by law.",
        ],
      },
      {
        title: "Blockchain and Public Transparency",
        paragraphs: [
          "Wallet addresses, transaction hashes, and integrity references may be visible on the public dashboard and on public blockchain networks. Blockchain records are immutable and generally cannot be erased.",
          "Please do not submit personal information into fields intended for public disclosure. Information you make public through the Platform may be accessed by others and may remain publicly available even after your account is closed.",
        ],
      },
      {
        title: "Sharing and Disclosure",
        paragraphs: [
          "We do not sell personal data. We may share information with service providers that support hosting, database, wallet, blockchain, and email services; with authorized SK, government, or audit personnel as required by their functions; through the public transparency dashboard as designed; with competent authorities when required by law; and in connection with a merger, acquisition, or transfer of the Platform.",
          "Service providers are required to process information only as necessary to provide their services and to maintain appropriate confidentiality and security.",
        ],
      },
      {
        title: "Data Retention",
        paragraphs: [
          "We retain personal data while your account is active and for as long as necessary to fulfill the purposes described in this policy, including legal, audit, transparency, and recordkeeping requirements under Philippine law. When data is no longer needed, we delete or anonymize it.",
          "Because blockchain records are immutable, SK-Ledge cannot delete or alter information that has been written to a public blockchain.",
        ],
      },
      {
        title: "Security",
        paragraphs: [
          "We implement administrative, technical, and physical safeguards designed to protect information against unauthorized access, alteration, or disclosure. These include access controls, encryption in transit, document hashing, wallet-based authentication, and monitoring.",
          "No system is completely secure. If you believe your account or a Platform record has been compromised, contact us immediately at hello@skledge.ph. Government offices may also have separate obligations to notify the NPC and affected individuals of personal data breaches.",
        ],
      },
      {
        title: "Your Rights",
        paragraphs: [
          "Subject to the Data Privacy Act, you have the right to be informed, to object to processing, to access your data, to correct inaccurate data, to request erasure or blocking, to claim damages, to data portability, and to file a complaint with the National Privacy Commission.",
          "To exercise your rights, contact us at hello@skledge.ph. We may need to verify your identity before acting on your request. Some requests may be limited by legal retention obligations, audit requirements, and the immutable nature of blockchain records.",
        ],
      },
      {
        title: "Cookies and Local Storage",
        paragraphs: [
          "We use essential cookies and local storage to keep you signed in, remember preferences, and protect the Platform. We may use limited analytics to understand usage and improve the service. You can manage cookies through your browser settings, but disabling essential cookies may prevent you from using certain features.",
        ],
      },
      {
        title: "Children\u2019s Privacy",
        paragraphs: [
          "The Platform is intended for authorized SK officials, government personnel, and other authorized users. It is not directed to children, and we do not knowingly collect personal data from children except as part of authorized SK records submitted through the Platform.",
        ],
      },
      {
        title: "Changes to This Privacy Policy",
        paragraphs: [
          "We may update this Privacy Policy from time to time. The revised version will be posted with a new effective date. Significant changes will be communicated through the Platform where appropriate.",
        ],
      },
      {
        title: "Contact and Data Protection",
        paragraphs: [
          "For privacy questions, requests, or concerns, contact our data protection team at hello@skledge.ph or write to SK-Ledge, Corner Dona Aurelia, Batangas City, 4200 Batangas, Philippines. You may also contact the National Privacy Commission at complaints@privacy.gov.ph.",
        ],
      },
    ],
  },
};

interface LegalModalProps {
  initialDocument: LegalDocument;
  onClose: () => void;
}

export default function LegalModal({
  initialDocument,
  onClose,
}: LegalModalProps) {
  const [activeDocument, setActiveDocument] =
    useState<LegalDocument>(initialDocument);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const content = LEGAL_CONTENT[activeDocument];
  const Icon = content.icon;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => previouslyFocused?.focus();
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeDocument]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="animate-fadein flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40 motion-reduce:animate-none">
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary/15">
              <Icon className="h-5 w-5 text-tertiary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Legal
              </p>
              <h2
                id="legal-modal-title"
                className="text-lg font-extrabold tracking-tight text-white sm:text-xl"
              >
                {content.title}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Last updated {LAST_UPDATED}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close legal dialog"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-white/8 px-6 sm:px-8">
          {(Object.keys(LEGAL_CONTENT) as LegalDocument[]).map((document) => (
            <button
              key={document}
              type="button"
              onClick={() => setActiveDocument(document)}
              aria-current={
                activeDocument === document ? "page" : undefined
              }
              className={`-mb-px border-b-2 px-1 py-3 text-xs font-bold transition-colors ${
                activeDocument === document
                  ? "border-tertiary text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {LEGAL_CONTENT[document].label}
            </button>
          ))}
        </div>

        <div
          ref={scrollRef}
          className="thin-scrollbar overflow-y-auto px-6 py-6 sm:px-8"
        >
          <div className="space-y-6">
            {content.sections.map((section, index) => (
              <section key={section.title}>
                <h3 className="flex items-baseline gap-2 text-sm font-bold text-white">
                  <span className="text-[10px] font-black tabular-nums text-tertiary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h3>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-2 text-xs leading-relaxed text-slate-400"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-2 space-y-1.5">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-2 text-xs leading-relaxed text-slate-400"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-tertiary"
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/8 bg-slate-900/50 px-6 py-4 sm:px-8">
          <p className="text-xs text-slate-500">
            Questions?{" "}
            <a
              href="mailto:hello@skledge.ph"
              className="text-slate-300 transition-colors hover:text-white"
            >
              hello@skledge.ph
            </a>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
