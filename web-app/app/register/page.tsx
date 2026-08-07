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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-8 selection:bg-tertiary selection:text-primary">
      {/* DECORATIVE BACKGROUND */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-tertiary/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/[0.03] blur-3xl" />

      <div className="relative grid w-full max-w-5xl animate-fadein overflow-hidden rounded-3xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] lg:grid-cols-2">
        {/* LEFT SIDE: REGISTRATION FORM */}
        <section className="order-2 flex flex-col justify-center bg-white p-8 sm:p-12 lg:p-14 lg:order-1">
          {/* MOBILE BRANDING HEADER */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
              <ShieldCheck className="h-7 w-7 text-tertiary" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none tracking-tight text-primary-foreground">
                SK-Ledge Portal
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                Official System Registration
              </p>
            </div>
          </div>

          {/* HEADER */}
          <div className="mb-8 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Registration
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-primary-foreground">
              Create Account
            </h2>
            <p className="mt-1.5 text-sm text-secondary-foreground">
              Register your official SK-Ledge portal access.
            </p>
          </div>

          {/* GOOGLE SIGN-IN */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-primary/30 hover:bg-secondary hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
            <span>Sign Up with Google</span>
          </button>

          <p className="mt-5 text-center text-xs text-secondary-foreground">
            Sign-up uses your official Google account. An administrator will
            approve your access.
          </p>

          {/* LOGIN PROMPT */}
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-secondary-foreground">
                  Already have an official account?
                </p>
                <p className="text-base font-extrabold tracking-tight text-primary-foreground">
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

          {/* FOOTER */}
          <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-secondary-foreground/60">
            &copy; 2026 National Youth Governance Portal <br />
            Authorized Personnel Only
          </p>
        </section>

        {/* RIGHT SIDE: BRANDING PANEL */}
        <section className="relative order-1 overflow-hidden bg-primary p-8 sm:p-12 lg:p-14 lg:order-2">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          ></div>
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-tertiary/10 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>

          <div className="relative flex h-full flex-col justify-center">
            {/* BRAND */}
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg">
                <Image
                  src="/skledge-logo.png"
                  height={32}
                  width={32}
                  alt="SK-Ledge Logo"
                />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none tracking-tight text-white">
                  SK-Ledge
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-tertiary">
                  Official System Portal
                </p>
              </div>
            </div>

            <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white">
              Empower{" "}
              <span className="text-tertiary">Youth Governance</span> across
              Batangas
            </h2>

            <p className="mb-10 max-w-md text-sm font-medium leading-relaxed text-white/70">
              Join the growing network of SK officials using SK-Ledge to drive
              transparency, accountability, and real progress for the Batangueño
              youth.
            </p>

            {/* TRUST BADGES */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <p className="text-sm font-semibold text-white/90">
                  Verified Official Accounts
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Lock className="h-5 w-5 shrink-0 text-tertiary" />
                <p className="text-sm font-semibold text-white/90">
                  End-to-End Encryption
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LogoLoader />}>
      <RegisterPageContent />
    </Suspense>
  );
}
