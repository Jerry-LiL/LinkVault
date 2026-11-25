import Link from "next/link";

export default function NotFound() {
  return (
    <section className="hero">
      <p className="eyebrow">404</p>
      <h1>That page is not here.</h1>
      <p className="lede">The link may belong to another account, or the address is wrong.</p>
      <Link className="button secondary" href="/">
        Home
      </Link>
    </section>
  );
}
