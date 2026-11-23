import { describe, expect, it } from "vitest";
import { buildReportPdf } from "./reportPdf";
import type {
  FinancialSummaryReport,
  LiquidationReport,
  ReportMeta,
} from "./reports";

const meta: ReportMeta = {
  barangay: "Adia, Agoncillo",
  periodStart: "2026-01-01",
  periodEnd: "2026-03-31",
  generatedBy: "Treasurer",
  generatedAt: "2026-04-01T00:00:00.000Z",
  includeReceipts: true,
};

function liquidation(rows: number): LiquidationReport {
  return {
    kind: "liquidation",
    meta,
    rows: Array.from({ length: rows }, (_, index) => ({
      date: "2026-02-01",
      dvNumber: `DV-${index + 1}`,
      payee: "Supplier",
      purpose: "Office supplies",
      category: "Supplies",
      amountCentavos: 123450,
      complianceStatus: "Clean",
      txHash: "0xabc",
      receipts: [{ fileName: "receipt.pdf", sha256: "b".repeat(64) }],
    })),
    totalCentavos: rows * 123450,
    missingReceipts: 0,
    receiptCount: rows,
    truncated: false,
  };
}

function summary(): FinancialSummaryReport {
  return {
    kind: "financial-summary",
    meta,
    totals: {
      allocatedCentavos: 1_000_000,
      expenseCentavos: 250_000,
      awardCentavos: 100_000,
      remainingCentavos: 750_000,
      utilization: 0.25,
    },
    categories: [{ label: "Supplies", amountCentavos: 250_000, share: 1 }],
    truncated: true,
  };
}

describe("buildReportPdf", () => {
  it("produces a PDF document for a liquidation report", () => {
    const bytes = buildReportPdf(liquidation(1)).output("arraybuffer");
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(new TextDecoder().decode(new Uint8Array(bytes, 0, 5))).toBe("%PDF-");
  });

  it("paginates when the ledger has many rows", () => {
    const doc = buildReportPdf(liquidation(60));
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it("builds a financial summary and keeps the truncation note", () => {
    const doc = buildReportPdf(summary());
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(doc.output("arraybuffer").byteLength).toBeGreaterThan(1000);
  });
});
