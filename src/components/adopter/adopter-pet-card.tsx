"use client";

import { PawIcon } from "@/components/brand/paw-icon";
import {
  Badge,
  Button,
  cn,
  shadowSoft,
  Textarea,
  type BadgeTone,
} from "@/components/ui";
import { formatDistanceKm } from "@/lib/format-distance";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SPECIES_LABEL,
  PET_STATUS_LABEL,
  type Pet,
  type PetStatus,
} from "@/lib/pet";
import {
  Check,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircleHeart,
  ThumbsDown,
  Undo2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const PET_STATUS_TONE: Record<PetStatus, BadgeTone> = {
  available: "success",
  in_progress: "warning",
  adopted: "neutral",
  unavailable: "neutral",
};

type AdopterPetActionsProps = {
  petId: string;
  petName: string;
  ngoName: string;
  liked: boolean;
  interested: boolean;
  /** Whether the profile has a contact phone number. */
  hasPhone: boolean;
  /** Whether the pet is currently discarded. */
  disliked?: boolean;
  /** Use a prominent adoption action on the pet details page. */
  layout?: "default" | "details";
  /** Optional content at the end of the action row. */
  trailing?: ReactNode;
};

/** Shared pet-like toggle and adoption-interest message actions. */
export function AdopterPetActions({
  petId,
  petName,
  ngoName,
  liked,
  interested,
  hasPhone,
  disliked = false,
  trailing,
  layout = "default",
}: AdopterPetActionsProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(liked);
  const [isToggling, setIsToggling] = useState(false);
  const [isDisliked, setIsDisliked] = useState(disliked);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [hasInterest, setHasInterest] = useState(interested);
  const [justSent, setJustSent] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const draftKey = `interest-draft-${petId}`;
  const [message, setMessageState] = useState("");
  function setMessage(value: string) {
    setMessageState(value);
    try {
      sessionStorage.setItem(draftKey, value);
    } catch {}
  }
  const [isSendingInterest, setIsSendingInterest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorId = `interest-error-${petId}`;

  // Keep the draft when the user leaves to complete their profile.
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(draftKey);
      if (draft) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessageState(draft);
        setShowInterestForm(true);
      }
    } catch {}
  }, [draftKey]);

  async function toggleLike() {
    setIsToggling(true);
    try {
      const response = await fetch(`/api/pets/${petId}/like`, {
        method: "POST",
      });
      if (response.ok) {
        const data = (await response.json()) as { liked: boolean };
        setIsLiked(data.liked);
        router.refresh();
      }
    } finally {
      setIsToggling(false);
    }
  }

  async function toggleDislike() {
    setIsDiscarding(true);
    try {
      const response = await fetch(`/api/pets/${petId}/dislike`, {
        method: "POST",
      });
      if (response.ok) {
        const data = (await response.json()) as { disliked: boolean };
        setIsDisliked(data.disliked);
        router.refresh();
      }
    } finally {
      setIsDiscarding(false);
    }
  }

  async function sendInterest() {
    if (!message.trim()) {
      setError("Escreva uma mensagem para a ONG.");
      return;
    }
    setError(null);
    setIsSendingInterest(true);
    try {
      const response = await fetch(`/api/pets/${petId}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Não foi possível enviar.");
        return;
      }
      setConversationId(data.conversationId ?? null);
      setHasInterest(true);
      setJustSent(true);
      setShowInterestForm(false);
      setMessage("");
      try {
        sessionStorage.removeItem(draftKey);
      } catch {}
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setIsSendingInterest(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => void toggleLike()}
          disabled={isToggling}
          aria-pressed={isLiked}
          title={isLiked ? "Tirar dos favoritos" : "Favoritar"}
          className={cn(
            "flex size-11 items-center justify-center rounded-full transition-transform hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none active:scale-90 disabled:opacity-60",
            isLiked ? "text-red-500" : "text-neutral-900",
          )}
        >
          <Heart
            className="size-7"
            fill={isLiked ? "currentColor" : "none"}
            aria-hidden="true"
          />
          <span className="sr-only">
            {isLiked ? "Tirar dos favoritos" : "Favoritar"} {petName}
          </span>
        </button>
        <Button
          size="sm"
          variant={hasInterest ? "pill" : "primary"}
          onClick={() => !hasInterest && setShowInterestForm((open) => !open)}
          aria-expanded={showInterestForm}
          className={cn(
            "min-h-9 px-4 text-sm",
            layout === "details" && "min-h-11 min-w-0 flex-1 shadow-none",
          )}
        >
          <MessageCircleHeart className="size-5" aria-hidden="true" />
          {hasInterest ? "Pedido enviado" : "Quero adotar"}
          <span className="sr-only"> {petName}</span>
        </Button>
        <button
          type="button"
          onClick={() => void toggleDislike()}
          disabled={isDiscarding}
          aria-pressed={isDisliked}
          title={isDisliked ? "Rever este pet" : "Não tenho interesse"}
          className="flex size-11 items-center justify-center rounded-full text-neutral-900 transition-transform hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none active:scale-90 disabled:opacity-60"
        >
          {isDisliked ? (
            <Undo2 className="size-6" aria-hidden="true" />
          ) : (
            <ThumbsDown className="size-6" aria-hidden="true" />
          )}
          <span className="sr-only">
            {isDisliked ? "Rever" : "Não tenho interesse em"} {petName}
          </span>
        </button>
        {trailing ? <div className="ml-auto">{trailing}</div> : null}
      </div>

      {hasInterest ? (
        <div
          role="status"
          className={cn(
            "flex flex-col gap-1 rounded-2xl bg-primary-faint p-3",
            shadowSoft.sm,
          )}
        >
          <p className="flex items-center gap-1.5 text-sm font-bold text-lime-800">
            <Check className="size-4" aria-hidden="true" />
            {justSent
              ? `Mensagem enviada para ${ngoName}!`
              : "Você já demonstrou interesse."}
          </p>
          <p className="text-xs text-neutral-900">
            A ONG responde na conversa abaixo. Você também pode ser avisado pelo
            telefone ou e-mail do seu perfil.
          </p>
          <Link
            href={
              conversationId
                ? `/adopter/conversations/${conversationId}`
                : `/adopter/conversations?pet=${petId}`
            }
            className="text-sm font-bold text-lime-800 underline"
          >
            Abrir conversa com {ngoName}
          </Link>
        </div>
      ) : showInterestForm ? (
        <div className="flex flex-col gap-2">
          {hasPhone ? null : (
            <p
              role="status"
              className="rounded-2xl bg-accent-yellow px-3 py-2 text-xs text-neutral-900"
            >
              Seu perfil está sem telefone, então a ONG só poderá responder por
              e-mail.{" "}
              <Link href="/me#phone" className="font-bold underline">
                Adicionar telefone
              </Link>
            </p>
          )}
          <Textarea
            id={`interest-${petId}`}
            label="Mensagem para a ONG"
            placeholder="Conte por que você quer adotar esse pet."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            invalid={Boolean(error)}
            errorId={errorId}
          />
          {error ? (
            <p
              id={errorId}
              role="alert"
              className="text-xs font-semibold text-red-700"
            >
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowInterestForm(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1"
              loading={isSendingInterest}
              loadingLabel="ENVIANDO..."
              onClick={() => void sendInterest()}
            >
              Enviar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type AdopterPetCardProps = {
  pet: Pet;
  tone: string;
  liked: boolean;
  interested: boolean;
  ngoName: string;
  city: string;
  hasPhone: boolean;
  disliked?: boolean;
  /** Straight-line distance to the NGO when a reference location is available. */
  distanceKm?: number | null;
};

/** Adopter feed card with favorite and adoption actions. */
export function AdopterPetCard({
  pet,
  tone,
  liked,
  interested,
  ngoName,
  city,
  hasPhone,
  disliked = false,
  distanceKm = null,
}: AdopterPetCardProps) {
  const photoUrl = pet.photos[0]?.url;

  return (
    <li
      className={cn("flex flex-col gap-3 rounded-2xl p-3", tone, shadowSoft.sm)}
    >
      <Link
        href={`/pets/${pet.id}`}
        className="flex items-center gap-3 rounded-2xl focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none"
      >
        <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-white/40">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <PawIcon className="absolute inset-0 m-auto size-8 text-neutral-900/30" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-neutral-900">{pet.name}</p>
          <p className="truncate text-xs text-neutral-900">
            {PET_SPECIES_LABEL[pet.species]}
            {pet.breed ? ` · ${pet.breed}` : ""} ·{" "}
            {PET_AGE_GROUP_LABEL[pet.ageGroup]} · {PET_SEX_LABEL[pet.sex]}
          </p>
          <p className="text-xs text-neutral-900">
            {ngoName}
            {city ? (
              <>
                {" · "}
                <MapPin
                  className="inline size-3 align-[-1px]"
                  aria-hidden="true"
                />{" "}
                {city}
              </>
            ) : null}
            {distanceKm !== null
              ? ` · a ${formatDistanceKm(distanceKm)}`
              : null}
          </p>
          <Badge
            tone={PET_STATUS_TONE[pet.status]}
            size="sm"
            className={cn("mt-1", shadowSoft.sm)}
          >
            {PET_STATUS_LABEL[pet.status]}
          </Badge>
        </div>
        <ChevronRight
          className="size-5 shrink-0 text-neutral-900"
          aria-label="Ver detalhes"
        />
      </Link>

      <AdopterPetActions
        petId={pet.id}
        petName={pet.name}
        ngoName={ngoName}
        liked={liked}
        interested={interested}
        hasPhone={hasPhone}
        disliked={disliked}
      />
    </li>
  );
}
