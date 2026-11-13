"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useToast } from "@/lib/useToast";
import { supabase } from "@/lib/supabase";

interface WalletBindingProps {
  boundWallet?: string | null;
}

export function WalletBinding({ boundWallet }: WalletBindingProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const bindWallet = async () => {
    if (!address) {
      toast.error("Connect the wallet you use for blockchain submissions first.");
      return;
    }

    const timestamp = Date.now();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      toast.error("Your session has expired. Please sign in again.");
      return;
    }

    const message = [
      "SK-Ledge wallet binding",
      `User: ${user.id}`,
      `Address: ${address}`,
      `Timestamp: ${timestamp}`,
    ].join("\n");

    setIsSaving(true);
    try {
      const signature = await signMessageAsync({ message });
      const response = await fetch("/api/profile/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature, timestamp }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Failed to bind wallet.");
      }

      toast.success("Wallet successfully bound to your profile.");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet binding failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-primary-foreground">Blockchain wallet</p>
        <p className="text-xs text-secondary-foreground">
          Bind the wallet that must sign your on-chain records.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 font-mono text-xs text-secondary-foreground break-all">
        {boundWallet || "No wallet bound"}
      </div>
      <button
        type="button"
        onClick={bindWallet}
        disabled={!isConnected || isSigning || isSaving}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSigning || isSaving ? "Binding wallet..." : "Bind connected wallet"}
      </button>
    </div>
  );
}
