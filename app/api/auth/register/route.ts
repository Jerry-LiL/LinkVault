import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { hashPassword } from "@/lib/password";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { MalformedBodyError, readFields, redirectTo, wantsJson } from "@/lib/request";
import { SESSION_COOKIE, createSession, sessionCookieOptions } from "@/lib/session";
import { formatZodError, registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const json = wantsJson(request);

  try {
    const input = registerSchema.parse(await readFields(request));
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
      },
    });
    const token = await createSession(user.id);

    if (json) {
      const response = NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(request));
      return response;
    }

    const response = redirectTo(request, "/dashboard");
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(request));
    return response;
  } catch (error) {
    const code = error instanceof ZodError || error instanceof MalformedBodyError
      ? "invalid"
      : isUniqueViolation(error)
        ? "email_taken"
        : null;
    if (!code) throw error;

    if (json) {
      const message = error instanceof ZodError
        ? formatZodError(error)
        : code === "email_taken"
          ? "An account with that email already exists."
          : "Check the form and try again.";
      return NextResponse.json({ error: message }, { status: code === "email_taken" ? 409 : 400 });
    }

    return redirectTo(request, "/register", { error: code });
  }
}
