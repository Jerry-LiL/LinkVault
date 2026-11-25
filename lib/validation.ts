import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

function blankToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function blankSlugToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim().toLowerCase();
  return trimmed === "" ? undefined : trimmed;
}

// datetime-local values have no zone. Store them as UTC.
export function normalizeExpiryInput(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00.000Z`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return `${value}.000Z`;
  return value;
}

const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url("Enter a valid URL")
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Only http and https URLs can be shortened");

export const createLinkSchema = z.object({
  destination: httpUrl,
  slug: z.preprocess(
    blankSlugToUndefined,
    z
      .string()
      .regex(SLUG_PATTERN, "Use 3–32 letters, numbers, or hyphens")
      .optional(),
  ),
  title: z.preprocess(
    blankToUndefined,
    z.string().max(80, "Title must be 80 characters or fewer").optional(),
  ),
  expiresAt: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return normalizeExpiryInput(trimmed);
  }, z.string().datetime({ offset: true, message: "Expiry must be a valid date" }).optional()),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  email: z.string().trim().email("Enter a valid email").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
