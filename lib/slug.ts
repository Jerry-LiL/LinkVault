import { randomBytes } from "node:crypto";

// 32 symbols, so the low 5 bits of a random byte map onto the alphabet evenly.
const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

export const SLUG_LENGTH = 7;
export const SLUG_ATTEMPTS = 5;

export const RESERVED_SLUGS = new Set([
  "api",
  "arrived",
  "dashboard",
  "favicon.ico",
  "login",
  "register",
]);

export function generateSlug(length = SLUG_LENGTH): string {
  const bytes = randomBytes(length);
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += ALPHABET[bytes[i] & 31];
  }
  return slug;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
