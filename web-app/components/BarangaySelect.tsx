// components/BarangaySelect.tsx
"use client";

import React from "react";
import { CANONICAL_BARANGAYS, Barangay } from "@/lib/barangay";

interface BarangaySelectProps {
  value: number | "";
  onChange: (id: number) => void;
}

export const BarangaySelect: React.FC<BarangaySelectProps> = ({ value, onChange }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))}
    >
      <option value="">Pumili ng Barangay</option>
      {CANONICAL_BARANGAYS.map((b: Barangay) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
};