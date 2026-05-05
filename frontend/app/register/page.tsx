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
  Eye,
  ArrowRight,
  ChevronRight,
  MapPin,
  UserCog,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    barangay: "",
    username: "",
    password: "",
    confirmPassword: "",
    role_type: "SK_Chairperson",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Helper boolean to check if the current role requires a barangay
  const isSKRole =
    formData.role_type === "SK_Chairperson" ||
    formData.role_type === "SK_Treasurer";

  // Password requires at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const validatePassword = (password: string) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const {
      full_name,
      barangay,
      username,
      password,
      confirmPassword,
      role_type,
    } = formData;

    // Base validation for fields that EVERYONE needs
    if (!username || !password || !full_name || !role_type) {
      setError("Please fill out all required fields.");
      setIsLoading(false);
      return;
    }

    // Only require barangay if they are an SK official
    if (isSKRole && !barangay.trim()) {
      setError("Barangay is required for SK Officials.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      );
      setIsLoading(false);
      return;
    }

    const dummyEmail = `${username.toLowerCase()}@skledge.com`;
    const finalBarangay = isSKRole ? barangay : "N/A";

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: password,
        options: {
          data: {
            username: username,
            role_type: role_type,
            full_name: full_name,
            barangay: finalBarangay,
          },
        },
      });

      if (signUpError) throw signUpError;

      // UX
      console.log("Registration successful!", data);
      router.push("/login");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to register account.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden selection:bg-tertiary selection:text-primary">
      {/* LEFT SIDE */}
      <section className="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 sm:p-16 lg:p-20 bg-white relative z-10 order-2 lg:order-1">
        <div className="w-full max-w-lg">
          {/* Mobile Branding Header */}
          <div className="lg:hidden mb-10 flex flex-col items-center text-center">
            <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center text-tertiary shadow-lg mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight">
              SK-Ledge Portal
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">
              Official System Registration
            </p>
          </div>

          <header className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-primary mb-2 tracking-tight">
              Create Account
            </h2>
            <p className="text-slate-500 font-medium">
              Register your official SK-Ledge portal access.
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

          <form onSubmit={handleRegister} className="space-y-5">
            {/* ROW 1: Full Name + Role — side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* FULL NAME */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-primary transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
              </div>

              {/* ROLE */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Role
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-primary transition-colors">
                    <UserCog className="w-5 h-5" />
                  </div>
                  <select
                    value={formData.role_type}
                    onChange={(e) =>
                      setFormData({ ...formData, role_type: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="SK_Chairperson">SK Chairperson</option>
                    <option value="SK_Treasurer">SK Treasurer</option>
                    <option value="BMO">BMO</option>
                    <option value="SK_Federation">SK Fed</option>
                    <option value="COA">COA</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BARANGAY */}
            {isSKRole && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Barangay
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-primary transition-colors">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.barangay}
                    onChange={(e) =>
                      setFormData({ ...formData, barangay: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300"
                    placeholder="e.g. Barangay San Jose"
                  />
                </div>
              </div>
            )}

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
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300"
                  placeholder="e.g. juandelacruz123"
                />
              </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-12 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 inset-y-0 text-primary/60 hover:text-primary transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-primary transition-colors">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300"
                    placeholder="Re-enter password"
                  />
                </div>
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
                    <span className="text-lg">Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">Create Account</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* LOGIN PROMPT */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="bg-slate-50 p-6 rounded-4xl border border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-slate-500 text-sm font-medium">
                  Already have an account?
                </p>
                <p className="text-primary font-extrabold tracking-tight">
                  Sign In Instead
                </p>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-100 group whitespace-nowrap"
              >
                Go to Login{" "}
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

      {/* RIGHT SIDE */}
      <section className="hidden lg:flex lg:w-[45%] relative items-center justify-center p-12 overflow-hidden bg-[#0B3B78] order-1 lg:order-2">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="absolute top-[-10%] right-[-10%] w-125 h-125 bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-100 h-100 bg-tertiary/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-md w-full">
          {/* Glassmorphism Card — identical structure to login */}
          <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/10 border-r-8">
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
              Empower <span className="text-tertiary">Youth Governance</span>{" "}
              across Batangas.
            </h2>

            <p className="text-blue-100/70 leading-relaxed text-lg mb-10 font-light">
              Join the growing network of SK officials using SK-Ledge to drive
              transparency, accountability, and real progress for the Batangueño
              youth.
            </p>

            {/* Trust Badges — identical component to login */}
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

          {/* Floating decorative icons — mirrored positions from login */}
          <BarChart3 className="absolute -top-16 -left-12 w-28 h-28 text-white opacity-5 animate-pulse" />
          <Landmark className="absolute -bottom-16 -right-12 w-28 h-28 text-white opacity-5" />
        </div>
      </section>
    </div>
  );
}
