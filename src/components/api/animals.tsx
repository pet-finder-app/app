"use client";

import { PawIcon } from "@/components/brand/paw-icon";
import {
  Button,
  Card,
  Input,
  LinkButton,
  Select,
  Textarea,
} from "@/components/ui";
import { api, result, type Schema } from "@/lib/api/client";
import {
  keys,
  useAnimal,
  useAnimals,
  useApiMutation,
  useMe,
  useOrganizationId,
  type AnimalFilters,
} from "@/lib/api/queries";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AppFrame,
  ErrorMessage,
  field,
  LocationFields,
  locationFrom,
  Pagination,
  QueryState,
  statusLabel,
} from "./common";
import { ReportForm } from "./reports";

const speciesOptions = [
  { value: "dog", label: "Cachorro" },
  { value: "cat", label: "Gato" },
  { value: "other", label: "Outro" },
];
const sizeOptions = [
  { value: "small", label: "Pequeno" },
  { value: "medium", label: "Médio" },
  { value: "large", label: "Grande" },
  { value: "extra_large", label: "Muito grande" },
];
const sexOptions = [
  { value: "female", label: "Fêmea" },
  { value: "male", label: "Macho" },
  { value: "unknown", label: "Não informado" },
];

export function AnimalListScreen({
  preference,
  organization = false,
}: {
  preference?: "liked" | "not_interested";
  organization?: boolean;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AnimalFilters>({});
  const [orgId] = useOrganizationId();
  const query = useAnimals(page, filters, preference);
  const [locationError, setLocationError] = useState<Error | null>(null);
  const items = query.data?.items ?? [];
  const visible = organization
    ? items.filter((a) => a.responsible_organization_id === orgId)
    : items;
  return (
    <AppFrame
      title={
        organization
          ? "Pets da ONG"
          : preference === "liked"
            ? "Favoritos"
            : preference
              ? "Descartados"
              : "Descobrir pets"
      }
      organization={organization}
    >
      {organization ? (
        <Card>
          <p>
            Esta lista mostra os pets disponíveis da organização na página atual
            da descoberta. O serviço ainda não oferece uma listagem completa de
            pets por ONG.
          </p>
          <LinkButton href="/ngo/pets/new">Cadastrar pet</LinkButton>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const id = field(new FormData(e.currentTarget), "animal-id");
              router.push(`/ngo/pets/${encodeURIComponent(id)}/edit`);
            }}
          >
            <Input
              id="animal-id"
              label="Abrir pet pelo ID"
              required
              pattern="[0-9a-fA-F-]{36}"
            />
            <Button type="submit" variant="outline">
              Abrir cadastro
            </Button>
          </form>
        </Card>
      ) : !preference ? (
        <Card>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setPage(1);
              setFilters({
                species:
                  (field(form, "species") as AnimalFilters["species"]) ||
                  undefined,
                size:
                  (field(form, "size") as AnimalFilters["size"]) || undefined,
                city: field(form, "city") || undefined,
                state: field(form, "state") || undefined,
              });
            }}
          >
            <Select
              id="species"
              label="Espécie"
              options={[{ value: "", label: "Todas" }, ...speciesOptions]}
            />
            <Select
              id="size"
              label="Porte"
              options={[{ value: "", label: "Todos" }, ...sizeOptions]}
            />
            <Input id="city" label="Cidade" />
            <Input id="state" label="Estado / UF" />
            <Button type="submit">Filtrar</Button>
          </form>
          <Button
            variant="outline"
            onClick={() => {
              if (!navigator.geolocation) {
                setLocationError(
                  new Error("Localização não disponível neste navegador."),
                );
                return;
              }
              navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                  setFilters((old) => ({
                    ...old,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                  }));
                  setPage(1);
                  setLocationError(null);
                },
                () =>
                  setLocationError(
                    new Error("Não foi possível obter sua localização."),
                  ),
              );
            }}
          >
            Ordenar pela minha localização
          </Button>
          <ErrorMessage error={locationError} />
          <LinkButton href="/adopter/discarded" variant="pill">
            Ver descartados
          </LinkButton>
        </Card>
      ) : null}
      <QueryState query={query} />
      {query.isSuccess && (
        <>
          {visible.length === 0 && (
            <Card>
              <p>Nenhum pet nesta página.</p>
            </Card>
          )}
          {visible.map((animal) => (
            <Card key={animal.id}>
              {animal.id && (
                <AnimalThumbnail id={animal.id} name={animal.name} />
              )}
              <div className="flex items-center gap-3">
                <PawIcon className="size-10 text-lime-800" />
                <div>
                  <h2 className="text-lg font-bold">{animal.name}</h2>
                  <p className="text-sm">
                    {animal.city} / {animal.state_code} ·{" "}
                    {statusLabel(animal.status)}
                  </p>
                </div>
              </div>
              <p className="line-clamp-3 text-sm">{animal.description}</p>
              <LinkButton
                href={
                  organization
                    ? `/ngo/pets/${animal.id}/edit`
                    : `/pets/${animal.id}`
                }
                variant="outline"
              >
                {organization ? "Editar" : "Ver detalhes"}
              </LinkButton>
            </Card>
          ))}
          <Pagination page={page} count={items.length} onPage={setPage} />
        </>
      )}
    </AppFrame>
  );
}

function AnimalThumbnail({ id, name }: { id: string; name: string }) {
  const query = useAnimal(id);
  const photo = query.data?.images?.find((image) =>
    /^https?:\/\//.test(image.storage_key),
  );
  return photo ? (
    <Image
      src={photo.storage_key}
      alt={photo.alt_text || name}
      width={600}
      height={400}
      unoptimized
      className="aspect-[3/2] w-full rounded-2xl object-cover"
    />
  ) : null;
}

function PreferenceActions({ id }: { id: string }) {
  const mutation = useApiMutation(
    (value: Schema["PreferenceRequest"]["value"]) =>
      result(
        api.PUT("/v1/animals/{animalId}/preference", {
          params: { path: { animalId: id } },
          body: { value },
        }),
      ),
    [keys.animals, keys.preferences],
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("liked")}
        >
          Favoritar
        </Button>
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("not_interested")}
        >
          Descartar
        </Button>
      </div>
      <ErrorMessage error={mutation.error} />
      {mutation.isSuccess && (
        <p role="status">
          Preferência salva:{" "}
          {mutation.variables === "liked" ? "favorito" : "descartado"}.
        </p>
      )}
    </div>
  );
}

function ApplicationStart({ animalId }: { animalId: string }) {
  const router = useRouter();
  const mutation = useApiMutation(
    (introduction: string) =>
      result(
        api.POST("/v1/applications", {
          body: { animal_id: animalId, introduction },
        }),
      ),
    [keys.applications, keys.conversations],
  );
  return (
    <Card>
      <h2 className="font-bold">Quero adotar</h2>
      <p className="text-sm">
        Favorite o pet antes de enviar sua candidatura. A ONG receberá sua
        apresentação e uma conversa será aberta.
      </p>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(
            field(new FormData(e.currentTarget), "introduction"),
            {
              onSuccess: (data) =>
                router.push(`/adopter/adoptions/${data.application.id}`),
            },
          );
        }}
      >
        <Textarea
          id="introduction"
          label="Apresente-se à ONG"
          minLength={20}
          maxLength={3000}
          required
        />
        <ErrorMessage error={mutation.error} />
        <Button type="submit" loading={mutation.isPending}>
          Enviar candidatura
        </Button>
      </form>
    </Card>
  );
}

export function AnimalDetailScreen({ id }: { id: string }) {
  const query = useAnimal(id);
  const me = useMe();
  const animal = query.data?.animal;
  return (
    <AppFrame title={animal?.name ?? "Pet"}>
      <QueryState query={query} />
      {animal && (
        <>
          <Card>
            <h2 className="text-xl font-bold">{animal.name}</h2>
            <p>
              {statusLabel(animal.status)} · {animal.city} / {animal.state_code}
            </p>
            {query.data?.images?.map((image) =>
              /^https?:\/\//.test(image.storage_key) ? (
                <Image
                  key={image.id}
                  src={image.storage_key}
                  unoptimized
                  width={800}
                  height={600}
                  alt={image.alt_text || animal.name}
                  className="w-full rounded-2xl object-cover"
                />
              ) : (
                <p key={image.id}>Imagem indisponível.</p>
              ),
            )}
            <p className="whitespace-pre-wrap">{animal.description}</p>
            <p>
              {speciesOptions.find((o) => o.value === animal.species)?.label} ·{" "}
              {sizeOptions.find((o) => o.value === animal.size)?.label} ·{" "}
              {sexOptions.find((o) => o.value === animal.sex)?.label}
            </p>
            {animal.breed && <p>Raça: {animal.breed}</p>}
            {animal.health_notes && <p>Saúde: {animal.health_notes}</p>}
            {animal.behavior_notes && (
              <p>Comportamento: {animal.behavior_notes}</p>
            )}
            <PreferenceActions id={id} />
          </Card>
          {animal.status === "available" &&
            animal.submitted_by !== me.data?.id && (
              <ApplicationStart animalId={id} />
            )}
          <ReportForm subjectType="animal" subjectId={id} />
        </>
      )}
    </AppFrame>
  );
}

export function AnimalEditorScreen({
  id,
  privateSubmission = false,
}: {
  id?: string;
  privateSubmission?: boolean;
}) {
  const query = useAnimal(id ?? "");
  const [orgId] = useOrganizationId();
  return (
    <AppFrame
      title={
        id
          ? "Editar pet"
          : privateSubmission
            ? "Oferecer pet para acolhimento"
            : "Cadastrar pet"
      }
      organization={!privateSubmission}
    >
      {id ? (
        <>
          <QueryState query={query} />
          {query.data && (
            <AnimalEditor
              key={id}
              animal={query.data.animal}
              privateSubmission={privateSubmission}
            />
          )}
          {query.data && (
            <GalleryEditor id={id} images={query.data.images ?? []} />
          )}
          {query.data && !privateSubmission && (
            <AnimalStatusForm key={id} id={id} />
          )}
        </>
      ) : orgId || privateSubmission ? (
        <AnimalEditor
          organizationId={privateSubmission ? undefined : orgId}
          privateSubmission={privateSubmission}
        />
      ) : (
        <Card>
          <p>Selecione uma organização para publicar um pet.</p>
        </Card>
      )}
    </AppFrame>
  );
}

function AnimalEditor({
  animal,
  organizationId,
  privateSubmission,
}: {
  animal?: Schema["Animal"];
  organizationId?: string;
  privateSubmission?: boolean;
}) {
  const router = useRouter();
  const mutation = useApiMutation(
    (body: Schema["AnimalRequest"]) =>
      animal?.id
        ? result(
            api.PATCH("/v1/animals/{animalId}", {
              params: { path: { animalId: animal.id } },
              body: { ...body, organization_id: undefined },
            }),
          )
        : result(api.POST("/v1/animals", { body })),
    [keys.animals],
  );
  return (
    <Card>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          mutation.mutate(
            {
              name: field(form, "name"),
              species: field(
                form,
                "species",
              ) as Schema["AnimalRequest"]["species"],
              size: field(form, "size") as Schema["AnimalRequest"]["size"],
              sex: field(form, "sex") as Schema["AnimalRequest"]["sex"],
              breed: field(form, "breed") || undefined,
              approximate_birth_date: field(form, "birth_date") || undefined,
              description: field(form, "description"),
              health_notes: field(form, "health_notes"),
              behavior_notes: field(form, "behavior_notes"),
              location: locationFrom(form),
              ...(!animal && organizationId
                ? { organization_id: organizationId }
                : {}),
            },
            {
              onSuccess: (data) => {
                if (!animal)
                  router.push(
                    `/${privateSubmission ? "adopter" : "ngo"}/pets/${data.id}/edit`,
                  );
              },
            },
          );
        }}
      >
        <Input
          id="name"
          label="Nome do pet"
          defaultValue={animal?.name}
          minLength={1}
          maxLength={100}
          required
        />
        <Select
          id="species"
          label="Espécie"
          options={speciesOptions}
          defaultValue={animal?.species}
        />
        <Select
          id="size"
          label="Porte"
          options={sizeOptions}
          defaultValue={animal?.size}
        />
        <Select
          id="sex"
          label="Sexo"
          options={sexOptions}
          defaultValue={animal?.sex}
        />
        <Input
          id="breed"
          label="Raça"
          defaultValue={animal?.breed ?? ""}
          maxLength={100}
        />
        <Input
          id="birth_date"
          label="Data aproximada de nascimento"
          type="date"
          defaultValue={animal?.birth_date ?? ""}
        />
        <Textarea
          id="description"
          label="Sobre o pet"
          minLength={20}
          maxLength={5000}
          defaultValue={animal?.description}
          required
        />
        <Textarea
          id="health_notes"
          label="Informações de saúde"
          maxLength={3000}
          defaultValue={animal?.health_notes}
        />
        <Textarea
          id="behavior_notes"
          label="Comportamento"
          maxLength={3000}
          defaultValue={animal?.behavior_notes}
        />
        <LocationFields
          location={
            animal
              ? {
                  city: animal.city,
                  state: animal.state_code,
                  country_code: animal.country_code,
                }
              : null
          }
        />
        <ErrorMessage error={mutation.error} />
        {mutation.isSuccess && <p role="status">Dados salvos.</p>}
        <Button type="submit" loading={mutation.isPending}>
          Salvar pet
        </Button>
      </form>
    </Card>
  );
}

function GalleryEditor({
  id,
  images,
}: {
  id: string;
  images: Schema["AnimalImage"][];
}) {
  const add = useApiMutation(
    (body: Schema["AnimalImageRequest"]) =>
      result(
        api.POST("/v1/animals/{animalId}/images", {
          params: { path: { animalId: id } },
          body,
        }),
      ),
    [keys.animals],
  );
  const remove = useApiMutation(
    (imageId: string) =>
      result(
        api.DELETE("/v1/animals/{animalId}/images/{imageId}", {
          params: { path: { animalId: id, imageId } },
        }),
      ),
    [keys.animals],
  );
  return (
    <Card>
      <h2 className="font-bold">Fotos</h2>
      <p className="text-sm">
        Adicione uma URL pública de imagem. As fotos passam pela moderação antes
        de aparecer para todos.
      </p>
      {images.map((image) => (
        <div key={image.id} className="flex flex-col gap-2">
          <p className="text-sm break-all">
            {image.alt_text || image.storage_key} · {image.moderation_status}
          </p>
          <Button
            variant="danger"
            size="sm"
            disabled={remove.isPending}
            onClick={() => {
              if (image.id) remove.mutate(image.id);
            }}
          >
            Remover foto
          </Button>
        </div>
      ))}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          add.mutate({
            url: field(form, "url"),
            alt_text: field(form, "alt_text"),
            position: images.length,
          });
        }}
      >
        <Input
          id="url"
          label="URL da foto"
          type="url"
          pattern="https?://.+"
          required
        />
        <Input id="alt_text" label="Descrição da foto" maxLength={300} />
        <Button type="submit" loading={add.isPending}>
          Adicionar foto
        </Button>
      </form>
      <ErrorMessage error={add.error || remove.error} />
      {add.isSuccess && <p role="status">Foto enviada para moderação.</p>}
    </Card>
  );
}

function AnimalStatusForm({ id }: { id: string }) {
  const mutation = useApiMutation(
    (body: Schema["AnimalStatusRequest"]) =>
      result(
        api.PATCH("/v1/animals/{animalId}/status", {
          params: { path: { animalId: id } },
          body,
        }),
      ),
    [keys.animals],
  );
  return (
    <Card>
      <h2 className="font-bold">Disponibilidade</h2>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          mutation.mutate({
            status: field(
              form,
              "status",
            ) as Schema["AnimalStatusRequest"]["status"],
            reason: field(form, "reason"),
          });
        }}
      >
        <Select
          id="status"
          label="Situação"
          options={[
            "pending_organization",
            "available",
            "adoption_in_progress",
            "unavailable",
            "under_review",
          ].map((value) => ({ value, label: statusLabel(value) }))}
        />
        <Textarea
          id="reason"
          label="Motivo"
          minLength={5}
          maxLength={1000}
          required
        />
        <ErrorMessage error={mutation.error} />
        {mutation.isSuccess && <p role="status">Situação atualizada.</p>}
        <Button type="submit" loading={mutation.isPending}>
          Atualizar situação
        </Button>
      </form>
      <p className="text-xs">
        O pet é marcado como adotado após as duas confirmações de entrega.
      </p>
    </Card>
  );
}
