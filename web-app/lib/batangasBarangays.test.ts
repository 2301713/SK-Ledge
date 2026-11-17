import { describe, expect, it } from "vitest";
import {
  canonicalizeBarangay,
  isCanonicalBarangay,
  BATANGAS_BARANGAYS,
  BATANGAS_BARANGAYS_BY_MUNICIPALITY,
} from "./batangasBarangays";

describe("canonicalizeBarangay", () => {
  it("resolves a unique barangay name to its canonical identity", () => {
    expect(canonicalizeBarangay("Adia")).toBe("Adia, Agoncillo");
  });

  it("resolves a full canonical value", () => {
    expect(canonicalizeBarangay("Adia, Agoncillo")).toBe("Adia, Agoncillo");
  });

  it("ignores surrounding whitespace and casing", () => {
    expect(canonicalizeBarangay("  aDiA, aGoNcIlLo  ")).toBe(
      "Adia, Agoncillo",
    );
  });

  it("strips a leading 'Barangay' prefix", () => {
    expect(canonicalizeBarangay("Barangay Adia, Agoncillo")).toBe(
      "Adia, Agoncillo",
    );
  });

  it("returns null for a barangay name shared by multiple municipalities", () => {
    // "Poblacion" exists in many Batangas municipalities, so it must stay
    // ambiguous rather than silently resolving to the wrong one.
    expect(canonicalizeBarangay("Poblacion")).toBeNull();
  });

  it("returns null for placeholders and unknown names", () => {
    expect(canonicalizeBarangay("N/A")).toBeNull();
    expect(canonicalizeBarangay("")).toBeNull();
    expect(canonicalizeBarangay("Not A Real Barangay")).toBeNull();
  });
});

describe("isCanonicalBarangay", () => {
  it("accepts a canonical identity", () => {
    expect(isCanonicalBarangay("Adia, Agoncillo")).toBe(true);
  });

  it("rejects a bare barangay name", () => {
    expect(isCanonicalBarangay("Adia")).toBe(false);
  });

  it("rejects an unknown identity", () => {
    expect(isCanonicalBarangay("Adia, Nowhere")).toBe(false);
  });
});

describe("barangay registry integrity", () => {
  it("builds one canonical identity per registry entry", () => {
    const expected = Object.values(BATANGAS_BARANGAYS_BY_MUNICIPALITY).reduce(
      (total, barangays) => total + barangays.length,
      0,
    );

    expect(BATANGAS_BARANGAYS).toHaveLength(expected);
    expect(new Set(BATANGAS_BARANGAYS).size).toBe(expected);
  });
});
