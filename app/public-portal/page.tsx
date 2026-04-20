"use client";

import { useRouter } from "next/navigation";

export default function PublicPortal() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 justify-center items-center min-h-screen">
      <h1>Public Portal for Transparency of Funds</h1>
      <button
        onClick={() => router.push("/")}
        className="rounded-md bg-blue-600 py-2.5 px-5 text-sm text-white font-bold"
      >
        Back to Home
      </button>
    </div>
  );
}
