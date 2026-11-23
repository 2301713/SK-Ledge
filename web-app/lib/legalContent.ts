/**
 * Single source of truth for the public legal pages (/terms and /privacy).
 * Both the standalone pages and any in-app link read from here.
 */

export type LegalDocument = "terms" | "privacy";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalContent {
  label: string;
  title: string;
  summary: string;
  sections: LegalSection[];
}

export const LAST_UPDATED = "November 20, 2026";

export const LEGAL_CONTENT: Record<LegalDocument, LegalContent> = {
  terms: {
    label: "Terms of Service",
    title: "Terms of Service",
    summary:
      "The rules for using SK-Ledge: who may sign in, what you may do with the platform, how on-chain records behave, and the limits of our liability.",
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
    summary:
      "What personal data SK-Ledge collects (including Google sign-in data), how it is used, shared, and protected, and the rights you hold under the Philippine Data Privacy Act of 2012.",
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
        title: "Google Sign-In and Google User Data",
        paragraphs: [
          "You sign in with Google. When you do, Google shares your basic profile with us: your name, email address, and profile picture. We request only the openid, email, and profile scopes — we do not request access to Gmail, Drive, Calendar, Contacts, or any other Google service.",
          "We use that information only to create and identify your SK-Ledge account, display your name and avatar, send account-related notices, and enforce role-based access. We do not sell Google user data, use it for advertising, or use it to train machine-learning models.",
          "Google user data is stored with our database provider and kept while your account exists. You can revoke SK-Ledge's access at any time from your Google Account permissions page, and you can ask us to delete your account data at hello@skledge.ph. SK-Ledge's use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.",
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
