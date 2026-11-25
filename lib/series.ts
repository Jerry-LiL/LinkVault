export type DailyPoint = { day: string; count: number };

const DAY_MS = 86_400_000;
export const ANALYTICS_DAYS = 14;

export function dailyWindowStart(days: number, now = new Date()): Date {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(todayUtc - (days - 1) * DAY_MS);
}

export function dayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

// SQL groups the days that have visits. This only fills the quiet days so the
// chart axis stays even.
export function fillDailySeries(
  rows: Array<{ day: Date | string; count: number }>,
  days = ANALYTICS_DAYS,
  now = new Date(),
): DailyPoint[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.day instanceof Date ? dayKey(row.day) : String(row.day).slice(0, 10);
    counts.set(key, Number(row.count));
  }

  const start = dailyWindowStart(days, now).getTime();
  const points: DailyPoint[] = [];
  for (let i = 0; i < days; i++) {
    const key = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
    points.push({ day: key, count: counts.get(key) ?? 0 });
  }
  return points;
}
