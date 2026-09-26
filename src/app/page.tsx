import { AdopterPetCard } from "@/components/adopter-pet-card";
import { AdopterTabBar } from "@/components/adopter-tab-bar";
import { BrutalLinkButton } from "@/components/brutal-button";
import { BrutalCard } from "@/components/brutal-card";
import { OngProfileCard } from "@/components/ong-profile-card";
import { OngTabBar } from "@/components/ong-tab-bar";
import { PawIcon } from "@/components/paw-icon";
import { PetCardMenu } from "@/components/pet-card-menu";
import {
  Badge,
  Card,
  cn,
  iconSize,
  LinkButton,
  PageShell,
  Progress,
  type BadgeTone,
} from "@/components/ui";
import { VerificationBadge } from "@/components/verification-badge";
import {
  ADOPTER_VERIFICATION_STATUS_LABEL,
  getAdopterChecklist,
} from "@/lib/adopter";
import type { Notification, NotificationType } from "@/lib/notification";
import {
  listNotificationsByAdopter,
  listNotificationsByOng,
} from "@/lib/notifications";
import { getOngChecklist } from "@/lib/ong";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SPECIES_LABEL,
  PET_STATUS_LABEL,
  type Pet,
  type PetStatus,
} from "@/lib/pet";
import { listAvailablePets, listPetsByOng } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { Heart, MessageCircle } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const CARD_TONE = ["bg-primary-faint", "bg-accent-yellow", "bg-accent-peach"];

const PET_STATUS_TONE: Record<PetStatus, BadgeTone> = {
  disponivel: "success",
  em_processo: "warning",
  adotado: "neutral",
};

/**
 * Sobrescreve a cor do tom "success" só aqui — o Badge de "verificada"
 * também usa esse tom e não deve mudar junto. Texto preto como nos
 * outros status (o tom "success" vem com texto verde por padrão).
 */
const PET_STATUS_BADGE_CLASS: Partial<Record<PetStatus, string>> = {
  disponivel: "bg-green-300! text-neutral-900!",
};

function countNotificationsByPet(
  notifications: Notification[],
  type: NotificationType,
): Record<string, number> {
  return notifications.reduce<Record<string, number>>((acc, n) => {
    if (n.type === type) acc[n.petId] = (acc[n.petId] ?? 0) + 1;
    return acc;
  }, {});
}

function PetListItem({
  pet,
  tone,
  likesCount,
  interestedCount,
}: {
  pet: Pet;
  tone: string;
  likesCount: number;
  interestedCount: number;
}) {
  const photoUrl = pet.photos[0]?.url;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border border-neutral-900 p-3",
        tone,
      )}
    >
      <span className="relative size-14 shrink-0 overflow-hidden rounded-full border border-neutral-900 bg-white/40">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <PawIcon className="absolute inset-0 m-auto size-6 text-neutral-900/30" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-neutral-900">{pet.name}</p>
        <p className="truncate text-xs text-neutral-700">
          {PET_SPECIES_LABEL[pet.species]}
          {pet.breed ? ` · ${pet.breed}` : ""}
        </p>
        <p className="truncate text-xs text-neutral-500">
          {PET_SEX_LABEL[pet.sex]} · {PET_AGE_GROUP_LABEL[pet.ageGroup]}
        </p>
        <Badge
          tone={PET_STATUS_TONE[pet.status]}
          size="sm"
          className={cn(
            "mt-1 border border-neutral-900",
            PET_STATUS_BADGE_CLASS[pet.status],
          )}
        >
          {PET_STATUS_LABEL[pet.status]}
        </Badge>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="relative flex size-9 items-center justify-center text-neutral-700">
          <Heart className="size-5" aria-hidden="true" />
          {likesCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-[9px] font-bold text-white"
            >
              {likesCount > 9 ? "9+" : likesCount}
            </span>
          ) : null}
          <span className="sr-only">{likesCount} curtidas de adotantes</span>
        </span>

        <Link
          href={`/ong/mensagens?pet=${pet.id}`}
          className="relative flex size-9 items-center justify-center rounded-full text-neutral-700 hover:bg-white/50"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          {interestedCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-[9px] font-bold text-white"
            >
              {interestedCount > 9 ? "9+" : interestedCount}
            </span>
          ) : null}
          <span className="sr-only">
            {interestedCount} adotantes interessados em adotar {pet.name} — ver
            mensagens
          </span>
        </Link>

        <PetCardMenu pet={pet} />
      </div>
    </li>
  );
}

export default async function App() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ong" && user.ong) {
    const ong = user.ong;
    const checklist = getOngChecklist(ong);
    const done = checklist.filter((item) => item.done).length;
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
        <OngProfileCard ong={ong} pets={pets} notifications={notifications}>
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
          <BrutalCard className="gap-3">
            <div>
              <p className="text-sm font-bold text-neutral-900">
                {status === "em_analise"
                  ? "Cadastro em análise"
                  : "Complete o cadastro para publicar pets"}
              </p>
              <p className="text-sm text-neutral-600">
                {status === "em_analise"
                  ? "Estamos conferindo seus documentos. Avisamos por e-mail quando terminar."
                  : "Os documentos só são exigidos na hora de publicar o primeiro pet."}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
                <span>Checklist</span>
                <span>
                  {done}/{checklist.length}
                </span>
              </div>
              <Progress
                value={done}
                max={checklist.length}
                label="Itens do cadastro concluídos"
              />
            </div>

            <BrutalLinkButton href="/ong/perfil/editar" size="lg">
              {status === "pendente"
                ? "COMPLETAR CADASTRO"
                : "VER PERFIL DA ONG"}
            </BrutalLinkButton>
          </BrutalCard>
        ) : (
          <div>
            <div className="mb-2 flex items-center gap-2 text-neutral-500">
              <PawIcon className={iconSize.md} aria-hidden="true" />
              <span className="text-xs font-bold tracking-wide uppercase">
                Pets publicados
              </span>
            </div>

            {pets.length > 0 ? (
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
          </div>
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
