import Link from "next/link";

export function Header({ email }: { email: string | null }) {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
        LinkVault
      </Link>
      <nav className="nav" aria-label="Account">
        {email ? (
          <>
            <span className="nav-email">{email}</span>
            <Link href="/dashboard">Links</Link>
            <form action="/api/auth/logout" method="post" className="inline-form">
              <button className="secondary" type="submit">
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link className="button" href="/register">
              Create an account
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
