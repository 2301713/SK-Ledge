import { create } from "zustand";
import { devtools } from "zustand/middleware";

// TYPES
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // milliseconds, 0 = persistent
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

// STORE
export const useToastStore = create<ToastState>()(
  devtools(
    (set) => ({
      toasts: [],

      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const duration = toast.duration ?? 4000; // default 4 seconds

        set((state) => ({
          toasts: [...state.toasts, { ...toast, id, duration }],
        }));

        // Auto-remove toast after duration (if duration > 0)
        if (duration > 0) {
          setTimeout(() => {
            set((state) => ({
              toasts: state.toasts.filter((t) => t.id !== id),
            }));
          }, duration);
        }

        return id;
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      clearAllToasts: () => set({ toasts: [] }),
    }),
    {
      name: "toast-store",
      enabled:
        typeof window !== "undefined" && process.env.NODE_ENV === "development",
    },
  ),
);
