import { describe, expect, it } from "vitest";
import type { LedgerRecord } from "./records";
import {
  buildFinancialSummaryReport,
  buildLiquidationReport,
  isInPeriod,
  manilaDate,
  reportFileName,
  type ReportMeta,
} from "./reports";

const meta: ReportMeta = {
  barangay: "Adia, Agoncillo",
  periodStart: "2026-01-01",
  periodEnd: "2026-03-31",
  generatedBy: "Maria Santos",
  generatedAt: "2026-04-01T08:00:00.000Z",
  includeReceipts: true,
};

function expense(
  id: string,
  amount: number,
  createdAt: string,
  overrides: Partial<LedgerRecord> = {},
): LedgerRecord {
  return {
    id,
    record_type: "expense",
    amount,
    created_at: createdAt,
    payee: "Supplier",
    purpose: "Office supplies",
    category: "Supplies",
    dv_number: "DV-001",
    compliance_status: "Clean",
    blockchain_tx_hash: "0xabc",
    ...overrides,
  };
}

describe("isInPeriod", () => {
  it("uses Manila calendar days for the period boundary", () => {
    expect(isInPeriod("2026-03-01T16:30:00.000Z", "2026-03-02", "2026-03-02")).toBe(
      true,
    );
    expect(isInPeriod("2026-02-28T15:59:00.000Z", "2026-03-01", "2026-03-31")).toBe(
      false,
    );
    expect(isInPeriod("2026-02-28T16:00:00.000Z", "2026-03-01", "2026-03-31")).toBe(
      true,
    );
  });

  it("rejects missing or invalid timestamps", () => {
    expect(isInPeriod(null, "2026-01-01", "2026-12-31")).toBe(false);
    expect(isInPeriod("not-a-date", "2026-01-01", "2026-12-31")).toBe(false);
    expect(manilaDate("2026-06-15T04:00:00.000Z")).toBe("2026-06-15");
  });
});

describe("buildLiquidationReport", () => {
  it("includes only expenses in the period, oldest first, and totals them", () => {
    const records: LedgerRecord[] = [
      expense("late", 30000, "2026-03-10T02:00:00.000Z"),
      expense("early", 10050, "2026-01-05T02:00:00.000Z"),
      expense("outside", 99900, "2026-04-01T02:00:00.000Z"),
      {
        id: "allocation-1",
        record_type: "allocation",
        amount: 500000,
        created_at: "2026-02-01T02:00:00.000Z",
      },
    ];

    const report = buildLiquidationReport(records, {}, meta);

    expect(report.rows.map((row) => row.date)).toEqual([
      "2026-01-05",
      "2026-03-10",
    ]);
    expect(report.totalCentavos).toBe(40050);
    expect(report.receiptCount).toBe(0);
    expect(report.missingReceipts).toBe(2);
    expect(report.truncated).toBe(false);
  });

  it("attaches receipts by expense id and counts missing ones", () => {
    const records = [
      expense("with-receipt", 10000, "2026-02-01T02:00:00.000Z"),
      expense("without-receipt", 20000, "2026-02-02T02:00:00.000Z"),
    ];

    const report = buildLiquidationReport(
      records,
      {
        "with-receipt": [
          { fileName: "receipt.pdf", sha256: "a".repeat(64) },
        ],
      },
      meta,
    );

    expect(report.receiptCount).toBe(1);
    expect(report.missingReceipts).toBe(1);
    expect(report.rows[0].receipts[0].fileName).toBe("receipt.pdf");
    expect(report.rows[1].receipts).toEqual([]);
  });

  it("does not report missing receipts when receipts were excluded", () => {
    const report = buildLiquidationReport(
      [expense("one", 10000, "2026-02-01T02:00:00.000Z")],
      {},
      { ...meta, includeReceipts: false },
    );

    expect(report.missingReceipts).toBeNull();
  });
});

describe("buildFinancialSummaryReport", () => {
  it("sums each record type, remaining balance, utilization, and categories", () => {
    const records: LedgerRecord[] = [
      {
        record_type: "allocation",
        amount: 1_000_000,
        created_at: "2026-01-10T02:00:00.000Z",
      },
      expense("e1", 200_000, "2026-01-11T02:00:00.000Z", {
        category: "Supplies",
      }),
      expense("e2", 50_000, "2026-01-12T02:00:00.000Z", {
        category: "Travel",
      }),
      expense("e3", 50_000, "2026-01-13T02:00:00.000Z", {
        category: "Supplies",
      }),
      {
        record_type: "award",
        amount: 300_000,
        created_at: "2026-01-20T02:00:00.000Z",
      },
      expense("outside", 999_999, "2025-12-31T02:00:00.000Z"),
    ];

    const report = buildFinancialSummaryReport(records, meta);

    expect(report.totals).toEqual({
      allocatedCentavos: 1_000_000,
      expenseCentavos: 300_000,
      awardCentavos: 300_000,
      remainingCentavos: 700_000,
      utilization: 0.3,
    });
    expect(report.categories).toEqual([
      { label: "Supplies", amountCentavos: 250_000, share: 250_000 / 300_000 },
      { label: "Travel", amountCentavos: 50_000, share: 50_000 / 300_000 },
    ]);
  });

  it("handles an empty period without dividing by zero", () => {
    const report = buildFinancialSummaryReport([], meta);

    expect(report.totals.utilization).toBe(0);
    expect(report.categories).toEqual([]);
  });
});

describe("record window cap", () => {
  it("flags reports built from the capped record window", () => {
    const records = Array.from({ length: 500 }, (_, index) =>
      expense(`e${index}`, 100, "2026-02-01T02:00:00.000Z"),
    );

    expect(buildLiquidationReport(records, {}, meta).truncated).toBe(true);
  });
});

describe("reportFileName", () => {
  it("slugifies the barangay and includes the period", () => {
    expect(reportFileName("liquidation", "Adia, Agoncillo", "2026-01-01", "2026-03-31")).toBe(
      "liquidation-report_adia-agoncillo_2026-01-01_2026-03-31.pdf",
    );
    expect(reportFileName("financial-summary", "Peñarrubia", "2026-01-01", "2026-01-31")).toBe(
      "financial-summary_penarrubia_2026-01-01_2026-01-31.pdf",
    );
  });
});
