import { prisma } from "@/lib/prisma";
import { classifyDevice } from "@/lib/device";
import { normalizeReferrer } from "@/lib/referrer";

export async function recordClick(linkId: string, headers: Headers): Promise<void> {
  const userAgent = headers.get("user-agent");
  await prisma.click.create({
    data: {
      linkId,
      referrer: normalizeReferrer(headers.get("referer")),
      device: classifyDevice(userAgent),
      userAgent: userAgent ? userAgent.slice(0, 512) : null,
    },
  });
}
