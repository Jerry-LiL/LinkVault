import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateLinkForm } from "@/components/create-link-form";
import { ErrorNote } from "@/components/error-note";
import { LinkTable } from "@/components/link-table";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Your links" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const links = await prisma.link.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { clicks: true } } },
  });

  const created = params.created && /^[a-z0-9-]{3,32}$/.test(params.created) ? params.created : null;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Your links</h1>
        </div>
      </div>
      <ErrorNote code={params.error} />
      {created ? (
        <p className="success" role="status">
          Short link <a href={`/${created}`}>/{created}</a> is ready.
        </p>
      ) : null}
      <CreateLinkForm />
      <LinkTable links={links} origin={origin} />
    </div>
  );
}
