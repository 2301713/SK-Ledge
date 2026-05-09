import { useToastStore } from "./useToastStore";

/**
 * Convenience hook for displaying toast notifications
 * Usage:
 * const toast = useToast();
 * toast.success("Account updated!");
 * toast.error("Failed to save");
 * toast.warning("Please confirm");
 * toast.info("New feature available");
 */
export function useToast() {
  const { addToast } = useToastStore();

  return {
    success: (message: string, duration?: number) =>
      addToast({ type: "success", message, duration }),
    error: (message: string, duration?: number) =>
      addToast({ type: "error", message, duration }),
    warning: (message: string, duration?: number) =>
      addToast({ type: "warning", message, duration }),
    info: (message: string, duration?: number) =>
      addToast({ type: "info", message, duration }),
  };
}
