export const RECEIPT_BUCKET = "receipts";
export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
export const RECEIPT_MAX_FILES = 5;
export const RECEIPT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

export function isValidBlockchainTxHash(value: string): boolean {
  return TX_HASH_RE.test(value);
}

/** Returns a user-facing error, or null when the file is acceptable. */
export function validateReceiptFile(file: File): string | null {
  if (file.size === 0) {
    return `${file.name} is empty.`;
  }

  if (file.size > RECEIPT_MAX_BYTES) {
    return `${file.name} is larger than 10 MB.`;
  }

  if (!(RECEIPT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name} must be a PDF, JPEG, PNG, or WebP file.`;
  }

  return null;
}

export function sanitizeReceiptFileName(name: string): string {
  const cleaned = name
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[.-]+/, "")
    .slice(-120);

  return cleaned || "receipt";
}

export function buildReceiptUrl(documentId: string): string {
  return `/api/documents/${documentId}`;
}
