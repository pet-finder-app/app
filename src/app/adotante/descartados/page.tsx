import { AdopterPetCard } from "@/components/adopter-pet-card";
import { AdopterTabBar } from "@/components/adopter-tab-bar";
import {
  Card,
  CardTitle,
  iconSize,
  LinkButton,
  PageShell,
} from "@/components/ui";
import { listDislikedPetIds } from "@/lib/dislikes";
import { listNotificationsByAdopter } from "@/lib/notifications";
import type { Pet } from "@/lib/pet";
import { getOngInfoMap, readPets } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Não tenho interesse – Petfinder",
};

const CARD_TONE = ["bg-primary-faint", "bg-accent-yellow", "bg-accent-peach"];

export default async function AdopterDiscardedPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const [dislikedIds, allPets, ongInfo, notifications] = await Promise.all([
    listDislikedPetIds(user.id),
    readPets(),
    getOngInfoMap(),
    listNotificationsByAdopter(user.id),
  ]);
  const petsById = new Map(allPets.map((pet) => [pet.id, pet]));
  const pets = dislikedIds
    .map((id) => petsById.get(id))
    .filter((pet): pet is Pet => pet !== undefined && !pet.archived);
  const likedIds = new Set(
    notifications.filter((n) => n.type === "curtida").map((n) => n.petId),
  );
  const interestedIds = new Set(
    notifications.filter((n) => n.type === "interesse").map((n) => n.petId),
  );
  const hasPhone = Boolean(user.adopter.personal.phone);

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <LinkButton href="/" variant="pill" size="sm" className="self-start">
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Voltar ao início
        </LinkButton>
        <CardTitle>Não tenho interesse</CardTitle>
        <p className="text-sm text-neutral-600">
          Os pets que você escondeu do início. Mudou de ideia? Toque no botão de
          desfazer para trazê-lo de volta.
        </p>
      </Card>

      {pets.length === 0 ? (
        <Card className="items-center gap-2 text-center">
          <p className="text-sm text-neutral-600">
            Você ainda não descartou nenhum pet.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {pets.map((pet, index) => {
            const ong = ongInfo.get(pet.ongId);
            return (
              <AdopterPetCard
                key={pet.id}
                pet={pet}
                tone={CARD_TONE[index % CARD_TONE.length]}
                liked={likedIds.has(pet.id)}
                interested={interestedIds.has(pet.id)}
                ongName={ong?.name ?? "ONG"}
                city={ong?.city ?? ""}
                hasPhone={hasPhone}
                disliked
              />
            );
          })}
        </ul>
      )}

      <AdopterTabBar />
    </PageShell>
  );
}
