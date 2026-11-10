"use client";
import { LogoutButton } from "@/components/account/logout-button";
import { Button, FormError, Input, LinkButton } from "@/components/ui";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { apiMutations } from "@/lib/api/mutations";
import type {
  OrganizationResponse,
  UserResponse,
} from "@/lib/backend/contracts";
import { useMutation } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useState } from "react";

export function ProfileForm({
  user,
  organization,
}: {
  user: UserResponse;
  organization: OrganizationResponse | null;
}) {
  const [draft, setDraft] = useState({
    name: user.name,
    phone: user.phone ?? "",
    city: user.location?.city ?? "",
    state: user.location?.state ?? "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const update = useMutation(apiMutations.updateProfile());
  async function save() {
    if (update.isPending) return;
    setError(null);
    setIsSaved(false);
    if (
      !draft.name.trim() ||
      Boolean(draft.city.trim()) !== Boolean(draft.state.trim())
    ) {
      setError("Informe seu nome e preencha cidade e estado juntos.");
      return;
    }
    try {
      const result = await update.mutateAsync({
        name: draft.name,
        phone: draft.phone,
        ...(draft.city.trim()
          ? {
              location: {
                city: draft.city,
                state: draft.state,
                countryCode: user.location?.countryCode ?? "BR",
              },
            }
          : {}),
      });
      setDraft({
        name: result.name,
        phone: result.phone ?? "",
        city: result.location?.city ?? "",
        state: result.location?.state ?? "",
      });
      setIsSaved(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o perfil.",
      );
    }
  }
  return (
    <>
      <header className="flex items-center gap-3">
        <UserRound
          className="size-12 rounded-full bg-secondary p-2 text-accent-tertiary"
          aria-hidden="true"
        />
        <div>
          <h2 className="text-xl font-bold">{draft.name}</h2>
          <p>{user.email}</p>
        </div>
      </header>
      <Button
        variant="outline"
        className="justify-start"
        aria-haspopup="dialog"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
      >
        Identificação e localização
      </Button>
      {isOpen ? (
        <BottomSheet
          title="Identificação e localização"
          isBusy={update.isPending}
          onClose={() => setIsOpen(false)}
          footer={
            <>
              <FormError id="profile-error">{error}</FormError>
              {isSaved ? <p role="status">Alterações salvas.</p> : null}
              <Button onClick={() => void save()} loading={update.isPending}>
                Salvar alterações
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Input
              id="profile-name"
              label="Nome completo"
              value={draft.name}
              minLength={2}
              maxLength={120}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
            <Input
              id="profile-phone"
              label="Telefone"
              value={draft.phone}
              maxLength={30}
              onChange={(event) =>
                setDraft({ ...draft, phone: event.target.value })
              }
            />
            <Input
              id="profile-city"
              label="Cidade"
              value={draft.city}
              maxLength={100}
              onChange={(event) =>
                setDraft({ ...draft, city: event.target.value })
              }
            />
            <Input
              id="profile-state"
              label="Estado"
              value={draft.state}
              maxLength={8}
              onChange={(event) =>
                setDraft({ ...draft, state: event.target.value })
              }
            />
          </div>
        </BottomSheet>
      ) : null}
      {organization ? (
        <LinkButton href="/ngo/dashboard">
          Administrar {organization.name}
        </LinkButton>
      ) : null}
      <LinkButton href="/ngo/organizations" variant="outline">
        Minhas organizações
      </LinkButton>
      <LinkButton href="/ngo/register" variant="outline">
        Cadastrar uma ONG
      </LinkButton>
      <LinkButton href="/adopter/animals/new" variant="outline">
        Encaminhar animal para uma ONG
      </LinkButton>
      <LinkButton href="/adopter/adoptions" variant="outline">
        Meus pedidos de adoção
      </LinkButton>
      <LogoutButton confirm variant="danger-ghost" />
      <a href="/terms" className="text-sm underline">
        Termos de uso e política de privacidade
      </a>
    </>
  );
}
