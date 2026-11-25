import { hashPassword } from "../lib/password";
import { prisma } from "../lib/prisma";

const DAY = 86_400_000;

async function main() {
  const passwordHash = await hashPassword("demo-password");
  const user = await prisma.user.upsert({
    where: { email: "demo@linkvault.local" },
    update: { name: "Demo", passwordHash },
    create: {
      email: "demo@linkvault.local",
      name: "Demo",
      passwordHash,
    },
  });

  const handbook = await prisma.link.upsert({
    where: { slug: "handbook" },
    update: {
      destination: "https://example.com/handbook",
      title: "Handbook",
      ownerId: user.id,
      expiresAt: new Date(Date.now() + 30 * DAY),
    },
    create: {
      slug: "handbook",
      destination: "https://example.com/handbook",
      title: "Handbook",
      ownerId: user.id,
      expiresAt: new Date(Date.now() + 30 * DAY),
    },
  });

  await prisma.link.upsert({
    where: { slug: "notes" },
    update: {
      destination: "https://example.com/notes",
      title: "Notes",
      ownerId: user.id,
      expiresAt: null,
    },
    create: {
      slug: "notes",
      destination: "https://example.com/notes",
      title: "Notes",
      ownerId: user.id,
    },
  });

  const existingClicks = await prisma.click.count({ where: { linkId: handbook.id } });
  if (existingClicks === 0) {
    const now = Date.now();
    await prisma.click.createMany({
      data: [
        visit(handbook.id, now, "news.example", "desktop"),
        visit(handbook.id, now - 2 * 60 * 60 * 1000, "news.example", "mobile"),
        visit(handbook.id, now - DAY, null, "mobile"),
        visit(handbook.id, now - 3 * DAY, "chat.example", "desktop"),
        visit(handbook.id, now - 6 * DAY, null, "tablet"),
      ],
    });
  }
}

function visit(linkId: string, at: number, referrer: string | null, device: string) {
  return {
    linkId,
    clickedAt: new Date(at),
    referrer,
    device,
    userAgent: "seed",
  };
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
