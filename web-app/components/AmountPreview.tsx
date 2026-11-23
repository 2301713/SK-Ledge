"use client";

import { AlertTriangle, BadgeCheck } from "lucide-react";
import { describePesoInput, formatCentavosAsPeso, parsePesoInput } from "@/lib/money";

/**
 * Live translation of a typed peso amount.
 *
 * Shows exactly what will be recorded — including whether centavos are
 * present — so the signer never has to guess between ₱1,500 and ₱1,500.50.
 * Renders nothing while the field is empty.
 */
export default function AmountPreview({
  value,
  id,
  className = "",
}: {
  value: string;
  id?: string;
  className?: string;
}) {
  if (!value.trim()) return null;

  const parsed = parsePesoInput(value);
  if (!parsed.ok) {
    return (
      <p
        id={id}
        role="alert"
        className={`mt-2 flex items-start gap-1.5 text-xs font-medium text-danger ${className}`}
      >
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{parsed.error}</span>
      </p>
    );
  }

  const described = describePesoInput(value);

  return (
    <p
      id={id}
      aria-live="polite"
      className={`mt-2 flex items-start gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs text-secondary-foreground ${className}`}
    >
      <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
      <span>
        {described.ok ? described.text : null}
        <span className="mt-0.5 block font-medium text-secondary-foreground/80">
          {parsed.hasCentavos
            ? `Recorded on-chain as ${parsed.centavos.toLocaleString("en-PH")} centavos.`
            : `Whole pesos — recorded as ${parsed.centavos.toLocaleString("en-PH")} centavos (${formatCentavosAsPeso(parsed.centavos)}).`}
        </span>
      </span>
    </p>
  );
}
