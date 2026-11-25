import "dotenv/config";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { linkAnalytics } from "../../lib/analytics";
import { recordClick } from "../../lib/clicks";
import { RateLimitError } from "../../lib/rate-limit";
import { ReservedSlugError, SlugTakenError, createShortLink } from "../../lib/links";
import { prisma } from "../../lib/prisma";

const createdUserIds: string[] = [];

async function makeUser(label: string) {
  const user = await prisma.user.create({
    data: {
      email: `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      name: "Test",
      passwordHash: "scrypt$unused$00",
    },
  });
  createdUserIds.push(user.id);
  return user;
}

describe("short links", () => {
  before(() => {
    process.env.RATE_LIMIT_MAX = "10";
    process.env.RATE_LIMIT_WINDOW_SECONDS = "3600";
  });

  after(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
  });

  it("stores a generated slug and an expiry", async () => {
    const user = await makeUser("gen");
    const link = await createShortLink(user.id, {
      destination: "https://example.com/docs",
      expiresAt: "2026-12-01T15:30:00.000Z",
    });
    assert.match(link.slug, /^[a-z2-9]{7}$/);
    assert.equal(link.expiresAt?.toISOString(), "2026-12-01T15:30:00.000Z");
  });

  it("retries when the first generated slug is already taken", async () => {
    const user = await makeUser("retry");
    await prisma.link.create({
      data: { slug: "aaaaaaa", destination: "https://example.com/taken", ownerId: user.id },
    });

    let calls = 0;
    const link = await createShortLink(
      user.id,
      { destination: "https://example.com/next" },
      {
        generate: () => {
          calls += 1;
          return calls === 1 ? "aaaaaaa" : "bbbbbbb";
        },
      },
    );

    assert.equal(link.slug, "bbbbbbb");
    assert.equal(calls, 2);
  });

  it("skips a reserved candidate and gives up after repeated collisions", async () => {
    const user = await makeUser("giveup");
    await prisma.link.create({
      data: { slug: "ccccccc", destination: "https://example.com/c", ownerId: user.id },
    });

    await assert.rejects(
      () =>
        createShortLink(
          user.id,
          { destination: "https://example.com/again" },
          { generate: () => "ccccccc" },
        ),
      /unique slug/,
    );

    const recovered = await createShortLink(
      user.id,
      { destination: "https://example.com/recovered" },
      {
        generate: (() => {
          const values = ["dashboard", "ddddddd"];
          return () => values.shift() ?? "eeeeeee";
        })(),
      },
    );
    assert.equal(recovered.slug, "ddddddd");
  });

  it("rejects a custom slug that is reserved or already used", async () => {
    const user = await makeUser("custom");
    await createShortLink(user.id, {
      destination: "https://example.com/mine",
      slug: "my-notes",
    });

    await assert.rejects(
      () =>
        createShortLink(user.id, {
          destination: "https://example.com/other",
          slug: "my-notes",
        }),
      SlugTakenError,
    );
    await assert.rejects(
      () =>
        createShortLink(user.id, {
          destination: "https://example.com/other",
          slug: "dashboard",
        }),
      ReservedSlugError,
    );
  });

  it("rate limits link creation per user", async () => {
    const previous = process.env.RATE_LIMIT_MAX;
    process.env.RATE_LIMIT_MAX = "2";
    try {
      const limited = await makeUser("limited");
      const other = await makeUser("other");
      const suffix = limited.id.slice(-8);

      await createShortLink(limited.id, {
        destination: "https://example.com/1",
        slug: `lim-${suffix}-a`,
      });
      await createShortLink(limited.id, {
        destination: "https://example.com/2",
        slug: `lim-${suffix}-b`,
      });
      await assert.rejects(
        () =>
          createShortLink(limited.id, {
            destination: "https://example.com/3",
            slug: `lim-${suffix}-c`,
          }),
        RateLimitError,
      );

      const allowed = await createShortLink(other.id, {
        destination: "https://example.com/other",
        slug: `oth-${other.id.slice(-8)}`,
      });
      assert.equal(allowed.ownerId, other.id);
    } finally {
      process.env.RATE_LIMIT_MAX = previous;
    }
  });

  it("records a visit and aggregates it by day, referrer, and device", async () => {
    const user = await makeUser("stats");
    const link = await createShortLink(user.id, {
      destination: "https://example.com/stats",
      slug: `stats-${user.id.slice(-6)}`,
    });

    const headers = new Headers({
      referer: "https://www.news.example/story",
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148",
    });
    await recordClick(link.id, headers);
    await recordClick(link.id, new Headers());

    const analytics = await linkAnalytics(link.id);
    assert.equal(analytics.total, 2);
    assert.equal(analytics.referrers.find((row) => row.name === "news.example")?.count, 1);
    assert.equal(analytics.referrers.find((row) => row.name === "Direct")?.count, 1);
    assert.equal(analytics.devices.find((row) => row.name === "mobile")?.count, 1);
    assert.equal(analytics.devices.find((row) => row.name === "desktop")?.count, 1);
    assert.equal(analytics.daily.at(-1)?.count, 2);

    const indexes = await prisma.$queryRaw<Array<{ indexdef: string }>>`
      SELECT indexdef
      FROM pg_indexes
      WHERE tablename = 'clicks'
    `;
    const definitions = indexes.map((row) => row.indexdef).join("\n");
    assert.match(definitions, /link_id/);
    assert.match(definitions, /clicked_at/);
  });
});
