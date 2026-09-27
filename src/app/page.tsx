import { AdopterPetCard } from "@/components/adopter-pet-card";
import { AdopterTabBar } from "@/components/adopter-tab-bar";
import { BrutalLinkButton } from "@/components/brutal-button";
import { OngPetsPhotoFeed } from "@/components/ong-pets-photo-feed";
import { OngProfileCard } from "@/components/ong-profile-card";
import { OngTabBar } from "@/components/ong-tab-bar";
import { OngVerificationChecklistCard } from "@/components/ong-verification-checklist-card";
import { PawIcon } from "@/components/paw-icon";
import {
  Card,
  iconSize,
  LinkButton,
  PageShell,
  Progress,
} from "@/components/ui";
import { VerificationBadge } from "@/components/verification-badge";
import {
  ADOPTER_VERIFICATION_STATUS_LABEL,
  getAdopterChecklist,
} from "@/lib/adopter";
import {
  countNotificationsByPet,
  listNotificationsByAdopter,
  listNotificationsByOng,
} from "@/lib/notifications";
import { listAvailablePets, listPetsByOng } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

const CARD_TONE = ["bg-primary-faint", "bg-accent-yellow", "bg-accent-peach"];

export default async function App() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ong" && user.ong) {
    const ong = user.ong;
    const status = ong.verification.status;
    const verified = status === "verificada";

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
        <OngProfileCard ong={ong} pets={pets}>
          <div className="flex flex-col gap-2">
            <BrutalLinkButton
              href="/ong/perfil/editar"
              variant="outline"
              size="md"
            >
              Editar informações
            </BrutalLinkButton>
            {verified ? (
              <BrutalLinkButton href="/ong/pets/novo" size="md">
                Cadastrar pet
              </BrutalLinkButton>
            ) : null}
          </div>
        </OngProfileCard>

        {!verified ? (
          <OngVerificationChecklistCard ong={ong} />
        ) : (
          <OngPetsPhotoFeed
            pets={pets}
            ongName={ong.legal.tradeName}
            ongNickname={ong.legal.nickname}
            ongLogoUrl={ong.publicProfile.logo?.url ?? null}
            likesByPet={likesByPet}
            interestedByPet={interestedByPet}
          />
        )}

        <OngTabBar unreadCount={unreadCount} />
      </PageShell>
    );
  }

  if (user.role === "adopter" && user.adopter) {
    const adopter = user.adopter;
    const status = adopter.verification.status;
    const checklist = getAdopterChecklist(adopter);
    const done = checklist.filter((item) => item.done).length;

    const [pets, myNotifications] = await Promise.all([
      listAvailablePets(),
      listNotificationsByAdopter(user.id),
    ]);
    const likedPetIds = new Set(
      myNotifications.filter((n) => n.type === "curtida").map((n) => n.petId),
    );
    const interestedPetIds = new Set(
      myNotifications.filter((n) => n.type === "interesse").map((n) => n.petId),
    );

    return (
      <PageShell hasActionBar>
        <Card as="header" className="gap-3">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft"
            >
              {adopter.personal.avatar?.url ? (
                <Image
                  src={adopter.personal.avatar.url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <PawIcon className="size-8 text-green-900" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-neutral-900">
                {user.name}
              </h1>
              <div className="mt-1">
                <VerificationBadge
                  status={status}
                  label={ADOPTER_VERIFICATION_STATUS_LABEL[status]}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {status !== "verificada" ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm text-neutral-700">
                {status === "em_analise"
                  ? "Estamos conferindo seu perfil. Avisamos por e-mail quando terminar."
                  : "Complete seu perfil para passar mais confiança às ONGs na hora de adotar."}
              </p>
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
                <span>Checklist</span>
                <span>
                  {done}/{checklist.length}
                </span>
              </div>
              <Progress
                value={done}
                max={checklist.length}
                label="Itens do perfil concluídos"
              />
              <LinkButton href="/adotante/perfil" size="md" className="mt-1">
                {status === "pendente" ? "Completar perfil" : "Ver meu perfil"}
              </LinkButton>
            </div>
          ) : (
            <LinkButton
              href="/adotante/perfil"
              variant="outline"
              size="sm"
              className="self-start"
            >
              Ver meu perfil
            </LinkButton>
          )}
        </Card>

        <div>
          <div className="mb-2 flex items-center gap-2 text-neutral-500">
            <PawIcon className={iconSize.md} aria-hidden="true" />
            <span className="text-xs font-bold tracking-wide uppercase">
              Pets para adoção
            </span>
          </div>

          {pets.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {pets.map((pet, index) => (
                <AdopterPetCard
                  key={pet.id}
                  pet={pet}
                  tone={CARD_TONE[index % CARD_TONE.length]}
                  liked={likedPetIds.has(pet.id)}
                  interested={interestedPetIds.has(pet.id)}
                />
              ))}
            </ul>
          ) : (
            <Card className="items-center gap-2 text-center">
              <p className="text-sm text-neutral-600">
                Nenhum pet disponível para adoção no momento.
              </p>
            </Card>
          )}
        </div>

        <AdopterTabBar />
      </PageShell>
    );
  }

  return (
    <PageShell className="justify-center">
      <p className="text-center text-sm text-neutral-600">Conteúdo principal</p>
    </PageShell>
  );
}
