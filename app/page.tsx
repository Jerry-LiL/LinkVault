import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "LinkVault",
};

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Short links</p>
        <h1>A short link with a memory.</h1>
        <p className="lede">
          Paste a long URL, pick an optional expiry, and share the slug. LinkVault sends
          the visitor on and keeps the day, the referrer, and the device.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link className="button" href="/dashboard">
              Go to your links
            </Link>
          ) : (
            <>
              <Link className="button" href="/register">
                Create an account
              </Link>
              <Link className="button secondary" href="/login">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="points">
        <article>
          <h2>Expiry when you want it</h2>
          <p>Leave a link open, or set a UTC time after which it stops redirecting.</p>
        </article>
        <article>
          <h2>Visits, counted in the database</h2>
          <p>Each redirect writes a row. The charts read grouped counts, not a pile of raw hits.</p>
        </article>
        <article>
          <h2>A limit per account</h2>
          <p>Link creation is capped inside a time window so one account cannot mint links without bound.</p>
        </article>
      </section>
    </>
  );
}
