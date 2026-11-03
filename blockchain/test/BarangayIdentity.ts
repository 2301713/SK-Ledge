import { expect } from "chai";
import {
  canonicalizeBarangay,
  getUniqueBarangayAlias,
  BATANGAS_BARANGAY_IDENTITIES,
} from "../../web-app/lib/batangasBarangays.js";

describe("Barangay identity source", function () {
  it("uses municipality-qualified names as canonical identities", function () {
    expect(canonicalizeBarangay("Adia, Agoncillo")).to.equal(
      "Adia, Agoncillo",
    );
    expect(canonicalizeBarangay("  BARANGAY adia  ")).to.equal(
      "Adia, Agoncillo",
    );
  });

  it("does not resolve an unqualified name shared by municipalities", function () {
    expect(canonicalizeBarangay("San Jose")).to.equal(null);
    expect(canonicalizeBarangay("Barangay San Jose")).to.equal(null);
    expect(canonicalizeBarangay("San Jose, Alitagtag")).to.equal(
      "San Jose, Alitagtag",
    );
  });

  it("only emits bare aliases for globally unique barangay names", function () {
    expect(
      new Set(BATANGAS_BARANGAY_IDENTITIES.map((identity) => identity.canonical))
        .size,
    ).to.equal(BATANGAS_BARANGAY_IDENTITIES.length);

    const adia = BATANGAS_BARANGAY_IDENTITIES.find(
      (identity) => identity.canonical === "Adia, Agoncillo",
    );
    const sanJose = BATANGAS_BARANGAY_IDENTITIES.find(
      (identity) => identity.canonical === "San Jose, Alitagtag",
    );

    if (!adia || !sanJose) {
      throw new Error("Expected barangays are missing from the official list.");
    }

    expect(getUniqueBarangayAlias(adia)).to.equal("Adia");
    expect(getUniqueBarangayAlias(sanJose)).to.equal("San Jose, Alitagtag");
  });
});
