export function parseExpensePurpose(purpose: string) {
  const marker = " — Vendor: ";
  const idx = purpose.indexOf(marker);
  if (idx === -1) return { description: purpose, vendor: null };
  return {
    description: purpose.slice(0, idx),
    vendor: purpose.slice(idx + marker.length),
  };
}