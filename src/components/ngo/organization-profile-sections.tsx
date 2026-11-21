"use client";
import { MediaUploadField } from "@/components/media/media-upload-field";
import { VerificationLossDialog } from "@/components/ngo/verification-loss-dialog";
import {
  Button,
  Checkbox,
  FormError,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  accountErrorMessage,
  accountMutations,
  isSameValue,
  normalizeOrganizationPrivateProfile,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPES,
  PROFILE_LIMITS,
  SLUG_PATTERN,
  splitLines,
  toOrganizationPrivateProfileInput,
  toOrganizationPublicProfileInput,
  validateOrganizationPrivateProfile,
  validateOrganizationPublicProfile,
  type OrganizationPrivateProfileInput,
  type OrganizationPublicProfileInput,
} from "@/lib/api/account";
import type { OrganizationResponse } from "@/lib/backend/contracts";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

type Section = "public" | "private";
const SECTION_TITLES: Record<Section, string> = {
  public: "Perfil público da ONG",
  private: "Representante e documentos",
};

type PublicDraft = {
  slug: string;
  type: string;
  logoUrl: string;
  gallery: string[];
  capacity: string;
  serviceAreas: string;
  adoptionPolicy: string;
};

const toPublicDraft = (
  slug: string,
  profile: OrganizationPublicProfileInput,
): PublicDraft => ({
  slug,
  type: profile.type ?? "",
  logoUrl: profile.logoUrl,
  gallery: profile.gallery,
  capacity: profile.capacity === undefined ? "" : String(profile.capacity),
  serviceAreas: profile.serviceAreas.join("\n"),
  adoptionPolicy: profile.adoptionPolicy,
});

function fromPublicDraft(draft: PublicDraft): OrganizationPublicProfileInput {
  const capacity = draft.capacity.trim();
  return {
    type: ORGANIZATION_TYPES.find((type) => type === draft.type),
    logoUrl: draft.logoUrl,
    gallery: draft.gallery,
    capacity: capacity ? Number(capacity) : undefined,
    serviceAreas: splitLines(draft.serviceAreas),
    adoptionPolicy: draft.adoptionPolicy.trim(),
  };
}

type OrganizationProfileSectionsProps = {
  organization: OrganizationResponse;
};

/**
 * Edits the slug, public profile and member-only private profile. Go returns a
 * non-suspended organization to review whenever the private profile is saved.
 */
export function OrganizationProfileSections({
  organization,
}: OrganizationProfileSectionsProps) {
  const router = useRouter();
  const update = useMutation(accountMutations.updateOrganizationProfile());
  const [saved, setSaved] = useState(() => ({
    slug: organization.slug,
    profile: toOrganizationPublicProfileInput(organization.profile),
    privateProfile: normalizeOrganizationPrivateProfile(
      toOrganizationPrivateProfileInput(organization.privateProfile),
    ),
    verificationStatus: organization.verificationStatus,
  }));
  const [publicDraft, setPublicDraft] = useState(() =>
    toPublicDraft(saved.slug, saved.profile),
  );
  const [privateDraft, setPrivateDraft] =
    useState<OrganizationPrivateProfileInput>(() => saved.privateProfile);
  const [section, setSection] = useState<Section | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isConfirmingLoss, setIsConfirmingLoss] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function persist(changes: {
    slug?: string;
    profile?: OrganizationPublicProfileInput;
    privateProfile?: OrganizationPrivateProfileInput;
  }) {
    try {
      const result = await update.mutateAsync({
        id: organization.id,
        changes,
      });
      const next = {
        slug: result.slug,
        profile: toOrganizationPublicProfileInput(result.profile),
        privateProfile: normalizeOrganizationPrivateProfile(
          toOrganizationPrivateProfileInput(result.privateProfile),
        ),
        verificationStatus: result.verificationStatus,
      };
      setSaved(next);
      setPublicDraft(toPublicDraft(next.slug, next.profile));
      setPrivateDraft(next.privateProfile);
      setIsConfirmingLoss(false);
      setIsSaved(true);
      router.refresh();
    } catch (failure: unknown) {
      setIsConfirmingLoss(false);
      setError(accountErrorMessage(failure, "organization"));
    }
  }

  function savePublic() {
    const slug = publicDraft.slug.trim();
    if (!SLUG_PATTERN.test(slug) || slug.length > PROFILE_LIMITS.slug) {
      setError(
        "O endereço deve ter apenas letras minúsculas, números e hífens entre palavras.",
      );
      return;
    }
    if (
      publicDraft.capacity.trim() &&
      !/^\d+$/.test(publicDraft.capacity.trim())
    ) {
      setError("Informe a capacidade como um número inteiro.");
      return;
    }
    const profile = fromPublicDraft(publicDraft);
    const invalid = validateOrganizationPublicProfile(profile);
    if (invalid) {
      setError(invalid);
      return;
    }
    const changes = {
      slug: slug !== saved.slug ? slug : undefined,
      profile: isSameValue(profile, saved.profile) ? undefined : profile,
    };
    if (!changes.slug && !changes.profile) {
      setIsSaved(true);
      return;
    }
    void persist(changes);
  }

  function savePrivate(isConfirmed: boolean) {
    const privateProfile = normalizeOrganizationPrivateProfile(privateDraft);
    const invalid = validateOrganizationPrivateProfile(privateProfile);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (isSameValue(privateProfile, saved.privateProfile)) {
      setIsSaved(true);
      return;
    }
    if (!isConfirmed && saved.verificationStatus === "verified") {
      setIsConfirmingLoss(true);
      return;
    }
    void persist({ privateProfile });
  }

  function handleSave() {
    if (update.isPending || !section) return;
    setError(null);
    setIsSaved(false);
    if (isUploading) {
      setError("Aguarde o envio dos arquivos terminar.");
      return;
    }
    if (section === "public") savePublic();
    else savePrivate(false);
  }

  const fields: Record<Section, ReactNode> = {
    public: (
      <>
        <Input
          id="ngo-slug"
          label="Endereço da ONG (apelido)"
          hint="Letras minúsculas, números e hífens. Ex.: amigos-dos-bichos."
          maxLength={PROFILE_LIMITS.slug}
          autoCapitalize="none"
          value={publicDraft.slug}
          onChange={(event) =>
            setPublicDraft({ ...publicDraft, slug: event.target.value })
          }
        />
        <Select
          id="ngo-type"
          label="Tipo de organização"
          value={publicDraft.type}
          options={[
            { value: "", label: "Não informado" },
            ...ORGANIZATION_TYPES.map((type) => ({
              value: type,
              label: ORGANIZATION_TYPE_LABELS[type],
            })),
          ]}
          onChange={(event) =>
            setPublicDraft({ ...publicDraft, type: event.target.value })
          }
        />
        <MediaUploadField
          id="ngo-logo"
          label="Logotipo"
          purpose="avatar"
          hint="JPEG, PNG ou WebP, até 10 MB."
          value={publicDraft.logoUrl ? [publicDraft.logoUrl] : []}
          onChange={(urls) =>
            setPublicDraft({ ...publicDraft, logoUrl: urls[0] ?? "" })
          }
          onBusyChange={setIsUploading}
        />
        <MediaUploadField
          id="ngo-gallery"
          label="Galeria de fotos"
          purpose="post"
          multiple
          maxFiles={PROFILE_LIMITS.gallery}
          hint={`Até ${PROFILE_LIMITS.gallery} fotos do espaço e da equipe.`}
          value={publicDraft.gallery}
          onChange={(urls) => setPublicDraft({ ...publicDraft, gallery: urls })}
          onBusyChange={setIsUploading}
        />
        <Input
          id="ngo-capacity"
          label="Capacidade de acolhimento (animais)"
          type="number"
          inputMode="numeric"
          min={0}
          max={PROFILE_LIMITS.capacity}
          step={1}
          value={publicDraft.capacity}
          onChange={(event) =>
            setPublicDraft({ ...publicDraft, capacity: event.target.value })
          }
        />
        <Textarea
          id="ngo-service-areas"
          label="Áreas de atuação"
          hint={`Uma cidade ou região por linha, até ${PROFILE_LIMITS.serviceAreas}.`}
          value={publicDraft.serviceAreas}
          onChange={(event) =>
            setPublicDraft({ ...publicDraft, serviceAreas: event.target.value })
          }
        />
        <Textarea
          id="ngo-adoption-policy"
          label="Política de adoção"
          maxLength={PROFILE_LIMITS.adoptionPolicy}
          value={publicDraft.adoptionPolicy}
          onChange={(event) =>
            setPublicDraft({
              ...publicDraft,
              adoptionPolicy: event.target.value,
            })
          }
        />
      </>
    ),
    private: (
      <>
        <p className="text-xs text-neutral-600">
          Visível apenas para quem administra a ONG e para a equipe Petfinder.
          Salvar alterações aqui envia a ONG para nova análise de verificação.
        </p>
        <Input
          id="ngo-representative-name"
          label="Nome do representante legal"
          maxLength={PROFILE_LIMITS.representativeName}
          value={privateDraft.representativeName}
          onChange={(event) =>
            setPrivateDraft({
              ...privateDraft,
              representativeName: event.target.value,
            })
          }
        />
        <Input
          id="ngo-representative-cpf"
          label="CPF do representante"
          inputMode="numeric"
          autoComplete="off"
          hint="Somente números, 11 dígitos."
          maxLength={14}
          value={privateDraft.representativeCpf}
          onChange={(event) =>
            setPrivateDraft({
              ...privateDraft,
              representativeCpf: event.target.value,
            })
          }
        />
        <Input
          id="ngo-representative-email"
          label="E-mail do representante"
          type="email"
          value={privateDraft.representativeEmail}
          onChange={(event) =>
            setPrivateDraft({
              ...privateDraft,
              representativeEmail: event.target.value,
            })
          }
        />
        <Input
          id="ngo-representative-phone"
          label="Telefone do representante"
          type="tel"
          maxLength={PROFILE_LIMITS.representativePhone}
          value={privateDraft.representativePhone}
          onChange={(event) =>
            setPrivateDraft({
              ...privateDraft,
              representativePhone: event.target.value,
            })
          }
        />
        <MediaUploadField
          id="ngo-private-documents"
          label="Documentos da ONG"
          purpose="document"
          multiple
          maxFiles={PROFILE_LIMITS.organizationDocuments}
          hint="Estatuto, CNPJ, comprovantes. PDF, JPEG, PNG ou WebP, até 10 MB cada."
          value={privateDraft.documents}
          onChange={(urls) =>
            setPrivateDraft({ ...privateDraft, documents: urls })
          }
          onBusyChange={setIsUploading}
        />
        <Checkbox
          id="ngo-consent-public-contact"
          label="Autorizo exibir os canais oficiais de contato da ONG publicamente"
          checked={privateDraft.consentPublicContact}
          onChange={(event) =>
            setPrivateDraft({
              ...privateDraft,
              consentPublicContact: event.target.checked,
            })
          }
        />
        <Checkbox
          id="ngo-consent-document-review"
          label="Autorizo a equipe Petfinder a analisar os documentos enviados"
          checked={privateDraft.consentDocumentReview}
          onChange={(event) =>
            setPrivateDraft({
              ...privateDraft,
              consentDocumentReview: event.target.checked,
            })
          }
        />
      </>
    ),
  };

  return (
    <section
      aria-labelledby="ngo-profile-title"
      className="flex flex-col gap-3"
    >
      <h2 id="ngo-profile-title" className="text-lg font-bold">
        Perfil completo
      </h2>
      {(["public", "private"] as const).map((key) => (
        <Button
          key={key}
          variant="outline"
          className="justify-start"
          aria-haspopup="dialog"
          onClick={() => {
            setError(null);
            setIsSaved(false);
            setSection(key);
          }}
        >
          {SECTION_TITLES[key]}
        </Button>
      ))}
      {section ? (
        <BottomSheet
          title={SECTION_TITLES[section]}
          isBusy={update.isPending || isUploading}
          onClose={() => setSection(null)}
          footer={
            <>
              <FormError id="ngo-profile-error">{error}</FormError>
              {isSaved ? <p role="status">Alterações salvas.</p> : null}
              <Button
                onClick={handleSave}
                loading={update.isPending}
                disabled={isUploading}
              >
                Salvar alterações
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">{fields[section]}</div>
        </BottomSheet>
      ) : null}
      {isConfirmingLoss ? (
        <VerificationLossDialog
          change="os dados do representante ou os documentos"
          isBusy={update.isPending}
          onConfirm={() => savePrivate(true)}
          onClose={() => setIsConfirmingLoss(false)}
        />
      ) : null}
    </section>
  );
}
