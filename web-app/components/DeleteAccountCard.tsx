"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";

interface DeleteAccountCardProps {
  username?: string | null;
}

/**
 * Self-service account deletion. The auth user is removed server-side, which
 * cascades to the profile row, so every dashboard session for it ends here.
 */
export default function DeleteAccountCard({
  username,
}: DeleteAccountCardProps) {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const expected = (username ?? "").trim();
  const canDelete =
    expected.length > 0 &&
    confirmation.trim().toLowerCase() === expected.toLowerCase();

  const close = () => {
    if (isDeleting) return;
    setIsOpen(false);
    setConfirmation("");
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: confirmation.trim() }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Account deletion failed.");
      }

      await supabase.auth.signOut({ scope: "local" });
      window.location.replace("/login?deleted=1");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Account deletion failed.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          eyebrow="Danger zone"
          title="Delete account"
          subtitle="Permanently remove your SK-Ledge account and sign-in access."
        />

        <div className="flex flex-col gap-4 rounded-2xl border border-danger/30 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary-foreground">
                This cannot be undone
              </p>
              <p className="mt-1 text-xs leading-relaxed text-secondary-foreground">
                Your profile and sign-in access are removed. Ledger records you
                already committed stay on the blockchain, and any linked
                barangay records are kept for audit.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-danger/40 bg-white px-4 py-2.5 text-sm font-bold text-danger transition hover:bg-danger hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        </div>
      </Card>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm animate-fadein"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-white shadow-[-24px_0_60px_-24px_rgba(1,56,168,0.35)]"
          >
            <div className="h-1 w-full bg-danger" />

            <div className="flex items-start justify-between gap-4 px-5 pt-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                <Trash2 className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={close}
                disabled={isDeleting}
                aria-label="Close delete account confirmation"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-secondary-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <h3
                id="delete-account-title"
                className="text-xl font-black tracking-tight text-primary-foreground"
              >
                Delete your account?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
                You will be signed out immediately and will not be able to sign
                in again. Type{" "}
                <span className="font-bold text-primary-foreground">
                  {expected || "your username"}
                </span>{" "}
                to confirm.
              </p>

              <input
                type="text"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={isDeleting}
                autoFocus
                autoComplete="off"
                placeholder={expected || "Username"}
                className="mt-4 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-primary-foreground outline-none transition focus:border-danger focus:ring-2 focus:ring-danger/20 disabled:opacity-60"
              />
            </div>

            <div className="space-y-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete || isDeleting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-bold text-white shadow-[0_6px_16px_-8px_rgba(220,38,38,0.6)] transition hover:bg-danger/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete my account
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={close}
                disabled={isDeleting}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                Keep my account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
