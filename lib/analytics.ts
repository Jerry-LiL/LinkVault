import { prisma } from "@/lib/prisma";
import { ANALYTICS_DAYS, dailyWindowStart, fillDailySeries, type DailyPoint } from "@/lib/series";

export type NamedCount = { name: string; count: number };
export type { DailyPoint };

export async function linkAnalytics(linkId: string, now = new Date()) {
  const since = dailyWindowStart(ANALYTICS_DAYS, now);

  const [total, dailyRows, referrerRows, deviceRows] = await Promise.all([
    prisma.click.count({ where: { linkId } }),
    prisma.$queryRaw<Array<{ day: Date; count: number }>>`
      SELECT (clicked_at AT TIME ZONE 'UTC')::date AS day,
             COUNT(*)::int AS count
      FROM clicks
      WHERE link_id = ${linkId}
        AND clicked_at >= ${since}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<Array<{ name: string; count: number }>>`
      SELECT COALESCE(referrer, 'Direct') AS name,
             COUNT(*)::int AS count
      FROM clicks
      WHERE link_id = ${linkId}
      GROUP BY 1
      ORDER BY count DESC, name ASC
      LIMIT 8
    `,
    prisma.$queryRaw<Array<{ name: string; count: number }>>`
      SELECT device AS name,
             COUNT(*)::int AS count
      FROM clicks
      WHERE link_id = ${linkId}
      GROUP BY device
      ORDER BY count DESC, device ASC
    `,
  ]);

  const referrers = referrerRows.map((row) => ({ name: row.name, count: Number(row.count) }));
  const devices = deviceRows.map((row) => ({ name: row.name, count: Number(row.count) }));

  return {
    total,
    daily: fillDailySeries(dailyRows, ANALYTICS_DAYS, now),
    referrers,
    devices,
  };
}
