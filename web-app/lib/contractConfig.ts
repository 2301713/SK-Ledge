export { SK_LEDGE_ABI } from "./contractAbi.generated";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const LEGACY_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_LEGACY_CONTRACT_ADDRESS ||
  "0xf5b55b756cb4e990bb38352668d4e0209958eac9") as `0x${string}`;