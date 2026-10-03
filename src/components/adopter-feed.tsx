"use client";

import { AdopterPetActions } from "@/components/adopter-pet-card";
import { OngPostCard } from "@/components/ong-post-card";
import { Button, Card, cn, shadowSoft } from "@/components/ui";
import { type Pet } from "@/lib/pet";
import type { PetOngInfo } from "@/lib/pets";
import type { Post } from "@/lib/post";
import { UserCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

type FeedTabsProps = {
  recommended: ReactNode;
  following: ReactNode;
  followingCount: number;
};

/** Duas abas do feed do adotante: "Recomendações" (tudo) e "Seguindo" (só as ONGs que segue). */
export function AdopterFeedTabs({
  recommended,
  following,
  followingCount,
}: FeedTabsProps) {
  const [tab, setTab] = useState<"recommended" | "following">("recommended");
  const tabs = [
    { id: "recommended", label: "Recomendações" },
    { id: "following", label: `Seguindo (${followingCount})` },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Feed de pets"
        className={cn("flex gap-1 rounded-full bg-white p-1", shadowSoft.sm)}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`feed-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`feed-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 flex-1 rounded-full px-3 text-sm font-bold transition-colors",
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`feed-panel-${tab}`}
        aria-labelledby={`feed-tab-${tab}`}
      >
        {tab === "recommended" ? recommended : following}
      </div>
    </div>
  );
}

/** Botão de seguir/seguindo uma ONG. */
export function FollowButton({
  ongId,
  ongName,
  following,
  showHint = false,
}: {
  ongId: string;
  ongName: string;
  following: boolean;
  /** Mostra "toque de novo para deixar de seguir" enquanto está seguindo. */
  showHint?: boolean;
}) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(following);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const response = await fetch(`/api/ongs/${ongId}/seguir`, {
        method: "POST",
      });
      if (response.ok) {
        const data = (await response.json()) as { following: boolean };
        setIsFollowing(data.following);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={isFollowing ? "outline" : "primary"}
        size="sm"
        disabled={busy}
        aria-pressed={isFollowing}
        onClick={() => void toggle()}
      >
        {isFollowing ? (
          <UserCheck className="size-4" aria-hidden="true" />
        ) : (
          <UserPlus className="size-4" aria-hidden="true" />
        )}
        {isFollowing ? "Seguindo" : "Seguir"}
        <span className="sr-only"> {ongName}</span>
      </Button>
      {showHint && isFollowing ? (
        <p className="text-xs text-neutral-600">
          Toque de novo para deixar de seguir.
        </p>
      ) : null}
    </div>
  );
}

type FeedPostProps = {
  post: Post;
  pet: Pet | null;
  ong: PetOngInfo;
  /** Posição no feed, só para alternar a cor do balão do pet. */
  index: number;
  following: boolean;
  liked: boolean;
  interested: boolean;
  hasPhone: boolean;
};

/** Mesmas cores do balão do pet no post da ONG. */
const BUBBLE_TONE = [
  "bg-yellow-200",
  "bg-emerald-200",
  "bg-orange-200",
  "bg-purple-200",
];

/** Post de uma ONG no feed: o mesmo cartão que a ONG vê, com Seguir e as ações de adoção. */
export function AdopterFeedPost({
  post,
  pet,
  ong,
  index,
  following,
  liked,
  interested,
  hasPhone,
}: FeedPostProps) {
  return (
    <OngPostCard
      post={post}
      pet={pet}
      tone={BUBBLE_TONE[index % BUBBLE_TONE.length]}
      ongName={ong.name}
      ongNickname={ong.nickname}
      ongLogoUrl={ong.logoUrl}
      likesCount={0}
      interestedCount={0}
      headerAction={
        <FollowButton ongId={ong.id} ongName={ong.name} following={following} />
      }
      footer={
        pet ? (
          <AdopterPetActions
            trailing={
              <Link
                href={`/pets/${pet.id}`}
                className="rounded-full px-2 py-2 text-sm font-bold text-neutral-900 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none"
              >
                Ver detalhes
              </Link>
            }
            petId={pet.id}
            petName={pet.name}
            ongName={ong.name}
            liked={liked}
            interested={interested}
            hasPhone={hasPhone}
          />
        ) : undefined
      }
    />
  );
}

/** Mensagem de lista vazia de uma aba do feed. */
export function FeedEmpty({ children }: { children: ReactNode }) {
  return (
    <Card className="items-center gap-2 text-center">
      <p className="text-sm text-neutral-600">{children}</p>
    </Card>
  );
}
