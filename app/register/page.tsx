import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorNote } from "@/components/error-note";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <section className="card auth">
      <h1>Create an account</h1>
      <ErrorNote code={error} />
      <form className="form" action="/api/auth/register" method="post">
        <label>
          Name
          <input name="name" autoComplete="name" required maxLength={60} />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="new-password" required minLength={8} />
          <span className="hint">At least 8 characters.</span>
        </label>
        <button type="submit">Create account</button>
      </form>
      <p className="muted">
        Already registered? <Link href="/login">Log in</Link>.
      </p>
    </section>
  );
}
