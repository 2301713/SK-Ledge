import type { LedgerRecord } from "./records";

export const REPORT_KINDS = ["liquidation", "financial-summary"] as const;

export type ReportKind = (typeof REPORT_KINDS)[number];

export interface ReportMeta {
  barangay: string;
  periodStart: string;
  periodEnd: string;
  generatedBy: string;
  generatedAt: string;
  includeReceipts: boolean;
}

export interface ReceiptAttachment {
  fileName: string;
  sha256: string;
}

/** Receipts keyed by `documents.expense_id`. */
export type ReceiptLookup = Record<string, ReceiptAttachment[]>;

export interface LiquidationRow {
  date: string;
  dvNumber: string;
  payee: string;
  purpose: string;
  category: string;
  amountCentavos: number;
  complianceStatus: string;
  txHash: string;
  receipts: ReceiptAttachment[];
}

export interface LiquidationReport {
  kind: "liquidation";
  meta: ReportMeta;
  rows: LiquidationRow[];
  totalCentavos: number;
  /** Null when receipts were excluded from the request. */
  missingReceipts: number | null;
  receiptCount: number;
  truncated: boolean;
}

export interface CategoryTotal {
  label: string;
  amountCentavos: number;
  share: number;
}

export interface FinancialSummaryReport {
  kind: "financial-summary";
  meta: ReportMeta;
  totals: {
    allocatedCentavos: number;
    expenseCentavos: number;
    awardCentavos: number;
    remainingCentavos: number;
    utilization: number;
  };
  categories: CategoryTotal[];
  truncated: boolean;
}

export type GeneratedReport = LiquidationReport | FinancialSummaryReport;

const MANILA_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const MAX_RECORDS_NOTE = 500;

function toCentavos(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

/** Calendar date (YYYY-MM-DD) in Philippine time, or "" for a bad timestamp. */
export function manilaDate(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : MANILA_DATE.format(date);
}

export function isInPeriod(
  value: unknown,
  startDate: string,
  endDate: string,
): boolean {
  const date = manilaDate(value);
  return date.length > 0 && date >= startDate && date <= endDate;
}

export function expensesInPeriod(
  records: readonly LedgerRecord[],
  meta: Pick<ReportMeta, "periodStart" | "periodEnd">,
): LedgerRecord[] {
  return records.filter(
    (record) =>
      record.record_type === "expense" &&
      isInPeriod(record.created_at, meta.periodStart, meta.periodEnd),
  );
}

export function buildLiquidationReport(
  records: readonly LedgerRecord[],
  receipts: ReceiptLookup,
  meta: ReportMeta,
): LiquidationReport {
  const expenses = expensesInPeriod(records, meta)
    .slice()
    .sort((a, b) => {
      const aTime = a.created_at ? Date.parse(a.created_at) : 0;
      const bTime = b.created_at ? Date.parse(b.created_at) : 0;
      return aTime - bTime;
    });

  const rows: LiquidationRow[] = expenses.map((expense) => {
    const attachments =
      typeof expense.id === "string" ? receipts[expense.id] ?? [] : [];

    return {
      date: manilaDate(expense.created_at),
      dvNumber: String(expense.dv_number ?? expense.reference_number ?? ""),
      payee: String(expense.payee ?? ""),
      purpose: String(expense.purpose ?? ""),
      category: String(expense.category ?? "Uncategorized"),
      amountCentavos: toCentavos(expense.amount),
      complianceStatus: String(expense.compliance_status ?? "Pending"),
      txHash: String(expense.blockchain_tx_hash ?? ""),
      receipts: attachments,
    };
  });

  return {
    kind: "liquidation",
    meta,
    rows,
    totalCentavos: rows.reduce((total, row) => total + row.amountCentavos, 0),
    missingReceipts: meta.includeReceipts
      ? rows.filter((row) => row.receipts.length === 0).length
      : null,
    receiptCount: rows.reduce((total, row) => total + row.receipts.length, 0),
    truncated: records.length >= MAX_RECORDS_NOTE,
  };
}

export function buildFinancialSummaryReport(
  records: readonly LedgerRecord[],
  meta: ReportMeta,
): FinancialSummaryReport {
  const inPeriod = records.filter((record) =>
    isInPeriod(record.created_at, meta.periodStart, meta.periodEnd),
  );

  const sumType = (type: LedgerRecord["record_type"]) =>
    inPeriod
      .filter((record) => record.record_type === type)
      .reduce((total, record) => total + toCentavos(record.amount), 0);

  const allocatedCentavos = sumType("allocation");
  const expenseCentavos = sumType("expense");
  const awardCentavos = sumType("award");

  const categoryTotals = new Map<string, number>();
  for (const expense of inPeriod) {
    if (expense.record_type !== "expense") {
      continue;
    }
    const label = String(expense.category ?? "").trim() || "Uncategorized";
    categoryTotals.set(
      label,
      (categoryTotals.get(label) ?? 0) + toCentavos(expense.amount),
    );
  }

  const categories: CategoryTotal[] = [...categoryTotals.entries()]
    .map(([label, amountCentavos]) => ({
      label,
      amountCentavos,
      share: expenseCentavos > 0 ? amountCentavos / expenseCentavos : 0,
    }))
    .sort((a, b) => b.amountCentavos - a.amountCentavos);

  return {
    kind: "financial-summary",
    meta,
    totals: {
      allocatedCentavos,
      expenseCentavos,
      awardCentavos,
      remainingCentavos: allocatedCentavos - expenseCentavos,
      utilization:
        allocatedCentavos > 0 ? expenseCentavos / allocatedCentavos : 0,
    },
    categories,
    truncated: records.length >= MAX_RECORDS_NOTE,
  };
}

export function buildReport(
  kind: ReportKind,
  records: readonly LedgerRecord[],
  receipts: ReceiptLookup,
  meta: ReportMeta,
): GeneratedReport {
  return kind === "liquidation"
    ? buildLiquidationReport(records, receipts, meta)
    : buildFinancialSummaryReport(records, meta);
}

export function formatPesos(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/**
 * Escape a CSV cell. Text starting with a formula character is prefixed with
 * an apostrophe so spreadsheet software does not evaluate user-entered names,
 * purposes, or references as formulas.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  let text = String(value);
  if (typeof value === "string" && /^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv(rows: readonly (readonly (string | number | null)[])[]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function metaRows(meta: ReportMeta, title: string): (string | number)[][] {
  return [
    [title],
    ["Barangay", meta.barangay],
    ["Period", `${meta.periodStart} to ${meta.periodEnd}`],
    ["Generated By", meta.generatedBy],
    ["Generated At", meta.generatedAt],
    ["Receipt Attachments", meta.includeReceipts ? "Included" : "Excluded"],
    [],
  ];
}

export function liquidationToCsv(report: LiquidationReport): string {
  const rows: (string | number | null)[][] = [
    ...metaRows(report.meta, "SK-Ledge Liquidation Report"),
    [
      "Date",
      "DV / Reference",
      "Payee",
      "Purpose",
      "Category",
      "Amount (PHP)",
      "Compliance",
      "On-chain Tx",
      "Receipts Filed",
      "Receipt SHA-256",
    ],
    ...report.rows.map((row) => [
      row.date,
      row.dvNumber,
      row.payee,
      row.purpose,
      row.category,
      formatPesos(row.amountCentavos),
      row.complianceStatus,
      row.txHash,
      row.receipts.map((receipt) => receipt.fileName).join("; "),
      row.receipts.map((receipt) => receipt.sha256).join("; "),
    ]),
    [
      "TOTAL",
      "",
      "",
      "",
      "",
      formatPesos(report.totalCentavos),
      "",
      "",
      String(report.receiptCount),
      "",
    ],
  ];

  if (report.truncated) {
    rows.push([]);
    rows.push([
      `Note: report covers the ${MAX_RECORDS_NOTE} most recent ledger records in this period.`,
    ]);
  }

  return toCsv(rows);
}

export function financialSummaryToCsv(report: FinancialSummaryReport): string {
  const { totals } = report;
  const rows: (string | number | null)[][] = [
    ...metaRows(report.meta, "SK-Ledge Financial Summary"),
    ["Metric", "Value"],
    ["Total Allocated (PHP)", formatPesos(totals.allocatedCentavos)],
    ["Total Expenses (PHP)", formatPesos(totals.expenseCentavos)],
    ["Total Contract Awards (PHP)", formatPesos(totals.awardCentavos)],
    [
      "Remaining Balance, Allocated - Expenses (PHP)",
      formatPesos(totals.remainingCentavos),
    ],
    ["Budget Utilization", formatPercent(totals.utilization)],
    [],
    ["Expense Category", "Amount (PHP)", "Share of Expenses"],
    ...report.categories.map((category) => [
      category.label,
      formatPesos(category.amountCentavos),
      formatPercent(category.share),
    ]),
  ];

  if (report.truncated) {
    rows.push([]);
    rows.push([
      `Note: report covers the ${MAX_RECORDS_NOTE} most recent ledger records in this period.`,
    ]);
  }

  return toCsv(rows);
}

export function reportToCsv(report: GeneratedReport): string {
  return report.kind === "liquidation"
    ? liquidationToCsv(report)
    : financialSummaryToCsv(report);
}

export function reportFileName(
  kind: ReportKind,
  barangay: string,
  startDate: string,
  endDate: string,
): string {
  const slug =
    barangay
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "sk";

  const prefix =
    kind === "liquidation" ? "liquidation-report" : "financial-summary";

  return `${prefix}_${slug}_${startDate}_${endDate}.csv`;
}
