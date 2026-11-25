export type Quota = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimitConfig(env: NodeJS.ProcessEnv = process.env): {
  max: number;
  windowSeconds: number;
} {
  const max = Number(env.RATE_LIMIT_MAX ?? 30);
  const windowSeconds = Number(env.RATE_LIMIT_WINDOW_SECONDS ?? 3600);
  if (!Number.isInteger(max) || max < 1) {
    throw new Error("RATE_LIMIT_MAX must be a positive integer");
  }
  if (!Number.isInteger(windowSeconds) || windowSeconds < 1) {
    throw new Error("RATE_LIMIT_WINDOW_SECONDS must be a positive integer");
  }
  return { max, windowSeconds };
}

export function alignWindow(now: Date, windowSeconds: number): Date {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;
  readonly limit: number;

  constructor(limit: number, retryAfterSeconds: number) {
    super("Too many links created in this window.");
    this.name = "RateLimitError";
    this.limit = limit;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
