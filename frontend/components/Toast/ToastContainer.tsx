"use client";

import React from "react";
import { useToastStore } from "@/lib/useToastStore";
import Toast from "./Toast";

export default function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
}
