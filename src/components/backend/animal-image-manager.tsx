"use client";

import { Button, FormError } from "@/components/ui";
import { apiMutations } from "@/lib/api/mutations";
import { membersOptions } from "@/lib/api/queries";
import type {
  AnimalDetailResponse,
  UserResponse,
} from "@/lib/backend/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { QueryStatus } from "./query-status";

type AnimalImageManagerProps = {
  data: AnimalDetailResponse;
  user: UserResponse;
  selectedOrganizationId?: string;
};
const MODERATION_LABELS: Record<string, string> = {
  pending: "Em análise",
  approved: "Aprovada",
  rejected: "Recusada",
};

export function AnimalImageManager({
  data,
  user,
  selectedOrganizationId,
}: AnimalImageManagerProps) {
  const organizationId = data.animal.responsibleOrganizationId;
  const shouldCheckMembership = Boolean(
    organizationId &&
    (organizationId === selectedOrganizationId || user.roles.includes("admin")),
  );
  const members = useQuery({
    ...membersOptions(organizationId ?? ""),
    enabled: shouldCheckMembership,
  });
  const moderate = useMutation(apiMutations.moderateImage());
  const remove = useMutation(apiMutations.removeImage());
  const canModerate =
    user.roles.includes("admin") ||
    members.data?.items.some(
      (member) =>
        member.userId === user.id &&
        member.status === "active" &&
        member.canPublishAnimals,
    );
  return (
    <section className="flex flex-col gap-3 border-t border-border-light pt-4">
      <h2 className="text-lg font-bold">Fotos do animal</h2>
      {shouldCheckMembership ? <QueryStatus query={members} /> : null}
      {!data.images.length ? <p>Nenhuma foto cadastrada.</p> : null}
      <ul className="flex flex-col gap-4">
        {data.images.map((image) => (
          <li key={image.id} className="flex flex-col gap-2">
            {/^https?:\/\//.test(image.storageKey) ? (
              <Image
                src={image.storageKey}
                alt={image.altText || data.animal.name}
                width={600}
                height={450}
                unoptimized
                className="h-auto max-h-80 w-full rounded-2xl object-contain"
              />
            ) : (
              <p>Prévia indisponível.</p>
            )}
            <p>
              {MODERATION_LABELS[image.moderationStatus] ??
                "Situação não informada"}
            </p>
            <div className="flex flex-wrap gap-2">
              {canModerate && image.moderationStatus !== "approved" ? (
                <Button
                  variant="outline"
                  disabled={moderate.isPending || remove.isPending}
                  onClick={() =>
                    moderate.mutate({
                      id: data.animal.id,
                      imageId: image.id,
                      decision: "approved",
                    })
                  }
                >
                  Aprovar foto
                </Button>
              ) : null}
              {canModerate && image.moderationStatus !== "rejected" ? (
                <Button
                  variant="outline"
                  disabled={moderate.isPending || remove.isPending}
                  onClick={() =>
                    moderate.mutate({
                      id: data.animal.id,
                      imageId: image.id,
                      decision: "rejected",
                    })
                  }
                >
                  Recusar foto
                </Button>
              ) : null}
              <Button
                variant="danger-ghost"
                disabled={moderate.isPending || remove.isPending}
                onClick={() =>
                  remove.mutate({ id: data.animal.id, imageId: image.id })
                }
              >
                Remover foto
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <FormError id="image-manager-error">
        {moderate.error?.message ?? remove.error?.message}
      </FormError>
    </section>
  );
}
