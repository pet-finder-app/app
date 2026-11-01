import { AdopterTabBar } from "@/components/adopter/adopter-tab-bar";
import { LocationButton } from "@/components/location/location-button";
import { Card, iconSize, LinkButton, PageShell } from "@/components/ui";
import { listDislikedPetIds } from "@/lib/dislikes";
import { distancesForAdopter } from "@/lib/location";
import { listNotificationsByAdopter } from "@/lib/notifications";
import { getNgoInfoMap, listAvailablePets } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdopterReels, type ReelsItem } from "./_components/adopter-reels";

export const metadata: Metadata = {
  title: "Descobrir – Petfinder",
};

export default async function AdopterDiscoverPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const [available, ngoInfo, notifications, dislikedIds] = await Promise.all([
    listAvailablePets(),
    getNgoInfoMap(),
    listNotificationsByAdopter(user.id),
    listDislikedPetIds(user.id),
  ]);
  const disliked = new Set(dislikedIds);
  const liked = new Set(
    notifications.filter((n) => n.type === "like").map((n) => n.petId),
  );
  const interested = new Set(
    notifications.filter((n) => n.type === "interest").map((n) => n.petId),
  );

  const postalCode = user.adopter.personal.address.postalCode;
  const { distances, source } = await distancesForAdopter(postalCode, ngoInfo);

  const items: ReelsItem[] = available
    .filter((pet) => !disliked.has(pet.id) && ngoInfo.has(pet.ngoId))
    .map((pet) => {
      const ngo = ngoInfo.get(pet.ngoId)!;
      return {
        pet,
        ngoName: ngo.name,
        city: ngo.city,
        distanceKm: distances.get(pet.ngoId) ?? null,
        liked: liked.has(pet.id),
        interested: interested.has(pet.id),
      };
    })
    .sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null)
        return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return b.pet.createdAt.localeCompare(a.pet.createdAt);
    });

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <div className="flex items-center gap-3">
          <LinkButton href="/" variant="pill" size="sm">
            <ChevronLeft className={iconSize.sm} aria-hidden="true" />
            Início
          </LinkButton>
          <h1 className="text-lg font-bold text-neutral-900">Descobrir</h1>
        </div>
        <LocationButton active={source === "gps"} />
        {source ? null : (
          <p role="status" className="text-xs text-neutral-900">
            Quer ver os mais perto primeiro?{" "}
            <Link href="/me#postalCode" className="font-bold underline">
              Informe seu CEP no perfil
            </Link>
            .
          </p>
        )}
      </Card>

      {items.length === 0 ? (
        <Card className="items-center gap-2 text-center">
          <p className="text-sm text-neutral-600">
            Nenhum pet novo por aqui. Veja os{" "}
            <Link href="/adopter/discarded" className="font-bold underline">
              descartados
            </Link>{" "}
            se mudou de ideia.
          </p>
        </Card>
      ) : (
        <AdopterReels
          items={items}
          hasPhone={Boolean(user.adopter.personal.phone)}
        />
      )}

      <AdopterTabBar />
    </PageShell>
  );
}
