import { describe, expect, it } from "vitest";
import { describePesoInput, parsePesoInput, pesosInWords } from "./money";

describe("parsePesoInput", () => {
  it("converts whole pesos to centavos", () => {
    expect(parsePesoInput("25000")).toMatchObject({
      ok: true,
      centavos: 2_500_000,
      hasCentavos: false,
    });
  });

  it("keeps centavos instead of rounding them away", () => {
    expect(parsePesoInput("25000.50")).toMatchObject({
      ok: true,
      centavos: 2_500_050,
      hasCentavos: true,
    });
    expect(parsePesoInput("0.05")).toMatchObject({ centavos: 5 });
  });

  it("accepts thousand separators and the peso sign", () => {
    expect(parsePesoInput("₱1,234.56")).toMatchObject({
      ok: true,
      centavos: 123_456,
    });
  });

  it("treats trailing zeros as whole pesos", () => {
    expect(parsePesoInput("1500.00")).toMatchObject({
      ok: true,
      hasCentavos: false,
    });
  });

  it("rejects a third decimal place rather than silently rounding", () => {
    const result = parsePesoInput("10.555");
    expect(result.ok).toBe(false);
  });

  it("rejects empty, malformed, and zero amounts", () => {
    for (const input of ["", "   ", ".", "abc", "1.2.3", "0", "0.00"]) {
      expect(parsePesoInput(input).ok).toBe(false);
    }
  });
});

describe("pesosInWords", () => {
  it("spells out values across scales", () => {
    expect(pesosInWords(0)).toBe("zero");
    expect(pesosInWords(15)).toBe("fifteen");
    expect(pesosInWords(25_000)).toBe("twenty-five thousand");
    expect(pesosInWords(1_234_567)).toBe(
      "one million two hundred thirty-four thousand five hundred sixty-seven",
    );
  });
});

describe("describePesoInput", () => {
  it("names centavos explicitly", () => {
    const described = describePesoInput("1500.50");
    expect(described.ok && described.text).toContain("50/100 centavos");
  });

  it("says nothing about centavos for whole pesos", () => {
    const described = describePesoInput("1500");
    expect(described.ok && described.text).not.toContain("centavos");
    expect(described.ok && described.text).toContain("one thousand five hundred pesos");
  });

  it("passes the parse error through", () => {
    expect(describePesoInput("10.555").ok).toBe(false);
  });
});
