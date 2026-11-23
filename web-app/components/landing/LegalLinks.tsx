import Link from "next/link";

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

export default function LegalLinks() {
  return (
    <ul className="space-y-2.5 text-sm">
      {LEGAL_LINKS.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
