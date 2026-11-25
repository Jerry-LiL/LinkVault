import { NextResponse } from "next/server";
import { isHttps, redirectTo, wantsJson } from "@/lib/request";
import { SESSION_COOKIE, destroyCurrentSession } from "@/lib/session";

export async function POST(request: Request) {
  await destroyCurrentSession();
  const cleared = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps(request),
    path: "/",
    maxAge: 0,
  };

  if (wantsJson(request)) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", cleared);
    return response;
  }

  const response = redirectTo(request, "/");
  response.cookies.set(SESSION_COOKIE, "", cleared);
  return response;
}
