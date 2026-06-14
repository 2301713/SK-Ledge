"use client";

import React, { useEffect } from "react";
import { useToastStore, ToastType } from "@/lib/useToastStore";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const toastConfig: Record<
  ToastType,
  { bg: string; border: string; icon: React.ReactNode; textColor: string }
> = {
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    textColor: "text-green-800",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    textColor: "text-red-800",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    textColor: "text-amber-800",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Info className="w-5 h-5 text-blue-600" />,
    textColor: "text-blue-800",
  },
};

export default function Toast({
  id,
  type,
  message,
  duration = 4000,
}: ToastProps) {
  const { removeToast } = useToastStore();
  const config = toastConfig[type];

  useEffect(() => {
    if (duration === 0) return; // persistent toast

    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, removeToast]);

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-slate-900/10 animate-in slide-in-from-right-4 duration-300`}
    >
      <div className="shrink-0">{config.icon}</div>
      <p className={`text-sm font-bold ${config.textColor} flex-1`}>
        {message}
      </p>
      <button
        onClick={() => removeToast(id)}
        className={`shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors ${config.textColor}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
