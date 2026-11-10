"use client";
import { PostMediaCarousel } from "@/components/posts/post-media-carousel";
import { Button, FormError, LinkButton, Textarea } from "@/components/ui";
import { apiMutations } from "@/lib/api/mutations";
import { animalOptions } from "@/lib/api/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ANIMAL_STATUS_LABELS, formatDate } from "./labels";
import { QueryStatus } from "./query-status";

const SEX_LABELS: Record<string, string> = {
  male: "Macho",
  female: "Fêmea",
  unknown: "Não informado",
};
export function AnimalDetail({
  id,
  userId,
  organizationId,
}: {
  id: string;
  userId: string;
  organizationId?: string;
}) {
  const query = useQuery(animalOptions(id));
  const like = useMutation(apiMutations.like());
  const application = useMutation(apiMutations.createApplication());
  const [introduction, setIntroduction] = useState("");
  const router = useRouter();
  function requestAdoption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (application.isPending) return;
    application.mutate(
      { animalId: id, introduction },
      {
        onSuccess: (result) =>
          router.push(`/adopter/adoptions/${result.application.id}`),
      },
    );
  }
  const data = query.data;
  return (
    <>
      <QueryStatus query={query} />
      {data ? (
        <>
          <h2 className="text-xl font-bold">{data.animal.name}</h2>
          <PostMediaCarousel
            post={{
              media: data.images
                .filter((image) => /^https?:\/\//.test(image.storageKey))
                .map((image) => ({ url: image.storageKey, type: "image" })),
            }}
            petName={data.animal.name}
            tone="bg-secondary"
            enablePhotoViewer
          />
          <p>
            {ANIMAL_STATUS_LABELS[data.animal.status] ??
              "Situação não informada"}
          </p>
          <p className="whitespace-pre-line">{data.animal.description}</p>
          <p>
            {data.animal.city} · {data.animal.stateCode}
          </p>
          <dl className="grid grid-cols-2 gap-2">
            <dt>Sexo</dt>
            <dd>{SEX_LABELS[data.animal.sex] ?? "Não informado"}</dd>
            <dt>Nascimento aproximado</dt>
            <dd>{formatDate(data.animal.birthDate)}</dd>
            <dt>Vacinação</dt>
            <dd>
              {data.animal.vaccinated === null
                ? "Não informada"
                : data.animal.vaccinated
                  ? "Vacinado"
                  : "Não vacinado"}
            </dd>
            <dt>Castração</dt>
            <dd>
              {data.animal.neutered === null
                ? "Não informada"
                : data.animal.neutered
                  ? "Castrado"
                  : "Não castrado"}
            </dd>
          </dl>
          {data.animal.healthNotes ? (
            <p>Saúde: {data.animal.healthNotes}</p>
          ) : null}
          {data.animal.behaviorNotes ? (
            <p>Comportamento: {data.animal.behaviorNotes}</p>
          ) : null}
          {data.animal.submittedBy === userId ||
          (organizationId &&
            data.animal.responsibleOrganizationId === organizationId) ? (
            <LinkButton href={`/ngo/pets/${id}/edit`} variant="outline">
              Editar animal
            </LinkButton>
          ) : null}
          <Button
            variant="outline"
            loading={like.isPending}
            onClick={() => like.mutate({ type: "pet", id, onlyLike: true })}
          >
            Adicionar aos favoritos
          </Button>
          <FormError id="animal-like-error" collapsible>
            {like.error?.message}
          </FormError>
          {data.animal.status === "available" &&
          data.animal.submittedBy !== userId ? (
            <form onSubmit={requestAdoption} className="flex flex-col gap-3">
              <p>
                Adicione o animal aos favoritos antes de enviar seu pedido. A
                conversa será mediada pela ONG.
              </p>
              <Textarea
                id="adoption-introduction"
                label="Apresente-se à ONG"
                required
                minLength={20}
                maxLength={3000}
                value={introduction}
                onChange={(event) => setIntroduction(event.target.value)}
              />
              <FormError id="application-create-error">
                {application.error?.message}
              </FormError>
              <Button type="submit" loading={application.isPending}>
                Solicitar adoção
              </Button>
            </form>
          ) : null}
        </>
      ) : null}
    </>
  );
}
