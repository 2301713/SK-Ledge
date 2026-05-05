"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
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
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const cleanUsername = credentials.username.trim().toLowerCase();
    const dummyEmail = `${cleanUsername}@skledge.com`;

    try {
      // 1. Authenticate the user
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password: credentials.password,
        });

      if (authError) {
        throw new Error("Invalid username or password.");
      }

      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role_type")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          throw new Error("Failed to retrieve user profile data.");
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

        // 4. Role-based Routing
        const role = profileData.role_type;

        switch (role) {
          case "SK_Chairperson":
          case "SK_Treasurer":
            router.push("/sk_dashboard");
            break;
          case "COA":
            router.push("/coa_dashboard");
            break;
          case "BMO":
            router.push("/bmo_dashboard");
            break;
          case "SK_Federation":
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
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden selection:bg-tertiary selection:text-primary">
      {/* LEFT SIDE: BRANDING SECTION (Visual Only) */}
      <section className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 overflow-hidden bg-[#0B3B78]">
        {/* Background Visual Effects */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        ></div>
        <div className="absolute top-[-10%] left-[-10%] w-125 h-125 bg-blue-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-100 h-100 bg-tertiary/10 rounded-full blur-[120px]"></div>

        <div className="relative z-10 max-w-xl w-full">
          {/* Glassmorphism Card */}
          <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/10 border-l-8">
            <div className="flex items-center gap-5 mb-8">
              <div className="bg-white p-3 rounded-2xl shadow-xl">
                <ShieldCheck className="w-12 h-12 text-[#0B3B78]" />
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

            <h2 className="text-4xl font-semibold text-blue-50 leading-tight mb-6">
              Smart Financial Transparency for{" "}
              <span className="text-tertiary">Youth Governance</span>
            </h2>

            <p className="text-blue-100/70 leading-relaxed text-lg mb-10 font-light">
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
            {/* USERNAME */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Portal Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-primary transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({ ...credentials, username: e.target.value })
                  }
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300"
                  placeholder="Enter your username"
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
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-12 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
