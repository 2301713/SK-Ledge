import { useMemo } from "react";
import { useToastStore } from "./useToastStore";

/* Hook for displaying toast notifications.
   Returns a stable object reference so it is safe to use inside useEffect deps. */
export function useToast() {
  // Select only the action (stable identity) instead of subscribing
  // to the whole store, which re-renders on every toast add/remove.
  const addToast = useToastStore((state) => state.addToast);

  return useMemo(
    () => ({
      success: (message: string, duration?: number) =>
        addToast({ type: "success", message, duration }),
      error: (message: string, duration?: number) =>
        addToast({ type: "error", message, duration }),
      warning: (message: string, duration?: number) =>
        addToast({ type: "warning", message, duration }),
      info: (message: string, duration?: number) =>
        addToast({ type: "info", message, duration }),
    }),
    [addToast],
  );
}
