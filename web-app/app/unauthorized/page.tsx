import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Home,
  LockKeyhole,
  ShieldX,
  UserX,
  type LucideIcon,
} from "lucide-react";

type PageReason = "approval_pending" | "role" | "profile_unavailable";

type ReasonDetails = {
  badge: string;
  title: string;
  message: string;
  support: string;
  icon: LucideIcon;
};

const DETAILS: Record<PageReason | "default", ReasonDetails> = {
  approval_pending: {
    badge: "Account pending",
    title: "Approval still in progress",
    message:
      "Your account has been created, but it has not been approved yet. Dashboard access unlocks as soon as your registration is reviewed.",
    support:
      "Need an update? Reach out to your SK administrator to review your registration.",
    icon: Clock3,
  },
  role: {
    badge: "Access restricted",
    title: "This dashboard isn’t assigned to you",
    message:
      "You’re signed in successfully, but your account role doesn’t have permission to open this page.",
    support:
      "If you believe you should have access, ask your administrator to update your role assignment.",
    icon: ShieldX,
  },
  profile_unavailable: {
    badge: "Profile unavailable",
    title: "We couldn’t load your profile",
    message:
      "Something went wrong while reading your account details, so we can’t verify your permissions right now.",
    support:
      "Try signing in again. If the problem persists, contact your SK administrator.",
    icon: UserX,
  },
  default: {
    badge: "Access restricted",
    title: "You don’t have access to this page",
    message:
      "Your account doesn’t have the required permissions to view this area of the portal.",
    support:
      "If you believe this is a mistake, contact your SK administrator to review your access.",
    icon: ShieldX,
  },
};

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawReason = Array.isArray(params.reason)
    ? params.reason[0]
    : params.reason;
  const details =
    rawReason && rawReason in DETAILS
      ? DETAILS[rawReason as PageReason]
      : DETAILS.default;
  const StatusIcon = details.icon;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16 selection:bg-tertiary selection:text-primary">
      <div aria-hidden className="ledger-grid pointer-events-none absolute inset-0" />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/4 h-80 w-80 rounded-full bg-primary/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-1/4 h-72 w-72 rounded-full bg-quaternary/10 blur-3xl"
      />

      <div className="relative w-full max-w-md animate-rise motion-reduce:animate-none">
        <div className="mb-8 flex items-center justify-center gap-3.5">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-[22px] bg-primary/15 blur-lg"
            />
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-[0_14px_30px_-18px_rgba(1,56,168,0.55)]">
              <Image
                src="/skledge-logo.png"
                alt="SK-Ledge logo"
                width={56}
                height={56}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-quaternary text-white">
              <LockKeyhole className="h-3 w-3" strokeWidth={2.5} />
            </span>
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              SK-Ledge
            </p>
            <p className="mt-1 text-sm font-semibold tracking-tight text-primary-foreground">
              Secure Ledger Portal
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-white/90 shadow-[0_30px_80px_-44px_rgba(1,56,168,0.55)] backdrop-blur">
          <div
            aria-hidden
            className="h-1.5 w-full bg-gradient-to-r from-quaternary via-tertiary to-quaternary"
          />

          <div className="px-8 pb-8 pt-9 text-center sm:px-9">
            <span className="inline-flex items-center gap-2 rounded-full border border-quaternary/20 bg-quaternary/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-quaternary">
              <span className="h-1.5 w-1.5 rounded-full bg-quaternary" />
              {details.badge} · 403
            </span>

            <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-quaternary/15 bg-quaternary/[0.06] text-quaternary">
              <StatusIcon className="h-7 w-7" strokeWidth={1.75} />
            </div>

            <h1 className="mt-5 text-2xl font-black tracking-tight text-primary-foreground">
              {details.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-secondary-foreground">
              {details.message}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_-18px_rgba(1,56,168,0.9)] transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Return to login
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:border-primary/30 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Home className="h-4 w-4" />
                Back to home
              </Link>
            </div>

            <p className="mt-6 border-t border-border pt-5 text-xs leading-5 text-secondary-foreground">
              {details.support}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-foreground/80">
          <span className="h-1 w-1 rounded-full bg-tertiary" />
          Sepolia ledger
          <span className="h-1 w-1 rounded-full bg-border" />
          Permission-controlled access
        </div>
      </div>
    </main>
  );
}
