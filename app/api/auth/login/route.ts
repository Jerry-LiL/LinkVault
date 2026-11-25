import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { MalformedBodyError, readFields, redirectTo, wantsJson } from "@/lib/request";
import { SESSION_COOKIE, createSession, sessionCookieOptions } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const json = wantsJson(request);

  try {
    const input = loginSchema.parse(await readFields(request));
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const matches = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!user || !matches) {
      if (json) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      return redirectTo(request, "/login", { error: "credentials" });
    }

    const token = await createSession(user.id);
    if (json) {
      const response = NextResponse.json({ id: user.id, email: user.email });
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(request));
      return response;
    }

    const response = redirectTo(request, "/dashboard");
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(request));
    return response;
  } catch (error) {
    if (error instanceof ZodError || error instanceof MalformedBodyError) {
      if (json) return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
      return redirectTo(request, "/login", { error: "invalid" });
    }
    throw error;
  }
}
