"use client";

import { Button, FormError } from "@/components/ui";
import { animalMutations } from "@/lib/api/animals";
import { apiMutations, IMAGE_TYPES } from "@/lib/api/mutations";
import { membersOptions } from "@/lib/api/queries";
import type {
  AnimalDetailResponse,
  UserResponse,
} from "@/lib/backend/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { mediaHref } from "./labels";
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
  const upload = useMutation(animalMutations.uploadImage());
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || upload.isPending) return;
    upload.mutate(
      {
        id: data.animal.id,
        file,
        altText: data.animal.name,
        position: data.images.length,
      },
      {
        onSuccess: () => {
          setFile(null);
          setInputKey((key) => key + 1);
        },
      },
    );
  }
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
                src={mediaHref(image.storageKey)}
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
      <form onSubmit={handleUpload} className="flex flex-col gap-2">
        <label
          htmlFor="animal-image-upload"
          className="flex flex-col gap-1 font-medium"
        >
          Adicionar foto
          <input
            key={inputKey}
            id="animal-image-upload"
            type="file"
            required
            accept={IMAGE_TYPES.join(",")}
            aria-describedby="animal-image-upload-hint"
            className="text-sm"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <span
            id="animal-image-upload-hint"
            className="text-sm text-neutral-600"
          >
            JPEG, PNG ou WebP de até 10 MB. A foto fica em análise antes de
            aparecer na galeria pública.
          </span>
        </label>
        <FormError id="image-upload-error">{upload.error?.message}</FormError>
        {upload.isSuccess ? (
          <p role="status">Foto enviada para análise.</p>
        ) : null}
        <Button type="submit" variant="outline" loading={upload.isPending}>
          Enviar foto
        </Button>
      </form>
    </section>
  );
}
