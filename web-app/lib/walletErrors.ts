/**
 * Turns wallet/contract failures into user-facing copy. Wagmi and viem wrap
 * errors several layers deep (`cause`, `data`, `shortMessage`), so the messages
 * are collected from the whole chain rather than only the top-level one.
 */

const REVERT_MESSAGES: ReadonlyArray<{ match: string; message: string }> = [
  {
    match: "your wallet is not an authorized sk official",
    message:
      "This wallet is not authorized as an SK official on the contract. Ask the contract owner to authorize it.",
  },
  {
    match: "your wallet is not authorized for this barangay",
    message:
      "This wallet is not authorized for your barangay on the contract. Ask the contract owner to authorize it for that barangay.",
  },
  {
    match: "only the owner or an official of this barangay can set a ceiling",
    message:
      "Only the contract owner or an authorized official of this barangay can set its ceiling. Your wallet is not authorized for this barangay.",
  },
  {
    match: "only an authorized coa auditor",
    message:
      "Only an authorized COA approver wallet can confirm records on the contract.",
  },
  {
    match: "allocation exceeds ceiling",
    message:
      "This allocation exceeds the barangay's configured ceiling. Lower the amount or raise the ceiling first.",
  },
  {
    match: "unknown barangay",
    message:
      "The contract does not recognise this barangay. Use a registered canonical Batangas barangay.",
  },
  {
    match: "ceiling must be greater than zero",
    message: "The ceiling must be greater than zero.",
  },
  {
    match: "amount must be greater than zero",
    message: "The amount must be greater than zero.",
  },
  {
    match: "record is already confirmed",
    message: "This record has already been confirmed on-chain.",
  },
  {
    match: "record is already voided",
    message: "This record has already been voided on-chain.",
  },
  {
    match: "insufficient funds",
    message:
      "This wallet does not have enough Sepolia ETH to pay for the transaction.",
  },
];

function collectMessages(error: unknown, depth = 0): string[] {
  if (error == null || depth > 5) return [];
  if (typeof error === "string") return [error];
  if (typeof error !== "object") return [];

  const record = error as Record<string, unknown>;
  const messages: string[] = [];

  for (const key of ["shortMessage", "message", "details"]) {
    if (typeof record[key] === "string") {
      messages.push(record[key] as string);
    }
  }

  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;
    if (typeof data.message === "string") {
      messages.push(data.message);
    }
  }

  messages.push(...collectMessages(record.cause, depth + 1));
  return messages;
}

function hasErrorCode(error: unknown, code: number, depth = 0): boolean {
  if (error == null || depth > 5 || typeof error !== "object") return false;

  const record = error as Record<string, unknown>;
  if (record.code === code) return true;
  return hasErrorCode(record.cause, code, depth + 1);
}

export function describeWalletError(
  error: unknown,
  fallback = "Transaction failed. Please try again.",
): string {
  if (!error) return fallback;

  const messages = collectMessages(error);
  const combined = messages.join(" | ").toLowerCase();

  if (
    hasErrorCode(error, 4001) ||
    combined.includes("user rejected") ||
    combined.includes("user denied") ||
    combined.includes("rejected the request")
  ) {
    return "Transaction was rejected in your wallet.";
  }

  if (
    combined.includes("chain mismatch") ||
    combined.includes("current chain") ||
    combined.includes("does not match the target chain")
  ) {
    return "Switch your wallet to the Sepolia test network and try again.";
  }

  const match = REVERT_MESSAGES.find((entry) =>
    combined.includes(entry.match),
  );
  if (match) return match.message;

  return fallback;
}
