import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RateLimitError } from "@/lib/rate-limit";
import { ReservedSlugError, SlugTakenError, createShortLink } from "@/lib/links";
import { prisma } from "@/lib/prisma";
import { MalformedBodyError, originFromRequest, readFields, redirectTo, wantsJson } from "@/lib/request";
import { getCurrentUser } from "@/lib/session";
import { createLinkSchema, formatZodError } from "@/lib/validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const links = await prisma.link.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { clicks: true } } },
  });

  const origin = originFromRequest(request);
  return NextResponse.json({
    links: links.map((link) => ({
      id: link.id,
      slug: link.slug,
      destination: link.destination,
      title: link.title,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      clicks: link._count.clicks,
      shortUrl: `${origin}/${link.slug}`,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const json = wantsJson(request);

  if (!user) {
    if (json) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    return redirectTo(request, "/login");
  }

  try {
    const fields = await readFields(request);
    const input = createLinkSchema.parse(fields);
    const link = await createShortLink(user.id, input);
    const shortUrl = `${originFromRequest(request)}/${link.slug}`;

    if (json) {
      return NextResponse.json(
        {
          id: link.id,
          slug: link.slug,
          destination: link.destination,
          title: link.title,
          expiresAt: link.expiresAt,
          shortUrl,
        },
        { status: 201 },
      );
    }

    return redirectTo(request, "/dashboard", { created: link.slug });
  } catch (error) {
    const mapped = mapError(error);
    if (json) {
      const response = NextResponse.json({ error: mapped.message }, { status: mapped.status });
      if (mapped.retryAfterSeconds) {
        response.headers.set("retry-after", String(mapped.retryAfterSeconds));
      }
      return response;
    }
    return redirectTo(request, "/dashboard", { error: mapped.code });
  }
}

function mapError(error: unknown): {
  status: number;
  code: string;
  message: string;
  retryAfterSeconds?: number;
} {
  if (error instanceof MalformedBodyError) {
    return { status: 400, code: "invalid", message: error.message };
  }
  if (error instanceof ZodError) {
    return { status: 400, code: "invalid", message: formatZodError(error) };
  }
  if (error instanceof ReservedSlugError) {
    return { status: 400, code: "reserved", message: error.message };
  }
  if (error instanceof SlugTakenError) {
    return { status: 409, code: "slug_taken", message: error.message };
  }
  if (error instanceof RateLimitError) {
    return {
      status: 429,
      code: "rate_limited",
      message: error.message,
      retryAfterSeconds: error.retryAfterSeconds,
    };
  }
  throw error;
}
