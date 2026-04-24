"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; // Adjust this path if needed

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
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden selection:bg-tertiary selection:text-primary">
      {/* Subtle Background Glows for Modern Depth */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-primary/5 border border-border relative z-10 overflow-hidden">
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
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary-foreground mt-1 text-center">
              Official Account Registration
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-6 rounded-lg bg-danger/10 p-4 border border-danger/20 flex items-start gap-3">
              <span className="text-danger mt-0.5">⚠️</span>
              <p className="text-sm font-medium text-danger leading-snug">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* FULL NAME */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1.5">
                Full Name (As it appears on ID)
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full bg-gray-50/50 border border-border rounded-lg px-4 py-3 text-sm font-medium text-primary-foreground focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-gray-400 placeholder:font-normal"
                placeholder="e.g., Juan Dela Cruz"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ROLE CLASSIFICATION */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1.5">
                  Official Role
                </label>
                <select
                  value={formData.role_type}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      role_type: e.target.value,
                      barangay:
                        e.target.value === "SK_Chairperson" ||
                        e.target.value === "SK_Treasurer"
                          ? formData.barangay
                          : "",
                    });
                  }}
                  className="w-full bg-gray-50/50 border border-border rounded-lg px-4 py-3 text-sm font-medium text-primary-foreground focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="SK_Chairperson">SK Chairperson</option>
                  <option value="SK_Treasurer">SK Treasurer</option>
                  <option value="BMO">Budget Gatekeeper (BMO)</option>
                  <option value="SK_Fed">SK Provincial Fed</option>
                  <option value="COA">Commission on Audit</option>
                </select>
              </div>

              {/* CONDITIONAL BARANGAY */}
              {isSKRole ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1.5">
                    Assigned Barangay
                  </label>
                  <input
                    type="text"
                    required={isSKRole}
                    value={formData.barangay}
                    onChange={(e) =>
                      setFormData({ ...formData, barangay: e.target.value })
                    }
                    className="w-full bg-gray-50/50 border border-border rounded-lg px-4 py-3 text-sm font-medium text-primary-foreground focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-gray-400 placeholder:font-normal"
                    placeholder="e.g., San Jose"
                  />
                </div>
              ) : (
                <div className="hidden md:block"></div> /* Spacer to keep grid aligned */
              )}
            </div>

            {/* SYSTEM CREDENTIALS DIVIDER */}
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  System Credentials
                </span>
                <div className="h-px bg-border flex-1"></div>
              </div>
            </div>

            {/* USERNAME */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1.5">
                Portal Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full bg-gray-50/50 border border-border rounded-lg px-4 py-3 text-sm font-medium text-primary-foreground focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-gray-400 placeholder:font-normal"
                placeholder="e.g., sk_brgy1"
              />
            </div>

            {/* PASSWORD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full bg-gray-50/50 border border-border rounded-lg pl-4 pr-12 py-3 text-sm font-medium text-primary-foreground focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
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
                    className="w-full bg-gray-50/50 border border-border rounded-lg pl-4 pr-12 py-3 text-sm font-medium text-primary-foreground focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-gray-400"
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
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:bg-primary/50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing Registration...
                  </>
                ) : (
                  "Create Official Account"
                )}
              </button>
            </div>

            {/* RETURN TO LOGIN */}
            <div className="text-center mt-6">
              <p className="text-xs text-secondary-foreground font-medium">
                Already have portal access?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-primary font-bold hover:underline underline-offset-4"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
