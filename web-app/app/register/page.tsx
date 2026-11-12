"use client";

import LogoLoader from "@/components/LogoLoader";
import Image from "next/image";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useFormStore } from "@/lib/useFormStore";
import { useToast } from "@/lib/useToast";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  UserCheck,
  FileCheck2,
  LayoutDashboard,
} from "lucide-react";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const isLoading = useFormStore((state) => state.register.isLoading);
  const setRegisterError = useFormStore((state) => state.setRegisterError);
  const setRegisterIsLoading = useFormStore(
    (state) => state.setRegisterIsLoading,
  );

  useEffect(() => {
    const queryError =
      searchParams.get("error") || searchParams.get("error_description");
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const hashError =
      hashParams.get("error") ||
      hashParams.get("error_description") ||
      hashParams.get("error_code");
    const reason = queryError || hashError;

    if (!reason) {
      return;
    }

    const message = decodeURIComponent((reason || "").replace(/\+/g, " "));
    setRegisterError(message);
    toast.error(message);
  }, [searchParams, toast, setRegisterError]);

  const handleGoogleSignIn = async () => {
    setRegisterIsLoading(true);
    setRegisterError("");

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
      setRegisterError(message);
      toast.error(message);
      setRegisterIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-dvh w-full animate-fadein overflow-x-hidden bg-white lg:h-dvh lg:grid-cols-2 lg:overflow-hidden selection:bg-tertiary selection:text-primary">
      {/* LEFT SIDE: BALANCED REGISTRATION PANEL */}
      <section className="relative flex min-h-dvh flex-col justify-between overflow-hidden bg-white px-5 py-6 sm:px-8 lg:h-full lg:min-h-0 lg:px-8 lg:py-9 xl:px-10 xl:py-11">
        {/* SUBTLE DECORATIVE ACCENTS */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl" />

        {/* TOP BAR */}
        <div className="relative mx-auto flex w-full max-w-xl shrink-0 items-center justify-center lg:justify-between">
          {/* MOBILE LOGO */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <ShieldCheck className="h-5 w-5 text-tertiary" />
            </div>
            <div>
              <p className="text-base font-bold leading-none tracking-tight text-primary-foreground">
                SK-Ledge Portal
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                Official System Registration
              </p>
            </div>
          </div>

          {/* DESKTOP PORTAL PILL BADGE */}
          <div className="hidden items-center gap-2 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 lg:inline-flex">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary-foreground">
              SK-Ledge Access Portal
            </span>
          </div>

          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground/60 lg:inline">
            Batangas Province
          </span>
        </div>

        {/* CENTERED FORM CONTENT */}
        <div className="relative mx-auto my-auto w-full max-w-xl py-2">
          {/* HEADER */}
          <div className="mb-5 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Registration
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Create Account
            </h1>
            <p className="mt-1.5 text-sm text-secondary-foreground">
              Register your official SK-Ledge portal access using your Google
              account.
            </p>
          </div>

          {/* GOOGLE SIGN-IN */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-5 py-4 text-sm font-bold text-primary-foreground shadow-[0_2px_6px_rgba(15,23,42,0.05)] transition-all hover:border-primary/40 hover:bg-secondary hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            <span>
              {isLoading ? "Connecting to Google..." : "Sign Up with Google"}
            </span>
          </button>

          {/* 3-STEP ONBOARDING FLOW */}
          <div className="mt-5 rounded-2xl border border-border/80 bg-secondary/30 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-foreground/80">
              How Portal Access Works
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/60 bg-white p-3.5">
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserCheck className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-primary-foreground">
                  1. Authenticate
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-secondary-foreground">
                  Sign in with your Google email
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-white p-3.5">
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-primary-foreground">
                  2. Verification
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-secondary-foreground">
                  Admin reviews SK credentials
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-white p-3.5">
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-primary-foreground">
                  3. Portal Access
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-secondary-foreground">
                  Manage records &amp; governance
                </p>
              </div>
            </div>
          </div>

          {/* LOGIN PROMPT */}
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-secondary/40 p-4 sm:px-5 sm:py-4">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="text-center sm:text-left">
                <p className="text-xs font-medium text-secondary-foreground">
                  Already have an official account?
                </p>
                <p className="text-sm font-extrabold tracking-tight text-primary-foreground sm:text-base">
                  Access your dashboard
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="group inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 active:scale-95"
              >
                Login Now{" "}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <footer className="relative mx-auto w-full max-w-xl shrink-0 text-center lg:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-foreground/60">
            &copy; 2026 National Youth Governance Portal &bull; Authorized
            Personnel Only
          </p>
        </footer>
      </section>

      {/* RIGHT SIDE: BALANCED BRANDING PANEL */}
      <section className="relative hidden overflow-hidden bg-primary lg:flex lg:h-full lg:flex-col lg:px-8 lg:py-9 xl:px-10 xl:py-11">
        {/* BACKGROUND DOT GRID & GLOWS */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-tertiary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        {/* CENTER HERO & BRAND LOCKUP */}
        <div className="relative mx-auto my-auto w-full max-w-xl py-2">
          {/* BRAND LOCKUP (NO WHITE BOX) */}
          <div className="mb-6 flex items-center gap-3.5">
            <Image
              src="/skledge-logo.png"
              height={44}
              width={44}
              alt="SK-Ledge Logo"
              className="shrink-0 object-contain"
            />
            <div>
              <p className="text-xl font-bold leading-none tracking-tight text-white">
                SK-Ledge
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-tertiary">
                Official System Portal
              </p>
            </div>
          </div>

          <h2 className="mb-3.5 text-4xl font-bold leading-[1.15] tracking-tight text-white xl:text-[42px]">
            Empower{" "}
            <span className="text-tertiary">Youth Governance</span> across
            Batangas
          </h2>

          <p className="mb-6 text-sm font-medium leading-relaxed text-white/80 xl:text-base">
            Join the growing network of SK officials using SK-Ledge to drive
            transparency, accountability, and real progress for the Batangueño
            youth.
          </p>

          {/* SYSTEM HIGHLIGHTS CARD */}
          <div className="space-y-3.5 rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tertiary" />
              <div>
                <p className="text-sm font-bold text-white">
                  Transparent Fund &amp; Project Ledger
                </p>
                <p className="mt-0.5 text-xs text-white/70">
                  Track youth allocations and barangay disbursements with clear
                  audit visibility.
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-white/10" />

            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tertiary" />
              <div>
                <p className="text-sm font-bold text-white">
                  Role-Based Official Access
                </p>
                <p className="mt-0.5 text-xs text-white/70">
                  Strictly verified credentials for Sangguniang Kabataan
                  officers and administrators.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM TRUST BADGES */}
        <div className="relative mx-auto grid w-full max-w-xl shrink-0 grid-cols-2 gap-3.5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <p className="text-xs font-semibold text-white/95 xl:text-sm">
              Verified Official Accounts
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <Lock className="h-5 w-5 shrink-0 text-tertiary" />
            <p className="text-xs font-semibold text-white/95 xl:text-sm">
              End-to-End Encryption
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LogoLoader />}>
      <RegisterPageContent />
    </Suspense>
  );
}