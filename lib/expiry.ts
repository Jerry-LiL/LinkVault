export function linkStatus(
  expiresAt: Date | null,
  now = new Date(),
): "active" | "expired" {
  if (expiresAt && expiresAt.getTime() <= now.getTime()) return "expired";
  return "active";
}
