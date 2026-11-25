export const DEVICES = ["desktop", "mobile", "tablet", "bot"] as const;

export type Device = (typeof DEVICES)[number];

export function classifyDevice(userAgent: string | null | undefined): Device {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return "desktop";
  if (/(bot|crawler|spider|slurp|facebookexternalhit|preview)/.test(ua)) return "bot";
  if (/(ipad|tablet|kindle|playbook)/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua))) {
    return "tablet";
  }
  if (/(mobi|iphone|ipod|android|phone)/.test(ua)) return "mobile";
  return "desktop";
}
