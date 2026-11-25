import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorNote } from "@/components/error-note";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <section className="card auth">
      <h1>Log in</h1>
      <ErrorNote code={error} />
      <form className="form" action="/api/auth/login" method="post">
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button type="submit">Log in</button>
      </form>
      <p className="muted">
        No account yet? <Link href="/register">Create one</Link>.
      </p>
    </section>
  );
}
