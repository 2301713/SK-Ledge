/**
 * Peso helpers for mobile amount fields.
 *
 * The server stores bid amounts as pesos in `submit_bid` and renders ledger
 * amounts from centavos, so the form must be explicit about what the vendor
 * actually typed — including whether centavos are present.
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

const belowHundred = (n: number) =>
  n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ""}`;

const belowThousand = (n: number) => {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds > 0) parts.push(`${ONES[hundreds]} hundred`);
  if (rest > 0) parts.push(belowHundred(rest));
  return parts.join(" ");
};

export const pesosInWords = (pesos: number): string => {
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
};

export const formatPesoAmount = (centavos: number): string =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);

export type PesoParseResult =
  | { ok: true; centavos: number; hasCentavos: boolean }
  | { ok: false; error: string };

/** Parses "25000" / "25,000.50" / "25000.5"; rejects a third decimal place. */
export const parsePesoInput = (raw: string): PesoParseResult => {
  const trimmed = raw.trim().replace(/[₱,\s]/g, "");
  if (!trimmed || trimmed === ".") {
    return { ok: false, error: "Enter an amount in pesos." };
  }
  if (!/^\d*(\.\d*)?$/.test(trimmed)) {
    return { ok: false, error: "Use digits only, e.g. 25000 or 25000.50." };
  }

  const [wholePart = "", fractionPart = ""] = trimmed.split(".");
  if (fractionPart.length > 2) {
    return {
      ok: false,
      error: "Only two decimal places are allowed — centavos are the smallest unit.",
    };
  }
  if (wholePart.length > 12) {
    return { ok: false, error: "That amount is too large to record." };
  }

  const centavos = Math.round(Number(`${wholePart || "0"}.${fractionPart || "0"}`) * 100);
  if (!Number.isFinite(centavos) || centavos <= 0) {
    return { ok: false, error: "The amount must be greater than zero." };
  }

  return {
    ok: true,
    centavos,
    hasCentavos: fractionPart.replace(/0+$/, "").length > 0,
  };
};

/**
 * Human-readable translation of a typed amount, e.g.
 * "₱1,500.50 — one thousand five hundred pesos and 50/100 centavos".
 */
export const describePesoInput = (
  raw: string,
): { ok: true; text: string } | { ok: false; error: string } => {
  const parsed = parsePesoInput(raw);
  if (!parsed.ok) return parsed;

  const whole = Math.floor(parsed.centavos / 100);
  const cents = parsed.centavos % 100;
  const centsLabel =
    cents === 0 ? "" : ` and ${String(cents).padStart(2, "0")}/100 centavos`;

  return {
    ok: true,
    text: `${formatPesoAmount(parsed.centavos)} — ${pesosInWords(whole)} ${
      whole === 1 ? "peso" : "pesos"
    }${centsLabel}`,
  };
};
