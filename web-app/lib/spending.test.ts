import { describe, expect, it } from "vitest";
import { BATANGAS_BARANGAYS } from "./batangasBarangays";
import { sumBarangayCentavos, type LedgerAmountEntry } from "./spending";

const BARANGAY = "Adia, Agoncillo";
const OTHER_BARANGAY = BATANGAS_BARANGAYS.find(
  (barangay) => barangay !== BARANGAY,
) as string;

const entry = (
  overrides: Partial<LedgerAmountEntry> = {},
): LedgerAmountEntry => ({
  type: "Expense",
  barangay: BARANGAY,
  amount: 1_000,
  voided: false,
  ...overrides,
});

describe("sumBarangayCentavos", () => {
  it("sums on-chain Expense records for the barangay", () => {
    const total = sumBarangayCentavos(
      [entry({ amount: 12_500 }), entry({ amount: BigInt(7_500) })],
      "expense",
      BARANGAY,
    );

    expect(total).toBe(20_000);
  });

  it("accepts the synced snake_case record type", () => {
    const total = sumBarangayCentavos(
      [entry({ type: "expense", amount: "2500" })],
      "expense",
      BARANGAY,
    );

    expect(total).toBe(2_500);
  });

  it("ignores other record types", () => {
    const total = sumBarangayCentavos(
      [
        entry({ type: "Allocation", amount: 90_000 }),
        entry({ type: "Award", amount: 50_000 }),
        entry({ amount: 1_000 }),
      ],
      "expense",
      BARANGAY,
    );

    expect(total).toBe(1_000);
  });

  it("ignores voided records", () => {
    const total = sumBarangayCentavos(
      [entry({ voided: true }), entry({ amount: 400 })],
      "expense",
      BARANGAY,
    );

    expect(total).toBe(400);
  });

  it("ignores records from other barangays", () => {
    const total = sumBarangayCentavos(
      [entry({ barangay: OTHER_BARANGAY, amount: 9_999 }), entry()],
      "expense",
      BARANGAY,
    );

    expect(total).toBe(1_000);
  });

  it("matches barangay names that canonicalize to the target", () => {
    const total = sumBarangayCentavos(
      [entry({ barangay: "  bArAnGaY aDiA, aGoNcIlLo  " })],
      "expense",
      BARANGAY,
    );

    expect(total).toBe(1_000);
  });

  it("returns 0 when the target barangay is missing or ambiguous", () => {
    expect(
      sumBarangayCentavos([entry()], "expense", "Not A Real Barangay"),
    ).toBe(0);
    expect(sumBarangayCentavos([entry()], "expense", "")).toBe(0);
    expect(sumBarangayCentavos([entry()], "expense", null)).toBe(0);
  });

  it("skips missing, non-numeric, zero, and negative amounts", () => {
    const total = sumBarangayCentavos(
      [
        entry({ amount: null }),
        entry({ amount: undefined }),
        entry({ amount: "not-a-number" }),
        entry({ amount: 0 }),
        entry({ amount: -500 }),
        entry({ amount: Number.NaN }),
      ],
      "expense",
      BARANGAY,
    );

    expect(total).toBe(0);
  });

  it("treats a zero-ceiling scenario as plain spending (caller decides the cap)", () => {
    const total = sumBarangayCentavos([entry()], "expense", BARANGAY);

    expect(total).toBeGreaterThan(0);
  });
});
