"use client";

import LogoLoader from "@/components/LogoLoader";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/lib/useToast";
import {
  CircleAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  UserCheck,
  LayoutGrid,
  Loader2,
  Wallet,
  FileCheck2,
  ArrowUpRight,
} from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(() => {
    const queryError =
      searchParams.get("error") || searchParams.get("error_description");
    const hash =
      typeof window !== "undefined"
        ? window.location.hash.replace(/^#/, "")
        : "";
    const hashParams = new URLSearchParams(hash);
    const hashError =
      hashParams.get("error") || hashParams.get("error_description");
    const reason = queryError || hashError;

    if (!reason) {
      return "";
    }

    return decodeURIComponent((reason || "").replace(/\+/g, " "));
  });

  useEffect(() => {
    if (!error) {
      return;
    }

    if (error.toLowerCase().includes("database error saving new user")) {
      toast.error(
        "Supabase could not create the new Google account. This usually means the Supabase Auth tables need to be reset/reinitialized before sign-up can work again.",
      );
    } else {
      toast.error(error);
    }
  }, [error, toast]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen w-full grid-cols-1 bg-white selection:bg-tertiary selection:text-primary lg:grid-cols-2">
      {/* LEFT SIDE: BRANDING PANEL */}
      <section className="relative hidden flex-col justify-center overflow-hidden bg-primary p-12 text-white lg:flex xl:p-16">
        {/* DOT GRID */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.28) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        {/* GLOWS */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-tertiary/10 blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-lg animate-in-left motion-reduce:animate-none">
          {/* BRAND HEADER */}
          <div className="mb-8 flex items-center gap-3.5">
            <Image
              src="/skledge-logo.png"
              height={44}
              width={44}
              alt="SK-Ledge Logo"
              className="shrink-0 rounded-full object-contain"
            />
            <div>
              <p className="text-xl font-bold leading-none tracking-tight text-white">
                SK-Ledge
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-tertiary">
                Official System Portal
              </p>
            </div>
          </div>

          {/* HERO HEADLINE */}
          <h2 className="mb-4 text-3xl font-bold leading-[1.18] tracking-tight text-white xl:text-4xl">
            Smart Financial Transparency for{" "}
            <span className="text-tertiary">Youth Governance</span>
          </h2>

          {/* DESCRIPTION */}
          <p className="mb-8 text-sm font-normal leading-relaxed text-white/75 sm:text-base">
            The premier digital backbone for Sangguniang Kabataan auditing and
            resource management. Secure. Transparent. Automated.
          </p>

          {/* FEATURE LIST */}
          <div className="relative mb-6">
            <div
              aria-hidden
              className="absolute bottom-4 left-[19px] top-4 w-px bg-white/15"
            />
            <div className="space-y-5">
              {[
                {
                  icon: Wallet,
                  title: "Transparent Fund & Project Ledger",
                  description:
                    "Track youth allocations and barangay disbursements with clear audit visibility.",
                },
                {
                  icon: ShieldCheck,
                  title: "Role-Based Official Access",
                  description:
                    "Strictly verified credentials for Sangguniang Kabataan officers and administrators.",
                },
                {
                  icon: FileCheck2,
                  title: "Audit-Ready Records",
                  description:
                    "Every transaction is anchored on-chain with an immutable verification trail.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3.5">
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] backdrop-blur-sm">
                    <item.icon className="h-4 w-4 text-tertiary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/65">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BRAND STATS */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { value: "12+", label: "Barangays" },
              { value: "1K+", label: "Records" },
              { value: "100%", label: "On-chain" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-sm"
              >
                <p className="text-lg font-black tabular-nums text-white">
                  {stat.value}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* TRUST BADGES */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <span className="text-xs font-semibold text-white/95 sm:text-sm">
                Verified Official Accounts
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3.5">
              <Lock className="h-4 w-4 shrink-0 text-tertiary" />
              <span className="text-xs font-semibold text-white/95 sm:text-sm">
                End-to-End Encryption
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE: LOGIN WORKSPACE */}
      <section className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-white px-6 py-8 sm:px-12 lg:px-16 xl:px-20">
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-tertiary/[0.08] blur-3xl" />
        <div
          aria-hidden
          className="ledger-grid pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        />

        {/* TOP BAR */}
        <div className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between animate-rise motion-reduce:animate-none">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
              SK-Ledge Access Portal
            </span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-foreground/60">
            Batangas Province
          </span>
        </div>

        {/* CENTER CONTENT */}
        <div className="relative z-10 mx-auto my-auto w-full max-w-lg py-10">
          {/* MOBILE LOGO HEADER */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Image
              src="/skledge-logo.png"
              height={38}
              width={38}
              alt="SK-Ledge Logo"
              className="shrink-0 rounded-full object-contain"
            />
            <div>
              <p className="text-base font-bold leading-none text-primary-foreground">
                SK-Ledge
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-primary">
                Official System Portal
              </p>
            </div>
          </div>

          {/* HEADER */}
          <div className="mb-7 animate-rise motion-reduce:animate-none">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
              Authentication
            </p>
            <h1 className="mt-1.5 text-3xl font-black tracking-tight text-primary-foreground sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary-foreground">
              Sign in with your registered Google account to open your official
              SK-Ledge workspace.
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
              <p className="text-sm font-medium leading-snug text-danger">
                {error}
              </p>
            </div>
          )}

          {/* GOOGLE SIGN-IN BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-primary/30 hover:bg-secondary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#4285F4"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowUpRight className="h-4 w-4 text-secondary-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary-foreground/70">
            <Lock className="h-3 w-3" />
            Authorized personnel only · Secure OAuth
          </p>

          {/* ACCESS STEPS */}
          <div className="mt-7 rounded-2xl border border-border/80 bg-secondary/25 p-4 animate-rise motion-reduce:animate-none sm:p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-foreground/70">
              How Portal Access Works
            </p>

            <ol className="space-y-3">
              {[
                {
                  icon: UserCheck,
                  title: "Authenticate",
                  description: "Sign in with your official Google email",
                },
                {
                  icon: ShieldCheck,
                  title: "Verification",
                  description: "System checks your SK credentials",
                },
                {
                  icon: LayoutGrid,
                  title: "Portal Access",
                  description: "Manage records & governance",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary-foreground">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-secondary-foreground">
                      {step.description}
                    </p>
                  </div>
                  <step.icon className="ml-auto h-3.5 w-3.5 shrink-0 text-secondary-foreground/40" />
                </li>
              ))}
            </ol>
          </div>

          {/* REGISTER PROMPT CARD */}
          <div className="mt-4 rounded-2xl border border-border/80 bg-secondary/35 p-4 animate-rise motion-reduce:animate-none sm:p-5">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="text-center sm:text-left">
                <p className="text-xs font-medium text-secondary-foreground">
                  No official account yet?
                </p>
                <p className="mt-0.5 text-base font-bold tracking-tight text-primary-foreground">
                  Request portal access
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="group inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 active:scale-95 sm:w-auto"
              >
                Apply Now
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <footer className="relative z-10 mx-auto w-full max-w-lg text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-foreground/60">
            &copy; {new Date().getFullYear()} National Youth Governance Portal
            &bull; Authorized Personnel Only
          </p>
        </footer>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LogoLoader />}>
      <LoginPageContent />
    </Suspense>
  );
}