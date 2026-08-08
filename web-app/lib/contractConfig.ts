<<<<<<< HEAD
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "") as `0x${string}`;

export const LEGACY_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_LEGACY_CONTRACT_ADDRESS ||
  "0xf5b55b756cb4e990bb38352668d4e0209958eac9") as `0x${string}`;
=======
export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;
>>>>>>> johnrey/smart-contract-deployment

export const SK_LEDGE_ABI = [
  {
    type: "function",
    name: "addRecord",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_barangay", type: "string" },
      { name: "_amount", type: "uint256" },
      { name: "_purpose", type: "string" },
      { name: "_recordType", type: "string" },
    ],
  },
  {
    type: "function",
    name: "getAllRecords",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
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
] as const;