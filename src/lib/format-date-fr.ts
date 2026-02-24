const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/**
 * Converts date strings to French textual format.
 * - "2025-01" → "janvier 2025"
 * - "2025" → "2025"
 * - null/undefined → null
 */
export function formatDateFr(date: string | null | undefined): string | null {
  if (!date) return null;

  const parts = date.split("-");
  if (parts.length === 2) {
    const year = parts[0];
    const monthIndex = Number(parts[1]) - 1;
    const monthName = MONTHS_FR[monthIndex];
    if (monthName) {
      return `${monthName} ${year}`;
    }
  }

  return date;
}
