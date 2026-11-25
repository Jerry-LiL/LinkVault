import type { Metadata } from "next";
import { Header } from "@/components/header";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "LinkVault", template: "%s · LinkVault" },
  description: "Short links with a record of every visit.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <Header email={user?.email ?? null} />
        <main id="content">{children}</main>
      </body>
    </html>
  );
}
