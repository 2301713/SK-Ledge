"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; // Adjust path if needed
import { CircleAlert, Loader2 } from "lucide-react";

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
          .update({ created_at: new Date().toISOString() }) // Ideally update a 'last_login' column here
          .eq("id", authData.user.id);

        if (updateError) {
          console.warn(
            "Failed to update last_login timestamp:",
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
          case "SK_Fed":
            router.push("/skfed_dashboard");
            break;
          default:
            // Fallback just in case
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
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden selection:bg-tertiary selection:text-primary">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-slate-200 relative z-10 overflow-hidden">
        {/* Institutional Gold Accent Line */}
        <div className="h-1.5 w-full bg-tertiary"></div>

        <div className="p-8 sm:p-10">
          {/* BRANDING HEADER */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-tertiary font-black text-2xl shadow-md shadow-primary/20 mb-4">
              SK
            </div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">
              SK-Ledge Portal
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-1 text-center">
              Secure System Access
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-6 rounded-lg bg-danger/10 p-4 border border-danger/20 flex items-start gap-3">
              <span className="text-danger mt-0.5">
                <CircleAlert />
              </span>
              <p className="text-sm font-medium text-danger leading-snug">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* USERNAME */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1.5">
                Portal Username
              </label>
              <input
                type="text"
                required
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400 placeholder:font-normal"
                placeholder="Enter your username"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Password
                </label>
                {/* Optional: Add a "Forgot Password?" link here in the future */}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-12 py-3 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:bg-primary/50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </button>
            </div>
          </form>

          {/* REGISTER PROMPT */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-secondary-foreground font-medium">
              No official account yet?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-primary font-bold hover:underline underline-offset-4"
              >
                Request Access
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
