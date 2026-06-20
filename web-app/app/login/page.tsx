"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useFormStore } from "@/lib/useFormStore";
import { useAuthStore } from "@/lib/useAuthStore";
import { useToast } from "@/lib/useToast";
import {
  CircleAlert,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Lock,
  Landmark,
  User,
  KeyRound,
  EyeOff,
  ArrowRight,
  Eye,
  ChevronRight,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { setCurrentUser, setIsLoading } = useAuthStore();
  const {
    login: { credentials, showPassword, error, isLoading },
    setLoginCredentials,
    setLoginShowPassword,
    setLoginError,
    setLoginIsLoading,
  } = useFormStore();

  const handleGoogleSignIn = async () => {
    setLoginIsLoading(true);
    setLoginError("");

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
      setLoginError(message);
      toast.error(message);
      setLoginIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    setLoginIsLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

      if (authError) {
        throw new Error(authError.message || "Invalid email or password.");
      }

      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, username, full_name, role_type, barangay, approval_status",
          )
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          throw new Error("Failed to retrieve user profile data.");
        }

        if (profileData.approval_status === "pending") {
          await supabase.auth.signOut();
          throw new Error("Your account is pending administrator approval.");
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ created_at: new Date().toISOString() })
          .eq("id", authData.user.id);

        if (updateError) {
          console.warn(
            "Failed to update created_at timestamp:",
            updateError.message,
          );
        }

        const role = profileData.role_type;
        const userData = {
          id: authData.user.id,
          username: profileData.username,
          email: credentials.email,
          full_name: profileData.full_name || profileData.username,
          role_type: profileData.role_type,
          barangay: profileData.barangay || "No Barangay Assigned",
          approval_status: profileData.approval_status,
        };

        setCurrentUser(userData);
        setIsLoading(false);

        setLoginCredentials({
          email: "",
          password: "",
        });

        switch (role) {
          case "SK_Chairperson":
          case "SK_Treasurer":
            toast.success("Login successful! Redirecting...");
            router.push("/sk_dashboard");
            break;
          case "COA":
            toast.success("Login successful! Redirecting...");
            router.push("/coa_dashboard");
            break;
          case "BMO":
            toast.success("Login successful! Redirecting...");
            router.push("/bmo_dashboard");
            break;
          case "SK_Federation":
            toast.success("Login successful! Redirecting...");
            router.push("/skfed_dashboard");
            break;
          default:
            router.push("/dashboard");
            break;
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid login credentials.";
      setLoginError(message);
      toast.error(message);
    } finally {
      setLoginIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden selection:bg-tertiary selection:text-primary">
      {/* LEFT SIDE: BRANDING SECTION (Visual Only) */}
      <section className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 overflow-hidden bg-primary">
        {/* Background Visual Effects */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        ></div>
        <div className="absolute top-[-10%] left-[-10%] w-125 h-125 bg-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-100 h-100 bg-tertiary/10 rounded-full blur-[120px]"></div>

        <div className="relative z-10 max-w-xl w-full">
          {/* Glassmorphism Card */}
          <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/10 border-l-8">
            <div className="flex items-center gap-5 mb-8">
              <div className="bg-white p-3 rounded-2xl shadow-xl">
                <ShieldCheck className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h1 className="text-white text-5xl font-extrabold tracking-tight">
                  SK-Ledge
                </h1>
                <p className="text-tertiary font-bold tracking-[0.3em] uppercase text-[10px] mt-1">
                  Official System Portal
                </p>
              </div>
            </div>

            <h2 className="text-4xl font-semibold text-white leading-tight mb-6">
              Smart Financial Transparency for{" "}
              <span className="text-tertiary">Youth Governance</span>
            </h2>

            <p className="text-white/70 leading-relaxed text-lg mb-10 font-light">
              The premier digital backbone for Sangguniang Kabataan auditing and
              resource management. Secure. Transparent. Automated.
            </p>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white/80">
              <div className="flex items-center gap-3 text-sm font-medium bg-white/5 p-4 rounded-xl border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                ISO Certified Secure
              </div>
              <div className="flex items-center gap-3 text-sm font-medium bg-white/5 p-4 rounded-xl border border-white/5">
                <Lock className="w-5 h-5 text-tertiary" />
                End-to-End Encrypted
              </div>
            </div>
          </div>

          <BarChart3 className="absolute -top-16 -right-12 w-28 h-28 text-white opacity-5 animate-pulse" />
          <Landmark className="absolute -bottom-16 -left-12 w-28 h-28 text-white opacity-5" />
        </div>
      </section>

      {/* RIGHT SIDE: LOGIN FORM (Your Logic Integrated) */}
      <section className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 sm:p-16 lg:p-24 bg-white relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Branding Header */}
          <div className="lg:hidden mb-10 flex flex-col items-center text-center">
            <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center text-tertiary shadow-lg mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight">
              SK-Ledge Portal
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">
              Secure System Access
            </p>
          </div>

          <header className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-primary mb-2 tracking-tight">
              System Login
            </h2>
            <p className="text-slate-500 font-medium">
              Access your administrative workspace.
            </p>
          </header>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-6 rounded-2xl bg-danger/10 p-4 border border-danger/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="text-danger mt-0.5">
                <CircleAlert className="w-5 h-5" />
              </span>
              <p className="text-sm font-semibold text-danger leading-snug">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* EMAIL */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-primary transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={credentials.email}
                  onChange={(e) =>
                    setLoginCredentials({
                      ...credentials,
                      email: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Secure Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-primary transition-colors">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={credentials.password}
                  onChange={(e) =>
                    setLoginCredentials({
                      ...credentials,
                      password: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-12 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setLoginShowPassword(!showPassword)}
                  className="absolute right-4 inset-y-0 text-xs font-bold uppercase text-primary/60 hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-2xl shadow-2xl shadow-primary/20 transform transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    <span className="text-lg">Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">Sign In to Dashboard</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 px-4 rounded-2xl shadow-md border-2 border-gray-200 hover:border-gray-300 transform transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span className="text-base">Sign In with Google</span>
              </button>
            </div>
          </div>

          {/* REGISTER PROMPT */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="bg-slate-50 p-6 rounded-4xl border border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-slate-500 text-sm font-medium">
                  No official account yet?
                </p>
                <p className="text-primary font-extrabold tracking-tight">
                  Request Access
                </p>
              </div>
              <button
                onClick={() => router.push("/register")}
                className="flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-100 group whitespace-nowrap"
              >
                Apply Now{" "}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <footer className="mt-12 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
              &copy; 2026 National Youth Governance Portal <br />
              Authorized Personnel Only
            </p>
          </footer>
        </div>
      </section>
    </div>
  );
}
