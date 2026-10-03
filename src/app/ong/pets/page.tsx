import { BrutalLinkButton } from "@/components/brutal-button";
import { BrutalCard } from "@/components/brutal-card";
import { OngPetsManager } from "@/components/ong-pets-manager";
import { OngTabBar } from "@/components/ong-tab-bar";
import { OngVerificationChecklistCard } from "@/components/ong-verification-checklist-card";
import { iconSize, PageShell } from "@/components/ui";
import {
  countNotificationsByPet,
  listNotificationsByOng,
} from "@/lib/notifications";
import { listPetsByOng } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft, PawPrint, Plus } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Meus pets – Petfinder",
};

/** Gestão dos pets publicados: status de adoção, curtidas, interessados, editar e arquivar. */
export default async function OngPetsPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const ong = user.ong;
  const verified = ong.verification.status === "verificada";

  const [allPets, notifications] = await Promise.all([
    listPetsByOng(user.id),
    listNotificationsByOng(user.id),
  ]);
  const pets = allPets.filter((pet) => !pet.archived);
  const unreadCount = notifications.filter((n) => n.readAt === null).length;
  const likesByPet = countNotificationsByPet(notifications, "curtida");
  const interestedByPet = countNotificationsByPet(notifications, "interesse");

  return (
    <PageShell hasActionBar>
      <BrutalCard
        as="header"
        className="rise-in relative gap-3 overflow-hidden bg-primary-faint"
      >
        <PawPrint
          className="pointer-events-none absolute -top-3 -right-3 size-28 -rotate-12 text-primary/15"
          aria-hidden="true"
        />
        <BrutalLinkButton
          href="/ong/dashboard"
          variant="pill"
          size="sm"
          className="self-start"
        >
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Início
        </BrutalLinkButton>
        <div className="relative flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-neutral-900 bg-primary text-primary-foreground">
            <PawPrint className={iconSize.lg} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-neutral-900">Meus pets</h1>
            <p className="text-sm text-neutral-600">
              Status, curtidas e interessados de cada pet.
            </p>
          </div>
        </div>
        {verified ? (
          <BrutalLinkButton
            href="/ong/pets/novo"
            size="md"
            className="relative"
          >
            <Plus className={iconSize.md} aria-hidden="true" />
            Cadastrar pet
          </BrutalLinkButton>
        ) : null}
      </BrutalCard>

      {!verified ? (
        <OngVerificationChecklistCard ong={ong} />
      ) : pets.length > 0 ? (
        <>
          <OngPetsManager
            pets={pets}
            likesByPet={likesByPet}
            interestedByPet={interestedByPet}
          />
        </>
      ) : (
        <BrutalCard className="items-center gap-3 text-center">
          <p className="text-sm text-neutral-600">
            Você ainda não cadastrou nenhum pet.
          </p>
          <BrutalLinkButton href="/ong/pets/novo" size="md">
            Cadastrar primeiro pet
          </BrutalLinkButton>
        </BrutalCard>
      )}

      <OngTabBar unreadCount={unreadCount} />
    </PageShell>
  );
}
