export { SK_LEDGE_ABI } from "./contractAbi.generated";
export { LEGACY_SK_LEDGE_ABI } from "./legacyContractAbi";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

/**
 * Optional. An older SK-Ledge deployment whose records the public verifier
 * also lists. There is deliberately no fallback address: set
 * `NEXT_PUBLIC_LEGACY_CONTRACT_ADDRESS` and the legacy lookups run, leave it
 * unset and the verifier only reads the current contract.
 */
export const LEGACY_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_LEGACY_CONTRACT_ADDRESS || undefined) as
  | `0x${string}`
  | undefined;
