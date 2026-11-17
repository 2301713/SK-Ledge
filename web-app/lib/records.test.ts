import { describe, expect, it } from "vitest";
import {
  isRecordType,
  RECORD_TABLES,
  RECORD_TYPES,
  sumAmountCentavos,
  type LedgerRecord,
} from "./records";

describe("isRecordType", () => {
  it.each(RECORD_TYPES)("accepts the supported type %s", (type) => {
    expect(isRecordType(type)).toBe(true);
  });

  it.each([
    ["expenses"],
    ["Expense"],
    ["all"],
    [""],
    [null],
    [undefined],
    [42],
    [{}],
  ])("rejects %j", (value) => {
    expect(isRecordType(value)).toBe(false);
  });
});

describe("RECORD_TABLES", () => {
  it("maps every record type to a distinct table", () => {
    const tables = Object.values(RECORD_TABLES);
    expect(tables).toHaveLength(RECORD_TYPES.length);
    expect(new Set(tables).size).toBe(tables.length);
  });
});

describe("sumAmountCentavos", () => {
  const record = (type: LedgerRecord["record_type"], amount: unknown) =>
    ({ record_type: type, amount }) as LedgerRecord;

  it("sums only the requested record type", () => {
    const records = [
      record("expense", 1500),
      record("allocation", 9000),
      record("expense", 250),
      record("award", 700),
    ];

    expect(sumAmountCentavos(records, "expense")).toBe(1750);
    expect(sumAmountCentavos(records, "allocation")).toBe(9000);
    expect(sumAmountCentavos(records, "award")).toBe(700);
  });

  it("returns 0 for an empty ledger", () => {
    expect(sumAmountCentavos([], "expense")).toBe(0);
  });

  it("ignores non-finite amounts instead of producing NaN totals", () => {
    const records = [
      record("expense", 100),
      record("expense", Number.NaN),
      record("expense", Number.POSITIVE_INFINITY),
      record("expense", "not-a-number"),
      record("expense", null),
    ];

    expect(sumAmountCentavos(records, "expense")).toBe(100);
  });

  it("coerces numeric strings like the database driver does", () => {
    const records = [record("expense", "1250"), record("expense", "750")];
    expect(sumAmountCentavos(records, "expense")).toBe(2000);
  });
});
