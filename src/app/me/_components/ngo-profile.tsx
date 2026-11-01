import { LogoutButton } from "@/components/account/logout-button";
import { NgoPetsPhotoFeed } from "@/components/ngo/ngo-pets-photo-feed";
import { NgoProfileCard } from "@/components/ngo/ngo-profile-card";
import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { NgoVerificationChecklistCard } from "@/components/ngo/ngo-verification-checklist-card";
import { Card, iconSize, PageShell } from "@/components/ui";
import { BrutalLinkButton } from "@/components/ui/brutal-button";
import type { NgoProfile as NgoProfileData } from "@/lib/ngo";
import {
  countNotificationsByPet,
  listNotificationsByNgo,
} from "@/lib/notifications";
import { listPetsByNgo } from "@/lib/pets";
import { listPostsByNgo } from "@/lib/posts";
import { Settings } from "lucide-react";

type NgoProfileProps = {
  userId: string;
  ngo: NgoProfileData;
  created?: string;
};

/** Organization profile, publications, and verification checklist. */
export async function NgoProfile({ userId, ngo, created }: NgoProfileProps) {
  const status = ngo.verification.status;
  const verified = status === "verified";

  const [allPets, notifications, posts] = await Promise.all([
    listPetsByNgo(userId),
    listNotificationsByNgo(userId),
    listPostsByNgo(userId),
  ]);
  const pets = allPets.filter((pet) => !pet.archived);
  const unreadCount = notifications.filter((n) => n.readAt === null).length;
  const likesByPet = countNotificationsByPet(notifications, "like");
  const interestedByPet = countNotificationsByPet(notifications, "interest");

  return (
    <PageShell hasActionBar>
      <NgoProfileCard ngo={ngo} pets={pets}>
        <div className="flex flex-col gap-2">
          <BrutalLinkButton href="/ngo/settings" variant="outline" size="md">
            <Settings className={iconSize.md} aria-hidden="true" />
            Configurações
          </BrutalLinkButton>
          {verified ? (
            <>
              <BrutalLinkButton href="/ngo/pets/new" size="md">
                Cadastrar pet
              </BrutalLinkButton>
              <BrutalLinkButton href="/ngo/pets" variant="outline" size="md">
                Meus pets ({pets.length})
              </BrutalLinkButton>
            </>
          ) : null}
          <LogoutButton brutal />
        </div>
      </NgoProfileCard>

      {created === "pet" || created === "post" ? (
        <Card role="status" tone="success">
          <p className="text-sm font-bold text-lime-800">
            ✓ {created === "pet" ? "Pet cadastrado!" : "Post publicado!"}
          </p>
          <p className="text-sm text-neutral-900">
            {created === "pet"
              ? "Ele já aparece para quem quer adotar. Toque em Cadastrar pet para adicionar outro."
              : "Ele já aparece abaixo, em Fotos dos pets."}
          </p>
        </Card>
      ) : null}

      {!verified ? (
        <NgoVerificationChecklistCard ngo={ngo} />
      ) : (
        <NgoPetsPhotoFeed
          posts={posts}
          pets={allPets}
          ngoName={ngo.legal.tradeName}
          ngoNickname={ngo.legal.nickname}
          ngoLogoUrl={ngo.publicProfile.logo?.url ?? null}
          likesByPet={likesByPet}
          interestedByPet={interestedByPet}
        />
      )}

      <NgoTabBar unreadCount={unreadCount} />
    </PageShell>
  );
}
