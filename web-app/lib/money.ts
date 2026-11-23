/**
 * Money helpers for peso inputs.
 *
 * Amounts are stored on-chain in centavos (integers). The UI takes pesos as a
 * typed string and must be explicit about centavos, because `1,500` and
 * `1,500.50` are different records on the ledger and a misread digit is
 * expensive to undo (an on-chain record can only be voided, never deleted).
 */

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

const SCALES: Array<[number, string]> = [
  [1_000_000_000, "billion"],
  [1_000_000, "million"],
  [1_000, "thousand"],
];

const belowHundred = (n: number): string =>
  n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ""}`;

const belowThousand = (n: number): string => {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds > 0) parts.push(`${ONES[hundreds]} hundred`);
  if (rest > 0) parts.push(belowHundred(rest));
  return parts.join(" ");
};

/** Spells out a whole number of pesos, e.g. 25000 -> "twenty-five thousand". */
export function pesosInWords(pesos: number): string {
  if (!Number.isFinite(pesos) || pesos < 0) return "";
  const whole = Math.floor(pesos);
  if (whole === 0) return "zero";

  const parts: string[] = [];
  let remaining = whole;

  for (const [value, label] of SCALES) {
    const unit = Math.floor(remaining / value);
    if (unit > 0) {
      parts.push(`${belowThousand(unit)} ${label}`);
      remaining %= value;
    }
  }
  if (remaining > 0) parts.push(belowThousand(remaining));

  return parts.join(" ");
}

/** Formats centavos as ₱1,234.56. */
export const formatCentavosAsPeso = (centavos: number): string =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);

export type PesoParseResult =
  | { ok: true; centavos: number; pesos: number; hasCentavos: boolean }
  | { ok: false; error: string };

/**
 * Parses a typed peso amount. Accepts "25000", "25,000.50", "25000.5".
 * Rejects more than two decimal places instead of silently rounding, so the
 * user never records an amount they did not intend.
 */
export function parsePesoInput(raw: string): PesoParseResult {
  const trimmed = raw.trim().replace(/[₱,\s]/g, "");
  if (!trimmed) return { ok: false, error: "Enter an amount in pesos." };
  if (!/^\d*(\.\d*)?$/.test(trimmed)) {
    return { ok: false, error: "Use digits only, e.g. 25000 or 25000.50." };
  }
  if (trimmed === ".") return { ok: false, error: "Enter an amount in pesos." };

  const [wholePart = "", fractionPart = ""] = trimmed.split(".");
  if (fractionPart.length > 2) {
    return {
      ok: false,
      error:
        "Only two decimal places are allowed — the contract records centavos (0.01 is the smallest unit).",
    };
  }
  if (wholePart.length > 12) {
    return { ok: false, error: "That amount is too large to record." };
  }

  const pesos = Number(`${wholePart || "0"}.${fractionPart || "0"}`);
  const centavos = Math.round(pesos * 100);
  if (!Number.isFinite(centavos) || centavos <= 0) {
    return { ok: false, error: "The amount must be greater than zero." };
  }

  return {
    ok: true,
    centavos,
    pesos,
    hasCentavos: fractionPart.replace(/0+$/, "").length > 0,
  };
}

/**
 * Human-readable translation of a typed amount, e.g.
 * "25,000.50 pesos — twenty-five thousand pesos and 50/100 centavos".
 */
export function describePesoInput(
  raw: string,
): { ok: true; text: string } | { ok: false; error: string } {
  const parsed = parsePesoInput(raw);
  if (!parsed.ok) return parsed;

  const whole = Math.floor(parsed.centavos / 100);
  const cents = parsed.centavos % 100;
  const words = pesosInWords(whole);
  const centsLabel =
    cents === 0 ? "" : ` and ${String(cents).padStart(2, "0")}/100 centavos`;

  return {
    ok: true,
    text: `${formatCentavosAsPeso(parsed.centavos)} — ${words} ${
      whole === 1 ? "peso" : "pesos"
    }${centsLabel}`,
  };
}
