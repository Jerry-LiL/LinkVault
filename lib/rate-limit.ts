import { prisma } from "@/lib/prisma";
import { alignWindow, rateLimitConfig, type Quota } from "@/lib/quota";

const LOCK_NAMESPACE = 481516;

export { RateLimitError } from "@/lib/quota";
export type { Quota };

// Fixed window per user. The advisory lock makes the read-and-increment
// atomic for that account, and Postgres releases it at the end of the
// transaction.
export async function consumeCreateQuota(userId: string, now = new Date()): Promise<Quota> {
  const { max, windowSeconds } = rateLimitConfig();
  const windowStart = alignWindow(now, windowSeconds);
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStart.getTime() + windowSeconds * 1000 - now.getTime()) / 1000),
  );

  const outcome = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_NAMESPACE}::int, hashtext(${userId}))`;

    const existing = await tx.rateLimitBucket.findUnique({
      where: { userId_windowStart: { userId, windowStart } },
    });

    if (existing && existing.count >= max) {
      return { allowed: false as const, count: existing.count };
    }

    const bucket = await tx.rateLimitBucket.upsert({
      where: { userId_windowStart: { userId, windowStart } },
      create: { userId, windowStart, count: 1 },
      update: { count: { increment: 1 } },
    });

    return { allowed: true as const, count: bucket.count };
  });

  if (!outcome.allowed) {
    return { allowed: false, limit: max, remaining: 0, retryAfterSeconds };
  }

  return {
    allowed: true,
    limit: max,
    remaining: Math.max(0, max - outcome.count),
    retryAfterSeconds: 0,
  };
}
