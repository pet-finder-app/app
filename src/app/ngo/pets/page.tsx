import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { NgoVerificationChecklistCard } from "@/components/ngo/ngo-verification-checklist-card";
import { iconSize, PageShell } from "@/components/ui";
import { BrutalLinkButton } from "@/components/ui/brutal-button";
import { BrutalCard } from "@/components/ui/brutal-card";
import {
  countNotificationsByPet,
  listNotificationsByNgo,
} from "@/lib/notifications";
import { listPetsByNgo } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft, PawPrint, Plus } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NgoPetsManager } from "./_components/ngo-pets-manager";

export const metadata: Metadata = {
  title: "Meus pets – Petfinder",
};

/** Manage published pets, status, engagement, editing, and archiving. */
export default async function NgoPetsPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const ngo = user.ngo;
  const verified = ngo.verification.status === "verified";

  const [allPets, notifications] = await Promise.all([
    listPetsByNgo(user.id),
    listNotificationsByNgo(user.id),
  ]);
  const pets = allPets.filter((pet) => !pet.archived);
  const unreadCount = notifications.filter((n) => n.readAt === null).length;
  const likesByPet = countNotificationsByPet(notifications, "like");
  const interestedByPet = countNotificationsByPet(notifications, "interest");

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
          href="/ngo/dashboard"
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
          <BrutalLinkButton href="/ngo/pets/new" size="md" className="relative">
            <Plus className={iconSize.md} aria-hidden="true" />
            Cadastrar pet
          </BrutalLinkButton>
        ) : null}
      </BrutalCard>

      {!verified ? (
        <NgoVerificationChecklistCard ngo={ngo} />
      ) : pets.length > 0 ? (
        <>
          <NgoPetsManager
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
          <BrutalLinkButton href="/ngo/pets/new" size="md">
            Cadastrar primeiro pet
          </BrutalLinkButton>
        </BrutalCard>
      )}

      <NgoTabBar unreadCount={unreadCount} />
    </PageShell>
  );
}
