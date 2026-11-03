// lib/barangay.ts
export interface Barangay {
  id: number;
  name: string;
}

export const CANONICAL_BARANGAYS: Barangay[] = [
  { id: 1, name: "Sample Barangay 1" },
  { id: 2, name: "Sample Barangay 2" },
];