import type { Link as ShortLink } from "@prisma/client";
import NextLink from "next/link";
import { CopyButton } from "@/components/copy-button";
import { linkStatus } from "@/lib/links";

type Row = ShortLink & { _count: { clicks: number } };

export function LinkTable({ links, origin }: { links: Row[]; origin: string }) {
  if (links.length === 0) {
    return (
      <section className="card">
        <p className="muted">No links yet. The form above creates the first one.</p>
      </section>
    );
  }

  return (
    <section className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Link</th>
            <th>Destination</th>
            <th>Visits</th>
            <th>Expiry</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => {
            const shortUrl = `${origin}/${link.slug}`;
            const expired = linkStatus(link.expiresAt) === "expired";
            return (
              <tr key={link.id}>
                <td>
                  <NextLink className="slug" href={`/dashboard/links/${link.slug}`}>
                    /{link.slug}
                  </NextLink>
                  {link.title ? <div className="muted">{link.title}</div> : null}
                </td>
                <td>
                  <span className="destination" title={link.destination}>
                    {link.destination}
                  </span>
                </td>
                <td>{link._count.clicks}</td>
                <td>
                  {link.expiresAt ? (
                    <>
                      {formatStamp(link.expiresAt)}
                      {expired ? <div className="badge">Expired</div> : null}
                    </>
                  ) : (
                    <span className="muted">None</span>
                  )}
                </td>
                <td>
                  <CopyButton value={shortUrl} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function formatStamp(value: Date): string {
  return value.toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
