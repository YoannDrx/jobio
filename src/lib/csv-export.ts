/**
 * Generate a CSV string from an array of objects.
 *
 * @param rows - Array of objects to convert to CSV
 * @param columns - Column definitions: { key, header }
 * @returns CSV string with BOM for Excel compatibility
 */
export function generateCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T & string; header: string }[],
): string {
  const escapeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = columns.map((c) => escapeCsvValue(c.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((c) => escapeCsvValue(row[c.key])).join(","),
  );

  // BOM for Excel UTF-8 compatibility
  return `\uFEFF${[headerLine, ...dataLines].join("\n")}`;
}

/**
 * Download a CSV string as a file in the browser.
 *
 * @param csv - CSV string content
 * @param filename - Name of the downloaded file
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
