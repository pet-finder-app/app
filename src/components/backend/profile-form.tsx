"use client";
import {
  isPersonalVerificationAtRisk,
  PersonalVerificationLossDialog,
} from "@/components/account/personal-verification-loss-dialog";
import { MediaUploadField } from "@/components/media/media-upload-field";
import {
  Button,
  Checkbox,
  FormError,
  Input,
  MenuButton,
  MenuList,
  Textarea,
} from "@/components/ui";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  accountErrorMessage,
  accountMutations,
  isSameValue,
  normalizePersonalProfile,
  PROFILE_LIMITS,
  splitLines,
  toPersonalProfileInput,
  validatePersonalProfile,
  type PersonalProfileInput,
} from "@/lib/api/account";
import { apiMutations } from "@/lib/api/mutations";
import type { UserResponse } from "@/lib/backend/contracts";
import { useMutation } from "@tanstack/react-query";
import {
  Camera,
  Check,
  FileText,
  House,
  IdCard,
  MapPin,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { mediaHref, PERSONAL_VERIFICATION_LABELS } from "./labels";
import { VerificationPanel } from "./verification-panel";
import { VerifiedBadge } from "./verified-badge";

type ProfileSection =
  "photo" | "personal" | "address" | "adoption" | "documents";
const SECTION_TITLES: Record<ProfileSection, string> = {
  photo: "Foto de perfil",
  personal: "Dados pessoais",
  address: "Endereço",
  adoption: "Moradia e preferências",
  documents: "Documentos pessoais",
};
const SECTION_ICONS: Record<ProfileSection, LucideIcon> = {
  photo: Camera,
  personal: UserRound,
  address: MapPin,
  adoption: House,
  documents: FileText,
};
const SECTIONS = Object.keys(SECTION_TITLES).filter(
  (key): key is ProfileSection => key in SECTION_TITLES,
);

/** Multi-line list fields are edited as text and split on save. */
type ProfileDraft = Omit<
  PersonalProfileInput,
  "socialLinks" | "preferences"
> & {
  socialLinks: string;
  preferences: string;
};
const toDraft = (profile: PersonalProfileInput): ProfileDraft => ({
  ...profile,
  socialLinks: profile.socialLinks.join("\n"),
  preferences: profile.preferences.join("\n"),
});
const fromDraft = (draft: ProfileDraft): PersonalProfileInput =>
  normalizePersonalProfile({
    ...draft,
    socialLinks: splitLines(draft.socialLinks),
    preferences: splitLines(draft.preferences),
  });

export function ProfileForm({ user }: { user: UserResponse }) {
  const router = useRouter();
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
  const updateProfile = useMutation(accountMutations.updatePersonalProfile());
  const [savedProfile, setSavedProfile] = useState(() =>
    normalizePersonalProfile(toPersonalProfileInput(user.profile)),
  );
  const [profileDraft, setProfileDraft] = useState(() => toDraft(savedProfile));
  const [verificationStatus, setVerificationStatus] = useState(
    user.verificationStatus,
  );
  // Adopt Go's status when a server refresh delivers a newer one.
  const [serverStatus, setServerStatus] = useState(user.verificationStatus);
  if (user.verificationStatus !== serverStatus) {
    setServerStatus(user.verificationStatus);
    setVerificationStatus(user.verificationStatus);
  }
  const [section, setSection] = useState<ProfileSection | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isConfirmingLoss, setIsConfirmingLoss] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

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

  function requestProfileSave() {
    if (updateProfile.isPending) return;
    setProfileError(null);
    setIsProfileSaved(false);
    if (isUploading) {
      setProfileError("Aguarde o envio dos arquivos terminar.");
      return;
    }
    const profile = fromDraft(profileDraft);
    const invalid = validatePersonalProfile(profile);
    if (invalid) {
      setProfileError(invalid);
      return;
    }
    // Go resets personal verification whenever the profile is sent.
    if (isSameValue(profile, savedProfile)) {
      setIsProfileSaved(true);
      return;
    }
    if (isPersonalVerificationAtRisk(verificationStatus)) {
      setIsConfirmingLoss(true);
      return;
    }
    void saveProfile();
  }

  async function saveProfile() {
    try {
      const result = await updateProfile.mutateAsync({
        profile: fromDraft(profileDraft),
      });
      const next = normalizePersonalProfile(
        toPersonalProfileInput(result.profile),
      );
      setSavedProfile(next);
      setProfileDraft(toDraft(next));
      setVerificationStatus(result.verificationStatus);
      setIsConfirmingLoss(false);
      setIsProfileSaved(true);
      router.refresh();
    } catch (failure: unknown) {
      setIsConfirmingLoss(false);
      setProfileError(accountErrorMessage(failure, "profile"));
    }
  }

  function openSection(next: ProfileSection) {
    setProfileError(null);
    setIsProfileSaved(false);
    setSection(next);
  }

  const setAddress = (
    key: keyof PersonalProfileInput["address"],
    value: string,
  ) =>
    setProfileDraft({
      ...profileDraft,
      address: { ...profileDraft.address, [key]: value },
    });

  const sectionFields: Record<ProfileSection, ReactNode> = {
    photo: (
      <MediaUploadField
        id="profile-avatar"
        label="Foto de perfil"
        purpose="avatar"
        hint="JPEG, PNG ou WebP, até 10 MB."
        value={profileDraft.avatarUrl ? [profileDraft.avatarUrl] : []}
        onChange={(urls) =>
          setProfileDraft({ ...profileDraft, avatarUrl: urls[0] ?? "" })
        }
        onBusyChange={setIsUploading}
      />
    ),
    personal: (
      <>
        <Input
          id="profile-cpf"
          label="CPF"
          inputMode="numeric"
          autoComplete="off"
          hint="Somente números, 11 dígitos."
          maxLength={14}
          value={profileDraft.cpf}
          onChange={(event) =>
            setProfileDraft({ ...profileDraft, cpf: event.target.value })
          }
        />
        <Input
          id="profile-birth-date"
          label="Data de nascimento"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          value={profileDraft.birthDate}
          onChange={(event) =>
            setProfileDraft({ ...profileDraft, birthDate: event.target.value })
          }
        />
        <Input
          id="profile-occupation"
          label="Profissão"
          maxLength={PROFILE_LIMITS.occupation}
          value={profileDraft.occupation}
          onChange={(event) =>
            setProfileDraft({ ...profileDraft, occupation: event.target.value })
          }
        />
        <Textarea
          id="profile-biography"
          label="Sobre você"
          maxLength={PROFILE_LIMITS.biography}
          value={profileDraft.biography}
          onChange={(event) =>
            setProfileDraft({ ...profileDraft, biography: event.target.value })
          }
        />
        <Textarea
          id="profile-social-links"
          label="Redes sociais"
          hint={`Um endereço completo por linha (https://...), até ${PROFILE_LIMITS.socialLinks}.`}
          value={profileDraft.socialLinks}
          onChange={(event) =>
            setProfileDraft({
              ...profileDraft,
              socialLinks: event.target.value,
            })
          }
        />
      </>
    ),
    address: (
      <>
        <Input
          id="profile-postal-code"
          label="CEP"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={PROFILE_LIMITS.postalCode}
          value={profileDraft.address.postalCode}
          onChange={(event) => setAddress("postalCode", event.target.value)}
        />
        <Input
          id="profile-street"
          label="Rua"
          autoComplete="address-line1"
          maxLength={PROFILE_LIMITS.street}
          value={profileDraft.address.street}
          onChange={(event) => setAddress("street", event.target.value)}
        />
        <Input
          id="profile-number"
          label="Número"
          maxLength={PROFILE_LIMITS.number}
          value={profileDraft.address.number}
          onChange={(event) => setAddress("number", event.target.value)}
        />
        <Input
          id="profile-complement"
          label="Complemento"
          autoComplete="address-line2"
          maxLength={PROFILE_LIMITS.complement}
          value={profileDraft.address.complement}
          onChange={(event) => setAddress("complement", event.target.value)}
        />
        <Input
          id="profile-neighborhood"
          label="Bairro"
          maxLength={PROFILE_LIMITS.neighborhood}
          value={profileDraft.address.neighborhood}
          onChange={(event) => setAddress("neighborhood", event.target.value)}
        />
        <p className="text-xs text-neutral-600">
          Cidade e estado ficam em &quot;Identificação e localização&quot;.
        </p>
      </>
    ),
    adoption: (
      <>
        <Textarea
          id="profile-housing"
          label="Moradia"
          hint="Tipo de casa, espaço disponível, quem mora com você."
          maxLength={PROFILE_LIMITS.housing}
          value={profileDraft.housing}
          onChange={(event) =>
            setProfileDraft({ ...profileDraft, housing: event.target.value })
          }
        />
        <Textarea
          id="profile-preferences"
          label="Preferências de adoção"
          hint={`Uma preferência por linha, até ${PROFILE_LIMITS.preferences}. Ex.: cães de porte pequeno.`}
          value={profileDraft.preferences}
          onChange={(event) =>
            setProfileDraft({
              ...profileDraft,
              preferences: event.target.value,
            })
          }
        />
        <Checkbox
          id="profile-allow-contact"
          label="Permitir que ONGs entrem em contato comigo"
          checked={profileDraft.allowOrganizationContact}
          onChange={(event) =>
            setProfileDraft({
              ...profileDraft,
              allowOrganizationContact: event.target.checked,
            })
          }
        />
      </>
    ),
    documents: (
      <MediaUploadField
        id="profile-documents"
        label="Documentos"
        purpose="document"
        multiple
        maxFiles={PROFILE_LIMITS.personalDocuments}
        hint="PDF, JPEG, PNG ou WebP, até 10 MB cada. Ficam privados; para verificar sua identidade use a seção Verificação."
        value={profileDraft.documents}
        onChange={(urls) =>
          setProfileDraft({ ...profileDraft, documents: urls })
        }
        onBusyChange={setIsUploading}
      />
    ),
  };

  return (
    <>
      <header className="flex items-center gap-3">
        {savedProfile.avatarUrl ? (
          <span className="relative size-12 shrink-0 overflow-hidden rounded-full outline-2 outline-accent-tertiary">
            <Image
              src={mediaHref(savedProfile.avatarUrl)}
              alt="Sua foto de perfil"
              fill
              unoptimized
              sizes="48px"
              className="object-cover"
            />
          </span>
        ) : (
          <UserRound
            className="size-12 rounded-full bg-secondary p-2 text-accent-tertiary"
            aria-hidden="true"
          />
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold">
              {draft.name}
              <VerifiedBadge status={verificationStatus} isIconOnly />
            </h2>
            {verificationStatus === "unverified" ||
            verificationStatus === "rejected" ? (
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setIsVerificationOpen(true)}
                className="inline-flex min-h-6 -translate-y-px items-center gap-1 rounded-full border border-dashed border-accent-tertiary px-2 text-xs font-semibold text-accent-tertiary hover:border-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-tertiary"
              >
                <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                Verificar conta
              </button>
            ) : null}
          </div>
          <p>{user.email}</p>
        </div>
      </header>
      <MenuList title="Perfil">
        <MenuButton
          icon={IdCard}
          aria-haspopup="dialog"
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
        >
          Identificação e localização
        </MenuButton>
        {SECTIONS.map((key) => (
          <MenuButton
            key={key}
            icon={SECTION_ICONS[key]}
            aria-haspopup="dialog"
            onClick={() => openSection(key)}
          >
            {SECTION_TITLES[key]}
          </MenuButton>
        ))}
        <MenuButton
          icon={ShieldCheck}
          aria-haspopup="dialog"
          description={
            PERSONAL_VERIFICATION_LABELS[verificationStatus] ??
            "Situação não informada"
          }
          onClick={() => setIsVerificationOpen(true)}
        >
          Verificação
        </MenuButton>
      </MenuList>
      {isVerificationOpen ? (
        <BottomSheet
          title="Verificação"
          onClose={() => setIsVerificationOpen(false)}
        >
          <VerificationPanel
            hasHeading={false}
            onSubmitted={() => router.refresh()}
          />
        </BottomSheet>
      ) : null}
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
      {section ? (
        <BottomSheet
          title={SECTION_TITLES[section]}
          isBusy={updateProfile.isPending || isUploading}
          onClose={() => setSection(null)}
          footer={
            <>
              <FormError id="personal-profile-error">{profileError}</FormError>
              {isProfileSaved ? <p role="status">Alterações salvas.</p> : null}
              <Button
                onClick={requestProfileSave}
                loading={updateProfile.isPending}
                disabled={isUploading}
              >
                Salvar alterações
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            {isPersonalVerificationAtRisk(verificationStatus) ? (
              <p className="text-xs text-neutral-600">
                Alterar estes dados reinicia a verificação da sua identidade.
              </p>
            ) : null}
            {sectionFields[section]}
          </div>
        </BottomSheet>
      ) : null}
      {isConfirmingLoss ? (
        <PersonalVerificationLossDialog
          status={verificationStatus}
          isBusy={updateProfile.isPending}
          onConfirm={() => void saveProfile()}
          onClose={() => setIsConfirmingLoss(false)}
        />
      ) : null}
    </>
  );
}
