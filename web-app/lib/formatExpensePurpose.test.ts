import { describe, expect, it } from "vitest";
import { parseExpensePurpose } from "./formatExpensePurpose";

describe("parseExpensePurpose", () => {
  it("splits the vendor marker out of the description", () => {
    expect(
      parseExpensePurpose("Office supplies — Vendor: Acme Trading"),
    ).toEqual({
      description: "Office supplies",
      vendor: "Acme Trading",
    });
  });

  it("returns a null vendor when there is no marker", () => {
    expect(parseExpensePurpose("Office supplies")).toEqual({
      description: "Office supplies",
      vendor: null,
    });
  });

  it("keeps everything after the first marker as the vendor", () => {
    expect(
      parseExpensePurpose("Repair — Vendor: Acme — Vendor: Other"),
    ).toEqual({
      description: "Repair",
      vendor: "Acme — Vendor: Other",
    });
  });

  it("handles an empty purpose", () => {
    expect(parseExpensePurpose("")).toEqual({
      description: "",
      vendor: null,
    });
  });
});
