import { describe, expect, it } from "vitest";
import {
  buildReceiptUrl,
  isValidBlockchainTxHash,
  RECEIPT_MAX_BYTES,
  sanitizeReceiptFileName,
  validateReceiptFile,
} from "./receipts";

function makeFile(
  name: string,
  type: string,
  content: string | ArrayBuffer = "receipt"
): File {
  return new File([content], name, { type });
}

describe("validateReceiptFile", () => {
  it("accepts a PDF within the size limit", () => {
    expect(validateReceiptFile(makeFile("receipt.pdf", "application/pdf"))).toBeNull();
  });

  it("accepts a JPEG image", () => {
    expect(validateReceiptFile(makeFile("photo.jpg", "image/jpeg"))).toBeNull();
  });

  it("rejects an empty file", () => {
    expect(
      validateReceiptFile(makeFile("empty.pdf", "application/pdf", ""))
    ).toContain("empty");
  });

  it("rejects files larger than the limit", () => {
    const oversized = new ArrayBuffer(RECEIPT_MAX_BYTES + 1);
    expect(
      validateReceiptFile(makeFile("big.pdf", "application/pdf", oversized))
    ).toContain("10 MB");
  });

  it("rejects unsupported file types", () => {
    expect(
      validateReceiptFile(makeFile("notes.txt", "text/plain"))
    ).toContain("PDF, JPEG, PNG, or WebP");
  });
});

describe("receipt helpers", () => {
  it("sanitizes unsafe filename characters", () => {
    expect(sanitizeReceiptFileName("../../My Receipt #1.pdf")).toBe(
      "My-Receipt-1.pdf"
    );
  });

  it("falls back when the name has no usable characters", () => {
    expect(sanitizeReceiptFileName("...")).toBe("receipt");
  });

  it("validates a 32-byte transaction hash", () => {
    expect(isValidBlockchainTxHash(`0x${"a".repeat(64)}`)).toBe(true);
    expect(isValidBlockchainTxHash(`0x${"a".repeat(63)}`)).toBe(false);
    expect(isValidBlockchainTxHash("not-a-hash")).toBe(false);
  });

  it("builds the document URL", () => {
    expect(buildReceiptUrl("abc-123")).toBe("/api/documents/abc-123");
  });
});
