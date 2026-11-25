import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, Mail, ShieldCheck } from "lucide-react";
import {
  LAST_UPDATED,
  LEGAL_CONTENT,
  type LegalDocument,
} from "@/lib/legalContent";

const DOCUMENTS: LegalDocument[] = ["terms", "privacy"];

const ICONS: Record<LegalDocument, typeof FileText> = {
  terms: FileText,
  privacy: ShieldCheck,
};

/**
 * Public, login-free shell for the legal pages. These URLs are the ones
 * registered with Google Cloud branding, so they must stay reachable
 * without a session and render their full text on first paint.
 */
export default function LegalPage({ document }: { document: LegalDocument }) {
  const content = LEGAL_CONTENT[document];
  const Icon = ICONS[document];
  const other = LEGAL_CONTENT[document === "terms" ? "privacy" : "terms"];
  const otherHref = document === "terms" ? "/privacy" : "/terms";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <header className="border-b border-white/8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/skledge-logo.png"
              width={30}
              height={30}
              alt="SK-Ledge Logo"
            />
            <span className="text-base font-extrabold tracking-tight text-white">
              SK-Ledge
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-xs font-semibold">
            {DOCUMENTS.map((doc) => (
              <Link
                key={doc}
                href={doc === "terms" ? "/terms" : "/privacy"}
                aria-current={doc === document ? "page" : undefined}
                className={`rounded-xl px-3 py-2 transition-colors ${
                  doc === document
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/8 hover:text-white"
                }`}
              >
                {LEGAL_CONTENT[doc].label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        <div className="mt-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tertiary/15">
            <Icon className="h-6 w-6 text-tertiary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              SK-Ledge Legal
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {content.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Last updated {LAST_UPDATED}
            </p>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-400">
          {content.summary}
        </p>

        <div className="mt-10 space-y-8">
          {content.sections.map((section, index) => (
            <section
              key={section.title}
              id={`section-${index + 1}`}
              className="scroll-mt-8"
            >
              <h2 className="flex items-baseline gap-2.5 text-base font-bold text-white">
                <span className="text-[11px] font-black tabular-nums text-tertiary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-2.5 text-sm leading-relaxed text-slate-400"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2.5 text-sm leading-relaxed text-slate-400"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-tertiary"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/8 bg-slate-900/60 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Mail className="h-4 w-4 text-tertiary" />
            Questions about this document?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Email{" "}
            <a
              href="mailto:2301713@ub.edu.ph"
              className="text-slate-300 underline decoration-tertiary/40 underline-offset-2 transition-colors hover:text-white"
            >
              2301713@ub.edu.ph
            </a>{" "}
            or write to SK-Ledge, Corner Dona Aurelia, Batangas City, 4200
            Batangas, Philippines.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            You may also want to read our{" "}
            <Link
              href={otherHref}
              className="font-semibold text-slate-300 underline decoration-tertiary/40 underline-offset-2 transition-colors hover:text-white"
            >
              {other.label}
            </Link>
            .
          </p>
        </div>
      </main>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} SK-Ledge. All rights reserved.
          </p>
          <nav className="flex items-center gap-4">
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/login" className="transition-colors hover:text-white">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
