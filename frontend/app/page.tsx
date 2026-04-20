"use client";

import { useRouter } from "next/navigation";

export default function App() {
  const router = useRouter();

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <h1>Landing Page</h1>
      <div className="flex gap-4">
        <button onClick={() => router.push("/login")}>Login</button>
        <button onClick={() => router.push("/public-portal")}>
          Public Portal
        </button>
        <button onClick={() => router.push("/register")}>Register</button>
      </div>
    </div>
  );
}
