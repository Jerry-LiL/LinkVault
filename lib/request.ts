import { NextResponse } from "next/server";

export async function readFields(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new MalformedBodyError();
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new MalformedBodyError();
    }
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value == null) fields[key] = "";
      else if (typeof value === "string" || typeof value === "number") fields[key] = String(value);
    }
    return fields;
  }

  const form = await request.formData();
  const fields: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") fields[key] = value;
  }
  return fields;
}

export class MalformedBodyError extends Error {
  constructor() {
    super("The request body could not be read.");
    this.name = "MalformedBodyError";
  }
}

export function wantsJson(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return type.includes("application/json") || accept.includes("application/json");
}

export function isHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return new URL(request.url).protocol === "https:";
}

export function originFromRequest(request: Request): string {
  const url = new URL(request.url);
  // Next can report request.url as localhost even when the browser used
  // another host. Prefer the host the client actually called.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return url.origin;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function redirectTo(request: Request, path: string, params?: Record<string, string>) {
  const url = new URL(path, originFromRequest(request));
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url, 303);
}
