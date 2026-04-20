"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; // Adjust path if needed

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

    // Clean whitespace and lowercase to match the registration logic
    const cleanUsername = credentials.username.trim().toLowerCase();
    const dummyEmail = `${cleanUsername}@skledge.com`;

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: dummyEmail,
          password: credentials.password,
        },
      );

      if (authError) {
        throw new Error("Invalid username or password.");
      }

      if (data.user) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ created_at: new Date().toISOString() })
          .eq("id", data.user.id);

        if (updateError) {
          console.warn(
            "Failed to update created_at timestamp:",
            updateError.message,
          );
        }
      }

      // UX: Redirect on success
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid login credentials.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-gray-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">SK-Ledge</h1>
          <p className="text-sm text-gray-500">Sign in to your dashboard</p>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              required
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400 mt-2"
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Need an account?{" "}
          <button
            onClick={() => router.push("/register")}
            className="font-semibold text-blue-600 hover:underline"
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}
