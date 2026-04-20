"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; // Adjust this path if needed

export default function RegisterPage() {
  const router = useRouter();

  // 1. Added full_name and barangay to the initial state
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

    // Destructure values from formData for cleaner code
    const {
      full_name,
      barangay,
      username,
      password,
      confirmPassword,
      role_type,
    } = formData;

    // UX & Security: Ironclad validation before hitting the database
    if (!username || !password || !full_name || !barangay || !role_type) {
      setError("All fields are required.");
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

    // Auth Workaround: Map username to the dummy email scheme
    const dummyEmail = `${username.toLowerCase()}@skledge.com`;

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: password,
        options: {
          data: {
            username: username,
            role_type: role_type,
            full_name: full_name,
            barangay: barangay,
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-gray-100 my-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">SK-Ledge</h1>
          <p className="text-sm text-gray-500">Create your secure account</p>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* FULL NAME FIELD */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Juan Dela Cruz"
            />
          </div>

          {/* BARANGAY FIELD */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Barangay
            </label>
            <input
              type="text"
              required
              value={formData.barangay}
              onChange={(e) =>
                setFormData({ ...formData, barangay: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., San Jose"
            />
            {/* Note: If you want to restrict this to specific barangays, change this <input> to a <select> tag similar to the Role dropdown */}
          </div>

          {/* ROLE FIELD */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={formData.role_type}
              onChange={(e) =>
                setFormData({ ...formData, role_type: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="SK_Chairperson">SK Chairperson</option>
              <option value="SK_Treasurer">SK Treasurer</option>
              <option value="BMO">Budget Gatekeeper (BMO/RBCPB)</option>
              <option value="SK_Fed">SK Provincial Federation</option>
              <option value="COA">Commission on Audit (COA)</option>
            </select>
          </div>

          {/* USERNAME FIELD */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., sk_brgy1"
            />
          </div>

          {/* PASSWORD FIELD */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-sm text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD FIELD */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 py-2.5 mt-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? "Registering..." : "Register Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
