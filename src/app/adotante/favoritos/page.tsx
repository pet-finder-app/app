import { AdopterPetCard } from "@/components/adopter-pet-card";
import { AdopterTabBar } from "@/components/adopter-tab-bar";
import { Card, CardTitle, PageShell } from "@/components/ui";
import { listNotificationsByAdopter } from "@/lib/notifications";
import { getOngInfoMap, readPets } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Favoritos – Petfinder",
};

const CARD_TONE = ["bg-primary-faint", "bg-accent-yellow", "bg-accent-peach"];

export default async function AdopterFavoritesPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const [notifications, allPets, ongInfo] = await Promise.all([
    listNotificationsByAdopter(user.id),
    readPets(),
    getOngInfoMap(),
  ]);
  const likedIds = new Set(
    notifications.filter((n) => n.type === "curtida").map((n) => n.petId),
  );
  const interestedIds = new Set(
    notifications.filter((n) => n.type === "interesse").map((n) => n.petId),
  );
  const hasPhone = Boolean(user.adopter.personal.phone);
  const pets = allPets.filter((pet) => likedIds.has(pet.id) && !pet.archived);

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <CardTitle>Favoritos</CardTitle>
        <p className="text-sm text-neutral-600">
          Os pets que você marcou para não perder de vista.
        </p>
      </Card>

      {pets.length === 0 ? (
        <Card className="items-center gap-2 text-center">
          <p className="text-sm text-neutral-600">
            Você ainda não favoritou nenhum pet. Toque em
            &ldquo;Favoritar&rdquo; nos pets do início.
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
                liked
                interested={interestedIds.has(pet.id)}
                ongName={ong?.name ?? "ONG"}
                city={ong?.city ?? ""}
                hasPhone={hasPhone}
              />
            );
          })}
        </ul>
      )}

      <AdopterTabBar />
    </PageShell>
  );
}
