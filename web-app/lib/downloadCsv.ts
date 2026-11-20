import { toCsv } from "./reports";

/**
 * Download tabular data as a UTF-8 CSV. The BOM keeps Excel from misreading
 * the file as ANSI, and `toCsv` escapes cells and neutralises formula prefixes.
 */
export function downloadCsv(
  fileName: string,
  rows: readonly (readonly (string | number | null)[])[],
): void {
  const blob = new Blob(["\uFEFF", toCsv(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
