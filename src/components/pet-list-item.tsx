import { PawIcon } from "@/components/paw-icon";
import { PetCardMenu } from "@/components/pet-card-menu";
import { Badge, cn, type BadgeTone } from "@/components/ui";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SPECIES_LABEL,
  PET_STATUS_LABEL,
  type Pet,
  type PetStatus,
} from "@/lib/pet";
import { Eye, Heart, MessageCircle, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PET_STATUS_TONE: Record<PetStatus, BadgeTone> = {
  disponivel: "success",
  em_processo: "warning",
  adotado: "neutral",
  indisponivel: "neutral",
};

/**
 * Sobrescreve a cor do tom "success" só aqui — o Badge de "verificada"
 * também usa esse tom e não deve mudar junto. Texto preto como nos
 * outros status (o tom "success" vem com texto verde por padrão).
 */
const PET_STATUS_BADGE_CLASS: Partial<Record<PetStatus, string>> = {
  disponivel: "bg-green-300! text-neutral-900!",
};

/** Card de um pet na tela de gestão (`/ong/pets`): status, curtidas, interessados e menu de editar/arquivar. */
export function PetListItem({
  pet,
  tone,
  likesCount,
  interestedCount,
  index = 0,
}: {
  pet: Pet;
  tone: string;
  likesCount: number;
  interestedCount: number;
  /** Posição na lista: escalona a animação de entrada. */
  index?: number;
}) {
  const photoUrl = pet.photos[0]?.url;

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className={cn(
        "rise-in relative flex items-center gap-3 rounded-xl border border-neutral-900 p-3 transition-transform duration-200 hover:-translate-y-0.5 has-[[aria-expanded=true]]:z-20 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
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
        <p className="truncate text-xs text-neutral-900">
          {PET_SPECIES_LABEL[pet.species]}
          {pet.breed ? ` · ${pet.breed}` : ""}
        </p>
        <p className="truncate text-xs text-neutral-600">
          {PET_SEX_LABEL[pet.sex]} · {PET_AGE_GROUP_LABEL[pet.ageGroup]}
        </p>
        <p className="flex items-center gap-1 truncate text-xs text-neutral-600">
          <Eye className="size-3.5 shrink-0" aria-hidden="true" />
          {pet.views} visualizações
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
        <span className="relative flex size-9 items-center justify-center text-neutral-900">
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
          href={`/ong/pets/${pet.id}/interessados`}
          className="flex size-9 items-center justify-center rounded-full text-neutral-900 hover:bg-white/50"
        >
          <Users className="size-5" aria-hidden="true" />
          <span className="sr-only">Ver interessados em {pet.name}</span>
        </Link>

        <Link
          href={`/ong/mensagens?pet=${pet.id}`}
          className="relative flex size-9 items-center justify-center rounded-full text-neutral-900 hover:bg-white/50"
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
