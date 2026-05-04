"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Check, Loader2 } from "lucide-react";

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

      // UX: Redirect on success
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
    <div className="h-screen flex overflow-hidden">
      {/* LEFT SIDE */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 relative overflow-hidden bg-linear-to-br from-slate-100 via-white to-slate-200">
        {/* Background Decorations */}
        <div className="absolute w-64 h-64 bg-primary/10 rounded-full -top-10 -left-10 blur-3xl"></div>
        <div className="absolute w-64 h-64 bg-primary/10 rounded-full -bottom-10 -right-10 blur-3xl"></div>

        {/* FORM CARD */}
        <div className="w-full max-w-sm relative z-10 bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl p-5">
          {/* HEADER */}
          <div className="text-center mb-4">
            <div className="mx-auto w-12 h-12 bg-primary text-white flex items-center justify-center rounded-lg font-black text-lg shadow-md">
              SK
            </div>
            <h1 className="mt-2 text-xl font-extrabold text-primary">
              SK-Ledge Portal
            </h1>
            <p className="text-[11px] text-slate-500">
              Create your official account
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleRegister} className="space-y-3">
            {/* FULL NAME */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Juan Dela Cruz"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition"
              />
            </div>

            {/* ROLE */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Role
              </label>
              <select
                value={formData.role_type}
                onChange={(e) =>
                  setFormData({ ...formData, role_type: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition"
              >
                <option value="SK_Chairperson">SK Chairperson</option>
                <option value="SK_Treasurer">SK Treasurer</option>
                <option value="BMO">BMO</option>
                <option value="SK_Fed">SK Fed</option>
                <option value="COA">COA</option>
              </select>
            </div>

            {/* BARANGAY */}
            {isSKRole && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Barangay
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barangay San Jose"
                  value={formData.barangay}
                  onChange={(e) =>
                    setFormData({ ...formData, barangay: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition"
                />
              </div>
            )}

            {/* USERNAME */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. juandelacruz123"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition"
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition"
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition"
              />
            </div>

            {/* SHOW PASSWORD */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-primary font-semibold hover:underline"
            >
              {showPassword ? "Hide Password" : "Show Password"}
            </button>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold 
            hover:scale-[1.02] hover:shadow-md hover:shadow-primary/20 
            transition flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Processing...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {/* LOGIN */}
            <p className="text-center text-[11px] text-slate-500">
              Already registered?{" "}
              <span
                onClick={() => router.push("/login")}
                className="text-primary font-bold cursor-pointer hover:underline"
              >
                Login
              </span>
            </p>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hidden md:flex w-1/2 bg-primary text-white items-center justify-center relative overflow-hidden">
        <div className="absolute w-80 h-80 bg-white/10 rounded-full -top-10 -left-10" />
        <div className="absolute w-72 h-72 bg-white/10 rounded-full -bottom-10 -right-10" />

        <div className="relative z-10 max-w-md text-center px-8">
          <h2 className="text-3xl font-extrabold mb-3">
            Empower Youth Governance
          </h2>

          <p className="text-xs opacity-90 leading-relaxed">
            SK-Ledge ensures transparency, accountability, and real-time
            financial tracking for SK officials.
          </p>

          {/* FEATURES WITH LUCIDE ICON */}
          <div className="mt-6 space-y-2 text-xs">
            <div className="bg-white/10 p-2 rounded-md flex items-center gap-2">
              <Check size={16} className="text-white" />
              Secure Records
            </div>

            <div className="bg-white/10 p-2 rounded-md flex items-center gap-2">
              <Check size={16} className="text-white" />
              Real-time Monitoring
            </div>

            <div className="bg-white/10 p-2 rounded-md flex items-center gap-2">
              <Check size={16} className="text-white" />
              Audit-ready Reports
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
