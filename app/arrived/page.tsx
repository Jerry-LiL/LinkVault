import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Arrived" };

export default function ArrivedPage() {
  return (
    <section className="hero">
      <p className="eyebrow">Destination</p>
      <h1>You arrived.</h1>
      <p className="lede">
        This page is a local stand-in for a destination URL, so a redirect can be tried
        without leaving the machine.
      </p>
      <Link className="button secondary" href="/dashboard">
        Back to links
      </Link>
    </section>
  );
}
