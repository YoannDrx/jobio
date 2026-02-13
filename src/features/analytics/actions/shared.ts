import { z } from "zod";

export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export function computeDateRange(
  historyDays: number,
  startDate?: string,
  endDate?: string,
): { gte: Date; lte?: Date } | undefined {
  if (historyDays >= 99999 && !startDate && !endDate) {
    return undefined;
  }

  const maxStart = new Date();
  maxStart.setDate(maxStart.getDate() - Math.min(historyDays, 3650));

  if (startDate) {
    const requestedStart = new Date(startDate);
    const clampedStart = requestedStart < maxStart ? maxStart : requestedStart;
    const result: { gte: Date; lte?: Date } = { gte: clampedStart };
    if (endDate) {
      result.lte = new Date(endDate);
    }
    return result;
  }

  return { gte: maxStart };
}

export function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0] ?? "";
}

export function parseDurationToDays(duration: string | null): number {
  if (!duration) return 20;
  const lower = duration.toLowerCase().trim();

  const monthsMatch = lower.match(/(\d+)\s*mois/);
  if (monthsMatch) return parseInt(monthsMatch[1], 10) * 20;

  const yearsMatch = lower.match(/(\d+)\s*an/);
  if (yearsMatch) return parseInt(yearsMatch[1], 10) * 220;

  const daysMatch = lower.match(/(\d+)\s*j/);
  if (daysMatch) return parseInt(daysMatch[1], 10);

  const weeksMatch = lower.match(/(\d+)\s*semaine/);
  if (weeksMatch) return parseInt(weeksMatch[1], 10) * 5;

  return 20;
}
