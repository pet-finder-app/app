import { BrutalCard } from "@/components/brutal-card";
import { OngDashboard } from "@/components/ong-dashboard";
import { OngTabBar } from "@/components/ong-tab-bar";
import { PageShell } from "@/components/ui";
import { listDonationsByOng } from "@/lib/donations";
import { listNotificationsByOng } from "@/lib/notifications";
import { listPetsByOng } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard – Petfinder",
};

export default async function OngDashboardPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const [pets, notifications, donations] = await Promise.all([
    listPetsByOng(user.id),
    listNotificationsByOng(user.id),
    listDonationsByOng(user.id),
  ]);
  const unreadCount = notifications.filter((n) => n.readAt === null).length;
  const interestCount = notifications.filter(
    (n) => n.type === "interesse",
  ).length;

  return (
    <PageShell hasActionBar>
      <BrutalCard as="header" className="gap-1">
        <p className="text-sm text-neutral-600">Olá,</p>
        <h1 className="text-xl font-bold text-neutral-900">
          {user.ong.legal.tradeName}
        </h1>
        <p className="text-sm text-neutral-600">
          Você tem {interestCount}{" "}
          {interestCount === 1 ? "interesse" : "interesses"} em adotar.
        </p>
      </BrutalCard>

      <OngDashboard
        pets={pets}
        notifications={notifications}
        donations={donations}
      />

      <OngTabBar unreadCount={unreadCount} />
    </PageShell>
  );
}
