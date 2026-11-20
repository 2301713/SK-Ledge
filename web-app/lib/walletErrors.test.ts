import { describe, expect, it } from "vitest";
import { describeWalletError } from "./walletErrors";

const FALLBACK = "Transaction failed. Please try again.";

describe("describeWalletError", () => {
  it("falls back when there is no error", () => {
    expect(describeWalletError(null)).toBe(FALLBACK);
  });

  it("detects a wallet rejection by error code", () => {
    expect(
      describeWalletError({
        shortMessage: "User rejected the request.",
        code: 4001,
      }),
    ).toBe("Transaction was rejected in your wallet.");
  });

  it("detects a wallet rejection nested in the cause chain", () => {
    expect(
      describeWalletError({
        message: "An internal error was received.",
        cause: { message: "User rejected the request." },
      }),
    ).toBe("Transaction was rejected in your wallet.");
  });

  it("reports the barangay authorization revert accurately", () => {
    expect(
      describeWalletError({
        shortMessage:
          "Execution reverted with reason: SkLedge: Your wallet is not authorized for this barangay.",
        cause: {
          data: {
            message:
              "SkLedge: Your wallet is not authorized for this barangay.",
          },
        },
      }),
    ).toContain("not authorized for your barangay");
  });

  it("explains the ceiling authorization revert without naming a federation role", () => {
    const message = describeWalletError({
      message:
        "SkLedge: Only the owner or an official of this barangay can set a ceiling",
    });

    expect(message).toContain("contract owner or an authorized official");
    expect(message.toLowerCase()).not.toContain("federation");
  });

  it("explains a ceiling breach", () => {
    expect(
      describeWalletError({ message: "SkLedge: Allocation exceeds ceiling" }),
    ).toContain("exceeds the barangay's configured ceiling");
  });

  it("detects an unsupported network", () => {
    expect(
      describeWalletError({
        message: "Chain mismatch: Expected chain 11155111",
      }),
    ).toContain("Sepolia");
  });

  it("detects insufficient gas funds", () => {
    expect(
      describeWalletError({ details: "insufficient funds for gas * price" }),
    ).toContain("Sepolia ETH");
  });

  it("returns the fallback for an unrecognised failure", () => {
    expect(describeWalletError({ message: "some unexpected RPC error" })).toBe(
      FALLBACK,
    );
  });

  it("uses a caller-supplied fallback", () => {
    expect(
      describeWalletError({ message: "unknown" }, "Could not submit this record."),
    ).toBe("Could not submit this record.");
  });
});
