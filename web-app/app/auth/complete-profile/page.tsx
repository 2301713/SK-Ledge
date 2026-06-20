"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
import {
  CircleAlert,
  Loader2,
  ShieldCheck,
  User,
  MapPin,
  UserCog,
  ArrowRight,
} from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    role_type: "SK_Chairperson",
    barangay: "",
  });

  useEffect(() => {
    // Get the current user's email
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/register");
        return;
      }

      setUserEmail(user.email || "");
    };

    getUser();
  }, [router]);

  const isSKRole =
    formData.role_type === "SK_Chairperson" ||
    formData.role_type === "SK_Treasurer";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Validate required fields
      if (!formData.username.trim()) {
        throw new Error("Username is required");
      }

      if (isSKRole && !formData.barangay.trim()) {
        throw new Error("Barangay is required for SK Officials");
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: formData.username,
          role_type: formData.role_type,
          barangay: isSKRole ? formData.barangay : "N/A",
          approval_status: "pending",
        },
      });

      if (updateError) throw updateError;

      // Insert profile into profiles table for approvals system
      const { error: insertError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          email: user.email,
          username: formData.username,
          full_name: user.user_metadata?.full_name || formData.username,
          role_type: formData.role_type,
          barangay: isSKRole ? formData.barangay : "N/A",
          approval_status: "pending",
        },
      ]);

      if (insertError) {
        // If insert fails due to duplicate, try update instead
        if (insertError.code === "23505") {
          const { error: updateProfileError } = await supabase
            .from("profiles")
            .update({
              username: formData.username,
              role_type: formData.role_type,
              barangay: isSKRole ? formData.barangay : "N/A",
              approval_status: "pending",
            })
            .eq("id", user.id);

          if (updateProfileError) throw updateProfileError;
        } else {
          throw insertError;
        }
      }

      toast.success(
        "Profile completed! Pending admin approval. Redirecting...",
      );
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden selection:bg-tertiary selection:text-primary">
      {/* LEFT SIDE */}
      <section className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 sm:p-16 lg:p-20 bg-white relative z-10 order-2 lg:order-1">
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
              Complete Your Profile
            </p>
          </div>

          <header className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-primary mb-2 tracking-tight">
              Complete Profile
            </h2>
            <p className="text-slate-500 font-medium">
              Just a few more details to get started.
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL (READ-ONLY) */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  disabled
                  value={userEmail}
                  className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-slate-500 cursor-not-allowed outline-none"
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
                    setFormData({
                      ...formData,
                      role_type: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="SK_Chairperson">SK Chairperson</option>
                  <option value="SK_Treasurer">SK Treasurer</option>
                  <option value="BMO">BMO</option>
                  <option value="SK_Federation">SK Federation</option>
                  <option value="COA">COA</option>
                </select>
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
                      setFormData({
                        ...formData,
                        barangay: e.target.value,
                      })
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
                    setFormData({
                      ...formData,
                      username: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-slate-300"
                  placeholder="e.g. juandelacruz123"
                />
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
                    <span className="text-lg">Completing Profile...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">Complete Profile</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <footer className="mt-12 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
              &copy; 2026 National Youth Governance Portal <br />
              Authorized Personnel Only
            </p>
          </footer>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 overflow-hidden bg-primary order-1 lg:order-2">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="absolute top-[-10%] right-[-10%] w-125 h-125 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-100 h-100 bg-tertiary/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-xl w-full">
          <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/10 border-r-8">
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
              Welcome to <span className="text-tertiary">SK-Ledge</span>!
            </h2>

            <p className="text-white/70 leading-relaxed text-lg mb-10 font-light">
              Thank you for signing up with Google. Just complete your profile
              with your role and barangay information to get started.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
