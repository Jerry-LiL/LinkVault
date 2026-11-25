import { NextResponse } from "next/server";
import { recordClick } from "@/lib/clicks";
import { linkStatus } from "@/lib/links";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const link = await prisma.link.findUnique({ where: { slug: slug.toLowerCase() } });

  if (!link) {
    return statusPage(404, "Link not found", "This short link does not exist.");
  }

  if (linkStatus(link.expiresAt) === "expired") {
    return statusPage(410, "Link expired", "This short link is no longer active.");
  }

  await recordClick(link.id, request.headers);

  // 302, not 301. A permanent redirect would be cached and later visits
  // would never reach this handler, so the click would not be stored.
  const response = NextResponse.redirect(link.destination, 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function statusPage(status: number, title: string, message: string) {
  const body = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>${title}</title></head>
  <body style="font-family: Georgia, serif; background: #f3efe6; color: #1d1a16; padding: 4rem 1.5rem;">
    <main style="max-width: 32rem; margin: 0 auto;">
      <h1>${title}</h1>
      <p>${message}</p>
      <p><a href="/">LinkVault</a></p>
    </main>
  </body>
</html>`;
  return new NextResponse(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
