import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BarList, DailyChart } from "@/components/charts";
import { linkAnalytics } from "@/lib/analytics";
import { linkStatus } from "@/lib/links";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Link analytics" };

export default async function LinkAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const link = await prisma.link.findUnique({ where: { slug: slug.toLowerCase() } });
  if (!link || link.ownerId !== user.id) notFound();

  const [analytics, recent] = await Promise.all([
    linkAnalytics(link.id),
    prisma.click.findMany({
      where: { linkId: link.id },
      orderBy: { clickedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>/{link.slug}</h1>
          <p className="muted">{link.destination}</p>
        </div>
        <Link className="button secondary" href="/dashboard">
          Back to links
        </Link>
      </div>

      <section className="stats">
        <article className="stat">
          <span className="muted">Visits</span>
          <b data-testid="total-clicks">{analytics.total}</b>
        </article>
        <article className="stat">
          <span className="muted">Created (UTC)</span>
          <b>{formatStamp(link.createdAt)}</b>
        </article>
        <article className="stat">
          <span className="muted">Expiry (UTC)</span>
          <b>
            {link.expiresAt ? formatStamp(link.expiresAt) : "None"}
            {linkStatus(link.expiresAt) === "expired" ? " · expired" : ""}
          </b>
        </article>
      </section>

      <section className="chart-grid">
        <article className="card chart-card">
          <h2>Daily traffic</h2>
          <DailyChart points={analytics.daily} />
          <p className="muted chart-note">Days are grouped in UTC. Empty days stay on the axis.</p>
        </article>
        <div className="stack">
          <article className="card chart-card">
            <h2>Referrers</h2>
            <BarList rows={analytics.referrers} empty="No visits yet." testIdPrefix="referrer" />
          </article>
          <article className="card chart-card">
            <h2>Devices</h2>
            <BarList rows={analytics.devices} empty="No visits yet." testIdPrefix="device" />
          </article>
        </div>
      </section>

      <section className="card recent">
        <h2>Recent visits</h2>
        {recent.length === 0 ? (
          <p className="muted">Nothing recorded yet. Open the short link to write the first row.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When (UTC)</th>
                  <th>Referrer</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((click) => (
                  <tr key={click.id}>
                    <td>{formatStamp(click.clickedAt)}</td>
                    <td>{click.referrer ?? "Direct"}</td>
                    <td>{click.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function formatStamp(value: Date): string {
  return value.toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
