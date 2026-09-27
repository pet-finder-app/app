import { BrutalLinkButton } from "@/components/brutal-button";
import { BrutalCard } from "@/components/brutal-card";
import { OngTabBar } from "@/components/ong-tab-bar";
import { OngVerificationChecklistCard } from "@/components/ong-verification-checklist-card";
import { PetListItem } from "@/components/pet-list-item";
import { PageShell } from "@/components/ui";
import {
  countNotificationsByPet,
  listNotificationsByOng,
} from "@/lib/notifications";
import { listPetsByOng } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Meus pets – Petfinder",
};

const CARD_TONE = ["bg-primary-faint", "bg-accent-yellow", "bg-accent-peach"];

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
      <BrutalCard as="header" className="gap-2">
        <h1 className="text-lg font-bold text-neutral-900">Meus pets</h1>
        <p className="text-sm text-neutral-600">
          Acompanhe o status de adoção, curtidas e interessados. Edite ou
          arquive pelo menu de cada pet.
        </p>
        {verified ? (
          <BrutalLinkButton href="/ong/pets/novo" size="md">
            Cadastrar pet
          </BrutalLinkButton>
        ) : null}
      </BrutalCard>

      {!verified ? (
        <OngVerificationChecklistCard ong={ong} />
      ) : pets.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {pets.map((pet, index) => (
            <PetListItem
              key={pet.id}
              pet={pet}
              tone={CARD_TONE[index % CARD_TONE.length]}
              likesCount={likesByPet[pet.id] ?? 0}
              interestedCount={interestedByPet[pet.id] ?? 0}
            />
          ))}
        </ul>
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
