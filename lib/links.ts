import type { Link } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { linkStatus } from "@/lib/expiry";
import { RateLimitError, consumeCreateQuota } from "@/lib/rate-limit";
import { SLUG_ATTEMPTS, generateSlug, isReservedSlug } from "@/lib/slug";
import type { CreateLinkInput } from "@/lib/validation";

export { linkStatus };

export class SlugTakenError extends Error {
  constructor() {
    super("That slug is already in use.");
    this.name = "SlugTakenError";
  }
}

export class ReservedSlugError extends Error {
  constructor() {
    super("That slug is reserved.");
    this.name = "ReservedSlugError";
  }
}

type CreateOptions = {
  generate?: () => string;
};

export async function createShortLink(
  ownerId: string,
  input: CreateLinkInput,
  options: CreateOptions = {},
): Promise<Link> {
  const quota = await consumeCreateQuota(ownerId);
  if (!quota.allowed) {
    throw new RateLimitError(quota.limit, quota.retryAfterSeconds);
  }

  const data = {
    destination: input.destination,
    title: input.title ?? null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    ownerId,
  };

  if (input.slug) {
    if (isReservedSlug(input.slug)) throw new ReservedSlugError();
    try {
      return await prisma.link.create({ data: { ...data, slug: input.slug } });
    } catch (error) {
      if (isUniqueViolation(error)) throw new SlugTakenError();
      throw error;
    }
  }

  // The unique index is the real guard. A check-then-insert would still race,
  // so a collision just draws another slug and tries again.
  const generate = options.generate ?? (() => generateSlug());
  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const slug = generate();
    if (isReservedSlug(slug)) continue;
    try {
      return await prisma.link.create({ data: { ...data, slug } });
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }

  throw new Error("Could not allocate a unique slug");
}
