import { describe, expect, it } from "vitest";
import {
  decodeFunctionResult,
  encodeAbiParameters,
  toFunctionSelector,
  encodeFunctionData,
} from "viem";
import { LEGACY_SK_LEDGE_ABI } from "./legacyContractAbi";

const recordType = [
  { name: "id", type: "uint256" },
  { name: "official", type: "address" },
  { name: "barangay", type: "string" },
  { name: "amount", type: "uint256" },
  { name: "timestamp", type: "uint256" },
  { name: "purpose", type: "string" },
  { name: "recordType", type: "string" },
] as const;

describe("legacy contract ABI", () => {
  it("keeps the historical seven-field record layout", () => {
    const outputs = LEGACY_SK_LEDGE_ABI[0].outputs;
    const components = outputs[0].type === "tuple[]" ? outputs[0].components : [];

    expect(components.map((c) => c.name)).toEqual([
      "id",
      "official",
      "barangay",
      "amount",
      "timestamp",
      "purpose",
      "recordType",
    ]);
    // No approval/void/predecessor fields: that is what makes the current ABI
    // fail to decode this contract's records.
    expect(components.map((c) => c.type)).not.toContain("bool");
  });

  it("resolves getAllRecords() to the same selector the app calls", () => {
    const data = encodeFunctionData({
      abi: LEGACY_SK_LEDGE_ABI,
      functionName: "getAllRecords",
    });

    expect(data.slice(0, 10)).toBe(toFunctionSelector("getAllRecords()"));
  });

  it("decodes a legacy record array without the approval fields", () => {
    const payload = [
      {
        id: BigInt(4),
        official: "0xeFeBaF7D98884e4D7E059189BFfE9b765f442883",
        barangay: "San Luis",
        amount: BigInt(15000),
        timestamp: BigInt(1785930000),
        purpose: "Tennis league 2026",
        recordType: "Allocation",
      },
    ] as const;

    const encoded = encodeAbiParameters([{ type: "tuple[]", components: recordType }], [
      payload as unknown as readonly {
        id: bigint;
        official: `0x${string}`;
        barangay: string;
        amount: bigint;
        timestamp: bigint;
        purpose: string;
        recordType: string;
      }[],
    ]);

    const decoded = decodeFunctionResult({
      abi: LEGACY_SK_LEDGE_ABI,
      functionName: "getAllRecords",
      data: encoded,
    });

    expect(decoded).toHaveLength(1);
    expect(decoded[0].barangay).toBe("San Luis");
    expect(decoded[0].amount).toBe(BigInt(15000));
    expect(decoded[0].recordType).toBe("Allocation");
    expect(decoded[0].purpose).toBe("Tennis league 2026");
  });
});
