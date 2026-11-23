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

  it("keeps centavos", () => {
    expect(parsePesoInput("25000.50")).toMatchObject({
      ok: true,
      centavos: 2_500_050,
      hasCentavos: true,
    });
  });

  it("rejects a third decimal place instead of rounding", () => {
    expect(parsePesoInput("10.555").ok).toBe(false);
  });

  it("rejects empty and zero amounts", () => {
    for (const input of ["", "  ", "0", "0.00", "abc"]) {
      expect(parsePesoInput(input).ok).toBe(false);
    }
  });
});

describe("pesosInWords", () => {
  it("spells out values across scales", () => {
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

  it("omits centavos for whole pesos", () => {
    const described = describePesoInput("1500");
    expect(described.ok && described.text).not.toContain("centavos");
    expect(described.ok && described.text).toContain("pesos");
  });
});
