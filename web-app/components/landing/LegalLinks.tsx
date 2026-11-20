"use client";

import { useState } from "react";
import LegalModal, { type LegalDocument } from "./LegalModal";

const LEGAL_LINKS: { label: string; document: LegalDocument }[] = [
  { label: "Terms of Service", document: "terms" },
  { label: "Privacy Policy", document: "privacy" },
];

export default function LegalLinks() {
  const [openDocument, setOpenDocument] = useState<LegalDocument | null>(null);

  return (
    <>
      <ul className="space-y-2.5 text-sm">
        {LEGAL_LINKS.map((link) => (
          <li key={link.document}>
            <button
              type="button"
              onClick={() => setOpenDocument(link.document)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>

      {openDocument ? (
        <LegalModal
          initialDocument={openDocument}
          onClose={() => setOpenDocument(null)}
        />
      ) : null}
    </>
  );
}
