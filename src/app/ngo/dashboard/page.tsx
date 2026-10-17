import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { Card, iconSize, LinkButton, PageShell } from "@/components/ui";
import { BrutalCard } from "@/components/ui/brutal-card";
import { donationStatusOf } from "@/lib/donation";
import { listDonationsByNgo } from "@/lib/donations";
import { listNotificationsByNgo } from "@/lib/notifications";
import { listPetsByNgo } from "@/lib/pets";
import { isSurrenderActive, whoActsNow } from "@/lib/surrender";
import { listSurrendersByNgo } from "@/lib/surrenders";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronRight, PawPrint } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NgoDashboard } from "./_components/ngo-dashboard";

export const metadata: Metadata = {
  title: "Dashboard – Petfinder",
};

export default async function NgoDashboardPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const [pets, notifications, allDonations, surrenders] = await Promise.all([
    listPetsByNgo(user.id),
    listNotificationsByNgo(user.id),
    listDonationsByNgo(user.id),
    listSurrendersByNgo(user.id),
  ]);
  const surrendersWaitingNgo = surrenders.filter(
    (s) => isSurrenderActive(s.status) && whoActsNow(s) === "ngo",
  ).length;
  // Only confirmed donations contribute to totals; reported donations await verification.
  const donations = allDonations.filter(
    (d) => donationStatusOf(d) === "confirmed",
  );
  const pendingDonations = allDonations.filter(
    (d) => donationStatusOf(d) === "reported",
  ).length;
  const unreadCount = notifications.filter((n) => n.readAt === null).length;
  const interestCount = notifications.filter(
    (n) => n.type === "interest",
  ).length;

  return (
    <PageShell hasActionBar>
      <BrutalCard as="header" className="gap-1">
        <p className="text-sm text-neutral-600">Olá,</p>
        <h1 className="text-xl font-bold text-neutral-900">
          {user.ngo.legal.tradeName}
        </h1>
        <p className="text-sm text-neutral-600">
          Você tem {interestCount}{" "}
          {interestCount === 1 ? "interesse" : "interesses"} em adotar.
        </p>
      </BrutalCard>

      <Link
        href="/ngo/pets"
        className="flex items-center gap-3 rounded-xl border border-neutral-900 bg-primary-faint p-4 hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-neutral-900 bg-primary text-primary-foreground">
          <PawPrint className={iconSize.lg} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-neutral-900">
            Gerenciar pets
          </span>
          <span className="block text-xs text-neutral-600">
            {pets.length} {pets.length === 1 ? "pet" : "pets"} · editar,
            arquivar e ver interessados
          </span>
        </span>
        <ChevronRight
          className={`${iconSize.lg} shrink-0 text-neutral-900`}
          aria-hidden="true"
        />
      </Link>

      {surrendersWaitingNgo > 0 ? (
        <Card className="gap-2">
          <p className="text-sm font-bold text-neutral-900">
            {surrendersWaitingNgo === 1
              ? "1 pedido para deixar um pet com você"
              : `${surrendersWaitingNgo} pedidos para deixar um pet com você`}
          </p>
          <p className="text-xs text-neutral-600">
            Alguém precisa da sua resposta para seguir com a entrega do animal.
          </p>
          <LinkButton href="/ngo/surrenders" size="sm" className="self-start">
            Ver pedidos
          </LinkButton>
        </Card>
      ) : null}

      {pendingDonations > 0 ? (
        <Card className="gap-2">
          <p className="text-sm font-bold text-neutral-900">
            {pendingDonations === 1
              ? "1 doação para conferir"
              : `${pendingDonations} doações para conferir`}
          </p>
          <p className="text-xs text-neutral-600">
            Alguém avisou que fez um Pix. Confira no extrato e confirme.
          </p>
          <LinkButton href="/ngo/donations" size="sm" className="self-start">
            Ver doações
          </LinkButton>
        </Card>
      ) : null}

      <NgoDashboard
        pets={pets}
        notifications={notifications}
        donations={donations}
      />

      <NgoTabBar unreadCount={unreadCount} />
    </PageShell>
  );
}
