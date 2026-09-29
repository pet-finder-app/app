"use client";

import { PawIcon } from "@/components/paw-icon";
import {
  Badge,
  Button,
  cn,
  shadowSoft,
  Textarea,
  type BadgeTone,
} from "@/components/ui";
import {
  PET_SPECIES_LABEL,
  PET_STATUS_LABEL,
  type Pet,
  type PetStatus,
} from "@/lib/pet";
import { Heart, MessageCircleHeart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PET_STATUS_TONE: Record<PetStatus, BadgeTone> = {
  disponivel: "success",
  em_processo: "warning",
  adotado: "neutral",
};

type AdopterPetCardProps = {
  pet: Pet;
  tone: string;
  liked: boolean;
  interested: boolean;
};

/** Card do feed do adotante: dados do pet, curtir (alterna) e demonstrar interesse (mensagem). */
export function AdopterPetCard({
  pet,
  tone,
  liked,
  interested,
}: AdopterPetCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(liked);
  const [isToggling, setIsToggling] = useState(false);
  const [hasInterest, setHasInterest] = useState(interested);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [message, setMessage] = useState("");
  const [isSendingInterest, setIsSendingInterest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoUrl = pet.photos[0]?.url;
  const errorId = `interesse-error-${pet.id}`;

  async function toggleLike() {
    setIsToggling(true);
    try {
      const response = await fetch(`/api/pets/${pet.id}/curtir`, {
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

  async function sendInterest() {
    if (!message.trim()) {
      setError("Escreva uma mensagem para a ONG.");
      return;
    }
    setError(null);
    setIsSendingInterest(true);
    try {
      const response = await fetch(`/api/pets/${pet.id}/interesse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Não foi possível enviar.");
        return;
      }
      setHasInterest(true);
      setShowInterestForm(false);
      setMessage("");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setIsSendingInterest(false);
    }
  }

  return (
    <li
      className={cn("flex flex-col gap-3 rounded-2xl p-3", tone, shadowSoft.sm)}
    >
      <div className="flex items-center gap-3">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-white/40">
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
          <Badge
            tone={PET_STATUS_TONE[pet.status]}
            size="sm"
            className={cn("mt-1", shadowSoft.sm)}
          >
            {PET_STATUS_LABEL[pet.status]}
          </Badge>
        </div>

        <button
          type="button"
          onClick={() => void toggleLike()}
          disabled={isToggling}
          aria-pressed={isLiked}
          aria-label={isLiked ? `Descurtir ${pet.name}` : `Curtir ${pet.name}`}
          className="flex shrink-0 items-center justify-center rounded-full p-2.5 text-neutral-900 hover:bg-white/50 disabled:opacity-60"
        >
          <Heart
            className="size-5"
            fill={isLiked ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
      </div>

      {hasInterest ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
          <MessageCircleHeart className="size-4" aria-hidden="true" />
          Você já demonstrou interesse nesse pet.
        </p>
      ) : showInterestForm ? (
        <div className="flex flex-col gap-2">
          <Textarea
            id={`interesse-${pet.id}`}
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
              className="text-xs font-semibold text-red-500"
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
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInterestForm(true)}
        >
          Tenho interesse em adotar
        </Button>
      )}
    </li>
  );
}
