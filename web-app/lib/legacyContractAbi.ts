/**
 * ABI fragment for the earlier SK-Ledge deployment (the one at
 * `0xf5b55b756cb4e990bb38352668d4e0209958eac9` on Sepolia, if that is the
 * address configured in `NEXT_PUBLIC_LEGACY_CONTRACT_ADDRESS`).
 *
 * That deployment predates COA confirmation, document hashes, voiding and
 * barangay canonicalization, so its `FinancialRecord` struct has seven fields.
 * Decoding it with the current `SK_LEDGE_ABI` fails with
 * `Bytes value "8" is not a valid boolean`, because the current struct expects
 * `approved` (bool) and `approvedBy` (address) after `recordType`.
 *
 * Keep this fragment deliberately small: the public verifier only reads
 * `getAllRecords()`, and nothing in the app writes to the legacy contract.
 */
export const LEGACY_SK_LEDGE_ABI = [
  {
    type: "function",
    name: "getAllRecords",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        name: "",
        components: [
          { name: "id", type: "uint256" },
          { name: "official", type: "address" },
          { name: "barangay", type: "string" },
          { name: "amount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "purpose", type: "string" },
          { name: "recordType", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

/** One record as returned by the legacy contract's `getAllRecords()`. */
export type LegacyOnChainRecord = {
  id: bigint;
  official: string;
  barangay: string;
  amount: bigint;
  timestamp: bigint;
  purpose: string;
  recordType: string;
};
