import { AdopterTabBar } from "@/components/adopter/adopter-tab-bar";
import {
  SurrenderRequestForm,
  type SurrenderReturnOption,
} from "@/components/surrenders/surrender-request-form";
import {
  Card,
  CardTitle,
  iconSize,
  LinkButton,
  PageShell,
} from "@/components/ui";
import { listAdoptionsByAdopter } from "@/lib/adoptions";
import { getPetById } from "@/lib/pets";
import { isSurrenderActive } from "@/lib/surrender";
import { listSurrendersByAdopter } from "@/lib/surrenders";
import { findUserById, readUsers, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Deixar um pet com a ONG – Petfinder",
};

/** New surrender or return request. NGO and adoption query parameters preselect the corresponding records. */
export default async function NewSurrenderPage({
  searchParams,
}: {
  searchParams: Promise<{ ngo?: string; adoption?: string }>;
}) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const { ngo: initialNgoId, adoption: initialAdoptionId } = await searchParams;
  const [users, adoptions, surrenders] = await Promise.all([
    readUsers(),
    listAdoptionsByAdopter(user.id),
    listSurrendersByAdopter(user.id),
  ]);

  const ngos = users
    .filter(
      (u) => u.role === "ngo" && u.ngo?.verification.status === "verified",
    )
    .map((u) => {
      const { address } = u.ngo!.legal;
      return {
        id: u.id,
        name: u.ngo!.legal.tradeName || u.name,
        city: [address.city, address.state].filter(Boolean).join("/"),
      };
    });
  const ngoName = new Map(ngos.map((o) => [o.id, o.name]));

  // Adopted pets without an active return request.
  const busyPetIds = new Set(
    surrenders.filter((s) => isSurrenderActive(s.status)).map((s) => s.petId),
  );
  const returns: SurrenderReturnOption[] = [];
  for (const adoption of adoptions) {
    if (
      (adoption.status !== "follow_up" && adoption.status !== "completed") ||
      busyPetIds.has(adoption.petId) ||
      !ngoName.has(adoption.ngoId)
    ) {
      continue;
    }
    const pet = await getPetById(adoption.petId);
    if (!pet) continue;
    returns.push({
      adoptionId: adoption.id,
      ngoId: adoption.ngoId,
      ngoName: ngoName.get(adoption.ngoId) ?? "ONG",
      pet: {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        sex: pet.sex,
        size: pet.size,
        ageGroup: pet.ageGroup,
        health: pet.health,
        description: pet.description,
        photos: pet.photos,
      },
    });
  }

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <LinkButton
          href="/adopter/notifications"
          variant="pill"
          size="sm"
          className="self-start"
        >
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Atividade
        </LinkButton>
        <CardTitle>Deixar um pet com a ONG</CardTitle>
        <p className="text-sm text-neutral-600">
          Se você não pode mais ficar com o animal, a ONG pode recebê-lo e
          procurar um novo lar. É o caminho inverso da adoção: você conta o
          caso, a ONG analisa, vocês assinam um termo e combinam a entrega.
        </p>
      </Card>

      {ngos.length === 0 ? (
        <Card className="items-center gap-2 text-center">
          <p className="text-sm text-neutral-600">
            Ainda não há ONGs verificadas para receber pedidos.
          </p>
        </Card>
      ) : (
        <SurrenderRequestForm
          ngos={ngos}
          returns={returns}
          initialNgoId={initialNgoId}
          initialAdoptionId={initialAdoptionId}
        />
      )}

      <AdopterTabBar />
    </PageShell>
  );
}
