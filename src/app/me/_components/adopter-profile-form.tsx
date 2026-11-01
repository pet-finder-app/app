"use client";

import { DeleteAccountButton } from "@/components/account/delete-account-button";
import { LogoutButton } from "@/components/account/logout-button";
import { AdopterTabBar } from "@/components/adopter/adopter-tab-bar";
import {
  Button,
  Checkbox,
  cn,
  FileInput,
  FormError,
  iconSize,
  Input,
  PageShell,
  Select,
  Textarea,
  TextLink,
} from "@/components/ui";
import { shadowSoft } from "@/components/ui/elevation";
import { VerificationBadge } from "@/components/verification/verification-badge";
import {
  ADOPTER_SECTION_LABEL,
  ADOPTER_VERIFICATION_STATUS_LABEL,
  getAdopterChecklist,
  HOUSING_OWNERSHIP_LABEL,
  HOUSING_TYPE_LABEL,
  isAdopterReadyForReview,
  type AdopterProfile,
  type AdopterProfileSection,
  type HousingOwnership,
  type HousingType,
} from "@/lib/adopter";
import {
  isValidPersonalTaxId,
  maskPersonalTaxId,
  maskPhone,
  maskPostalCode,
  onlyDigits,
} from "@/lib/br-documents";
import {
  PET_AGE_GROUP_LABEL,
  PET_SIZE_LABEL,
  PET_SPECIES_LABEL,
  type PetAgeGroup,
  type PetSize,
  type PetSpecies,
} from "@/lib/pet";
import {
  Accessibility,
  AlignLeft,
  AtSign,
  Baby,
  Bird,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Cat,
  Check,
  ChevronRight,
  Clock3,
  Dog,
  DoorOpen,
  Grid2X2,
  Hash,
  HeartHandshake,
  House,
  IdCard,
  ImagePlus,
  KeyRound,
  Mail,
  Map,
  MapPin,
  MapPinned,
  PawPrint,
  Phone,
  Route,
  Ruler,
  TreePine,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { VerificationProgress } from "./verification-progress";

const SPECIES_ICONS: Record<PetSpecies, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  other: PawPrint,
};

const ERROR_ID = "adopter-profile-error";

const STATE_CODES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

type AdopterProfileFormProps = {
  initialProfile: AdopterProfile;
  accountAvatarUrl: string | null;
};

/** Adopter profile sections share one save action. Review submission becomes available when the checklist is complete. */
export function AdopterProfileForm({
  initialProfile,
  accountAvatarUrl,
}: AdopterProfileFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<AdopterProfile>(initialProfile);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const avatarUrl = profile.personal.avatar?.url ?? accountAvatarUrl;
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(initialProfile),
  );
  const hasChanges = JSON.stringify(profile) !== savedSnapshot;
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);

  useEffect(() => {
    if (!focusField || !activeSection) return;
    const field = document.getElementById(focusField);
    field?.scrollIntoView({ block: "center" });
    field?.focus({ preventScroll: true });
  }, [activeSection, focusField]);

  const checklist = getAdopterChecklist(profile);
  const ready = isAdopterReadyForReview(profile);
  const status = profile.verification.status;

  function handleOpenProfileSection(section: AdopterProfileSection) {
    setFocusField(null);
    setActiveSection(section);
  }

  function patch<K extends keyof AdopterProfile>(
    section: K,
    changes: Partial<AdopterProfile[K]>,
  ) {
    setProfile((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...changes },
    }));
  }

  /** Display the error, highlight the field, and move focus to it. */
  function failOnField(fieldId: string, message: string) {
    setError(message);
    setErrorField(fieldId);
    setActiveSection("personal");
    setFocusField(fieldId);
  }

  /** Look up the address using the ViaCEP postal-code service. */
  async function lookupPostalCode(postalCode: string) {
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${postalCode}/json/`,
      );
      // These external field names are defined by the ViaCEP wire protocol.
      const external = (await response.json()) as Record<string, unknown>;
      if (external["erro"]) return;
      const address = {
        street:
          typeof external["logradouro"] === "string"
            ? external["logradouro"]
            : "",
        neighborhood:
          typeof external["bairro"] === "string" ? external["bairro"] : "",
        city:
          typeof external["localidade"] === "string"
            ? external["localidade"]
            : "",
        state: typeof external["uf"] === "string" ? external["uf"] : "",
      };
      setProfile((prev) => {
        if (prev.personal.address.postalCode !== postalCode) return prev;
        const a = prev.personal.address;
        return {
          ...prev,
          personal: {
            ...prev.personal,
            address: {
              ...a,
              street: a.street || address.street,
              neighborhood: a.neighborhood || address.neighborhood,
              city: a.city || address.city,
              state: a.state || address.state,
            },
          },
        };
      });
    } catch {
      // If the address service is unavailable, allow manual address entry.
    }
  }

  async function save(submitForReview: boolean) {
    if (isSaving || (!submitForReview && !hasChanges)) return;
    setError(null);
    setErrorField(null);
    setSavedAt(null);
    if (!profile.personal.fullName.trim()) {
      failOnField("fullName", "Informe seu nome completo.");
      return;
    }
    const activeDialog =
      document.querySelector<HTMLDialogElement>("dialog[open]");
    const invalidField = activeDialog?.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input:invalid, select:invalid, textarea:invalid");
    if (invalidField) {
      invalidField.reportValidity();
      return;
    }
    const personalTaxId = onlyDigits(profile.personal.personalTaxId);
    if (personalTaxId && !isValidPersonalTaxId(personalTaxId)) {
      failOnField("personalTaxId", "CPF inválido. Confira os números.");
      return;
    }
    setIsSaving(true);
    const submittedSnapshot = JSON.stringify(profile);
    try {
      const response = await fetch("/api/adopter/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, submitForReview }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.field === "personal.personalTaxId") {
          failOnField("personalTaxId", data.message ?? "CPF inválido.");
        } else {
          setError(data.message ?? "Não foi possível salvar.");
        }
        return;
      }
      setProfile((current) =>
        JSON.stringify(current) === submittedSnapshot ? data.profile : current,
      );
      setSavedSnapshot(JSON.stringify(data.profile));
      setSavedAt(new Date().toLocaleTimeString("pt-BR"));
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(false);
  }

  const sectionProps = {
    activeSection,
    onOpen: setActiveSection,
    onClose: () => setActiveSection(null),
    isSaving,
    footer: (
      <div className="flex flex-col gap-2">
        <FormError id={ERROR_ID}>{error}</FormError>
        {savedAt && !error && !hasChanges ? (
          <p role="status" className="text-sm text-accent-tertiary">
            Alterações salvas às {savedAt}.
          </p>
        ) : null}
        <Button
          type="button"
          size="lg"
          disabled={!hasChanges}
          loading={isSaving}
          loadingLabel="SALVANDO..."
          onClick={() => void save(false)}
        >
          Salvar alterações
        </Button>
      </div>
    ),
  };

  const verificationProgress = (
    <VerificationProgress
      checklist={checklist}
      status={status}
      isReadyForReview={ready}
      isSaving={isSaving}
      hasChanges={hasChanges}
      onOpenSection={handleOpenProfileSection}
      onSubmitForReview={() => void save(true)}
    />
  );

  return (
    <PageShell
      hasActionBar
      className="pt-[calc(3.5rem+env(safe-area-inset-top))]!"
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <header className="py-2">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary"
              >
                {avatarUrl && avatarUrl !== failedAvatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    onError={() => setFailedAvatarUrl(avatarUrl)}
                  />
                ) : (
                  <UserRound className="size-8 text-text" />
                )}
              </span>
              <h1 className="flex min-w-0 items-center gap-2 text-2xl font-bold text-text">
                <span className="min-w-0 break-words">
                  {profile.personal.fullName || "Seu perfil"}
                </span>
                <VerificationBadge
                  status={status}
                  label={ADOPTER_VERIFICATION_STATUS_LABEL[status]}
                  compact
                  className="size-5!"
                />
              </h1>
            </div>
          </header>

          <section
            aria-labelledby="verification-overview-title"
            className="flex flex-col gap-3 pb-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="verification-overview-title"
                className="font-semibold text-text"
              >
                Verificação do perfil
              </h2>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setActiveSection("checklist")}
                className="min-h-11 text-sm font-medium text-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent-tertiary"
              >
                Ver etapas
              </button>
            </div>
            {verificationProgress}
          </section>
        </div>
        <h2 className="text-sm font-semibold text-neutral-600">
          Configurações
        </h2>

        {/* 1. Personal identification ---------------------------------------------- */}
        <Section
          {...sectionProps}
          id="personal"
          icon={UserRound}
          title={ADOPTER_SECTION_LABEL.personal}
          description="Quem é você, para a ONG conhecer antes de conversar."
        >
          <FileInput
            id="avatar"
            labelIcon={ImagePlus}
            label="Foto"
            accept="image/*"
            value={profile.personal.avatar}
            onChange={(file) => patch("personal", { avatar: file })}
          />
          <Input
            id="fullName"
            labelIcon={UserRound}
            label="Nome completo"
            autoComplete="name"
            invalid={errorField === "fullName"}
            errorId={ERROR_ID}
            value={profile.personal.fullName}
            onChange={(e) => patch("personal", { fullName: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="personalTaxId"
              labelIcon={IdCard}
              label="CPF"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={maskPersonalTaxId(profile.personal.personalTaxId)}
              invalid={errorField === "personalTaxId"}
              errorId={ERROR_ID}
              onChange={(e) => {
                setErrorField(null);
                setError(null);
                patch("personal", {
                  personalTaxId: onlyDigits(e.target.value),
                });
              }}
            />
            <Input
              id="birthDate"
              labelIcon={CalendarDays}
              label="Data de nascimento"
              type="date"
              value={profile.personal.birthDate}
              onChange={(e) => patch("personal", { birthDate: e.target.value })}
            />
          </div>
          <Input
            id="phone"
            labelIcon={Phone}
            label="Telefone / WhatsApp"
            type="tel"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={maskPhone(profile.personal.phone)}
            onChange={(e) =>
              patch("personal", { phone: onlyDigits(e.target.value) })
            }
            hint={
              profile.personal.phoneVerifiedAt
                ? "Telefone confirmado."
                : undefined
            }
          />
          <Input
            id="occupation"
            labelIcon={BriefcaseBusiness}
            label="Ocupação (opcional)"
            value={profile.personal.occupation}
            onChange={(e) => patch("personal", { occupation: e.target.value })}
          />
          <Input
            id="instagram"
            labelIcon={AtSign}
            label="Instagram (opcional)"
            placeholder="@usuario"
            value={profile.personal.instagram}
            onChange={(e) => patch("personal", { instagram: e.target.value })}
          />
          <Textarea
            id="bio"
            labelIcon={AlignLeft}
            label="Fale sobre você (opcional)"
            placeholder="Rotina, experiência com animais, o que te motiva a adotar..."
            value={profile.personal.bio}
            onChange={(e) => patch("personal", { bio: e.target.value })}
          />

          <FileInput
            id="idDocument"
            labelIcon={IdCard}
            label="Documento com foto"
            hint="RG, CNH ou passaporte. PDF ou imagem."
            accept="application/pdf,image/*"
            value={profile.personal.idDocument}
            onChange={(file) => patch("personal", { idDocument: file })}
          />
          <FileInput
            id="addressProof"
            labelIcon={House}
            label="Comprovante de residência"
            hint="Conta de luz, água ou telefone recente."
            accept="application/pdf,image/*"
            value={profile.personal.addressProof}
            onChange={(file) => patch("personal", { addressProof: file })}
          />

          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-text">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            Endereço
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="postalCode"
              labelIcon={Mail}
              label="CEP"
              inputMode="numeric"
              placeholder="00000-000"
              value={maskPostalCode(profile.personal.address.postalCode)}
              hint="Preenchemos o endereço para você."
              onChange={(e) => {
                const postalCode = onlyDigits(e.target.value).slice(0, 8);
                patch("personal", {
                  address: { ...profile.personal.address, postalCode },
                });
                if (postalCode.length === 8) void lookupPostalCode(postalCode);
              }}
            />
            <Select
              id="state"
              labelIcon={Map}
              label="Estado"
              placeholder="Estado"
              value={profile.personal.address.state}
              onChange={(e) =>
                patch("personal", {
                  address: {
                    ...profile.personal.address,
                    state: e.target.value,
                  },
                })
              }
              options={STATE_CODES.map((stateCode) => ({
                value: stateCode,
                label: stateCode,
              }))}
            />
          </div>
          <Input
            id="city"
            labelIcon={Building2}
            label="Cidade"
            value={profile.personal.address.city}
            onChange={(e) =>
              patch("personal", {
                address: { ...profile.personal.address, city: e.target.value },
              })
            }
          />
          <Input
            id="neighborhood"
            labelIcon={MapPinned}
            label="Bairro"
            value={profile.personal.address.neighborhood}
            onChange={(e) =>
              patch("personal", {
                address: {
                  ...profile.personal.address,
                  neighborhood: e.target.value,
                },
              })
            }
          />
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <Input
              id="street"
              labelIcon={Route}
              label="Rua"
              value={profile.personal.address.street}
              onChange={(e) =>
                patch("personal", {
                  address: {
                    ...profile.personal.address,
                    street: e.target.value,
                  },
                })
              }
            />
            <Input
              id="number"
              labelIcon={Hash}
              label="Número"
              value={profile.personal.address.number}
              onChange={(e) =>
                patch("personal", {
                  address: {
                    ...profile.personal.address,
                    number: e.target.value,
                  },
                })
              }
            />
          </div>
          <Input
            id="complement"
            labelIcon={DoorOpen}
            label="Complemento (opcional)"
            value={profile.personal.address.complement}
            onChange={(e) =>
              patch("personal", {
                address: {
                  ...profile.personal.address,
                  complement: e.target.value,
                },
              })
            }
          />
        </Section>

        {/* 2. Moradia e rotina --------------------------------------------- */}
        <Section
          {...sectionProps}
          id="housing"
          icon={House}
          title={ADOPTER_SECTION_LABEL.housing}
          description="O que uma ONG avalia antes de entregar um pet."
        >
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="housingType"
              labelIcon={House}
              label="Tipo de moradia"
              placeholder="Selecione..."
              value={profile.housing.type}
              onChange={(e) =>
                patch("housing", {
                  type: e.target.value as HousingType,
                })
              }
              options={(Object.keys(HOUSING_TYPE_LABEL) as HousingType[]).map(
                (key) => ({ value: key, label: HOUSING_TYPE_LABEL[key] }),
              )}
            />
            <Select
              id="ownership"
              labelIcon={KeyRound}
              label="Situação do imóvel"
              placeholder="Selecione..."
              value={profile.housing.ownership}
              onChange={(e) =>
                patch("housing", {
                  ownership: e.target.value as HousingOwnership,
                })
              }
              options={(
                Object.keys(HOUSING_OWNERSHIP_LABEL) as HousingOwnership[]
              ).map((key) => ({
                value: key,
                label: HOUSING_OWNERSHIP_LABEL[key],
              }))}
            />
          </div>

          {profile.housing.ownership === "rented" ? (
            <Checkbox
              id="landlordAllowsPets"
              labelIcon={KeyRound}
              label="O proprietário permite animais"
              checked={profile.housing.landlordAllowsPets}
              onChange={(e) =>
                patch("housing", { landlordAllowsPets: e.target.checked })
              }
            />
          ) : null}

          <div className="flex flex-col gap-2">
            <Checkbox
              id="hasYard"
              labelIcon={TreePine}
              label="Tem quintal ou área externa"
              checked={profile.housing.hasYard}
              onChange={(e) => patch("housing", { hasYard: e.target.checked })}
            />
            <Checkbox
              id="hasScreens"
              labelIcon={Grid2X2}
              label="Tem telas de proteção nas janelas (importante para gatos)"
              checked={profile.housing.hasScreens}
              onChange={(e) =>
                patch("housing", { hasScreens: e.target.checked })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="residentsCount"
              labelIcon={UsersRound}
              label="Pessoas na casa"
              type="number"
              min={0}
              inputMode="numeric"
              value={profile.housing.residentsCount ?? ""}
              onChange={(e) =>
                patch("housing", {
                  residentsCount:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
            <Input
              id="hoursAloneOnWeekdays"
              labelIcon={Clock3}
              label="Horas sozinho (dias úteis)"
              type="number"
              min={0}
              max={24}
              inputMode="numeric"
              value={profile.housing.hoursAloneOnWeekdays ?? ""}
              onChange={(e) =>
                patch("housing", {
                  hoursAloneOnWeekdays:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>

          <Checkbox
            id="hasChildren"
            labelIcon={Baby}
            label="Há crianças na casa"
            checked={profile.housing.hasChildren}
            onChange={(e) =>
              patch("housing", { hasChildren: e.target.checked })
            }
          />
          <Checkbox
            id="hasOtherPets"
            labelIcon={PawPrint}
            label="Já tem outros animais"
            checked={profile.housing.hasOtherPets}
            onChange={(e) =>
              patch("housing", { hasOtherPets: e.target.checked })
            }
          />
          {profile.housing.hasOtherPets ? (
            <Input
              id="otherPetsDescription"
              labelIcon={PawPrint}
              label="Quais"
              placeholder="Um gato idoso, dois cães de pequeno porte..."
              value={profile.housing.otherPetsDescription}
              onChange={(e) =>
                patch("housing", { otherPetsDescription: e.target.value })
              }
            />
          ) : null}

          <Checkbox
            id="hasPetExperience"
            labelIcon={HeartHandshake}
            label="Já teve ou cuidou de animais antes"
            checked={profile.housing.hasPetExperience}
            onChange={(e) =>
              patch("housing", { hasPetExperience: e.target.checked })
            }
          />
          <Checkbox
            id="acceptsHomeVisit"
            labelIcon={House}
            label="Aceito receber visita domiciliar da ONG antes da adoção"
            checked={profile.housing.acceptsHomeVisit}
            onChange={(e) =>
              patch("housing", { acceptsHomeVisit: e.target.checked })
            }
          />
        </Section>

        {/* 3. Adoption preferences ---------------------------------------- */}
        <Section
          {...sectionProps}
          id="preferences"
          icon={PawPrint}
          title={ADOPTER_SECTION_LABEL.preferences}
          description="O que você procura, para o feed te mostrar os pets certos."
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-neutral-900">
              <span className="inline-flex items-center gap-2">
                <PawPrint className="size-4 shrink-0" aria-hidden="true" />
                Espécies
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PET_SPECIES_LABEL) as PetSpecies[]).map(
                (species) => (
                  <Checkbox
                    variant="chip"
                    key={species}
                    id={`species-${species}`}
                    labelIcon={SPECIES_ICONS[species]}
                    label={PET_SPECIES_LABEL[species]}
                    checked={profile.preferences.species.includes(species)}
                    onChange={(e) =>
                      patch("preferences", {
                        species: e.target.checked
                          ? [...profile.preferences.species, species]
                          : profile.preferences.species.filter(
                              (s) => s !== species,
                            ),
                      })
                    }
                  />
                ),
              )}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-neutral-900">
              <span className="inline-flex items-center gap-2">
                <Ruler className="size-4 shrink-0" aria-hidden="true" />
                Porte
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PET_SIZE_LABEL) as PetSize[]).map((size) => (
                <Checkbox
                  variant="chip"
                  key={size}
                  id={`size-${size}`}
                  labelIcon={Ruler}
                  label={PET_SIZE_LABEL[size]}
                  checked={profile.preferences.sizes.includes(size)}
                  onChange={(e) =>
                    patch("preferences", {
                      sizes: e.target.checked
                        ? [...profile.preferences.sizes, size]
                        : profile.preferences.sizes.filter((s) => s !== size),
                    })
                  }
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-neutral-900">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                Idade
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PET_AGE_GROUP_LABEL) as PetAgeGroup[]).map(
                (ageGroup) => (
                  <Checkbox
                    variant="chip"
                    key={ageGroup}
                    id={`ageGroup-${ageGroup}`}
                    labelIcon={CalendarDays}
                    label={PET_AGE_GROUP_LABEL[ageGroup]}
                    checked={profile.preferences.ageGroups.includes(ageGroup)}
                    onChange={(e) =>
                      patch("preferences", {
                        ageGroups: e.target.checked
                          ? [...profile.preferences.ageGroups, ageGroup]
                          : profile.preferences.ageGroups.filter(
                              (a) => a !== ageGroup,
                            ),
                      })
                    }
                  />
                ),
              )}
            </div>
          </fieldset>

          <Checkbox
            variant="chip"
            className="self-start"
            id="acceptsSpecialNeeds"
            labelIcon={Accessibility}
            label="Aceito adotar um pet com necessidades especiais"
            checked={profile.preferences.acceptsSpecialNeeds}
            onChange={(e) =>
              patch("preferences", {
                acceptsSpecialNeeds: e.target.checked,
              })
            }
          />

          <Textarea
            id="aboutIdealPet"
            labelIcon={HeartHandshake}
            label="O que você procura num pet"
            placeholder="Temperamento, tamanho, se precisa se dar bem com outros animais..."
            value={profile.preferences.aboutIdealPet}
            onChange={(e) =>
              patch("preferences", { aboutIdealPet: e.target.value })
            }
          />
        </Section>

        {/* Checklist ------------------------------------------------------- */}
        {activeSection === "checklist" ? (
          <BottomSheet
            title="Verificação do perfil"
            onClose={sectionProps.onClose}
            isBusy={isSaving}
            footer={sectionProps.footer}
          >
            <div id="checklist" className="flex flex-col gap-4">
              <p className="text-sm font-medium text-text">
                {status === "pending" && ready
                  ? "Pronto para enviar"
                  : ADOPTER_VERIFICATION_STATUS_LABEL[status]}
              </p>
              {verificationProgress}
              {profile.verification.statusNote ? (
                <p className="rounded-2xl bg-accent-peach px-3 py-2 text-sm text-text">
                  {profile.verification.statusNote}
                </p>
              ) : null}
              <p className="text-sm text-neutral-600">
                A verificação é uma conferência dos seus dados. Quem passa ganha
                o selo &ldquo;Adotante verificado&rdquo;.
              </p>
              <ul className="flex flex-col gap-1.5">
                {checklist.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                        item.done
                          ? "bg-primary text-neutral-900"
                          : "bg-neutral-100",
                      )}
                    >
                      {item.done ? (
                        <Check className="size-3" strokeWidth={3} />
                      ) : null}
                    </span>
                    <a
                      href={`#${item.section}`}
                      onClick={(event) => {
                        event.preventDefault();
                        handleOpenProfileSection(item.section);
                      }}
                      className={
                        item.done
                          ? "text-neutral-600 line-through"
                          : "text-neutral-900"
                      }
                    >
                      {item.label}
                      {!item.done && item.missing ? (
                        <span className="block text-xs font-semibold text-red-700">
                          Falta: {item.missing}
                        </span>
                      ) : null}
                      <span className="sr-only">
                        {item.done ? " (concluído)" : " (pendente)"}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </BottomSheet>
        ) : null}

        <div className="flex flex-col gap-4">
          <LogoutButton
            confirm
            variant="danger-ghost"
            size="lg"
            className="min-h-14 justify-start rounded-2xl border border-border-light px-4 font-semibold tracking-normal"
          />
          <DeleteAccountButton
            confirmation="modal"
            variant="danger-ghost"
            size="lg"
            className="min-h-14 w-full justify-start rounded-2xl border border-border-light px-4 font-semibold tracking-normal"
          />
        </div>
        <div
          className={cn(
            "flex flex-col gap-3",
            !hasChanges && !error && !savedAt && "sr-only",
          )}
        >
          {hasChanges ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-neutral-600">
                Você tem alterações não salvas.
              </p>
              <Button
                type="submit"
                loading={isSaving}
                loadingLabel="SALVANDO..."
              >
                Salvar alterações
              </Button>
            </div>
          ) : null}
          <FormError
            id={activeSection ? "profile-summary-error" : ERROR_ID}
            className="min-h-4 text-xs"
          >
            {error}
          </FormError>
          {savedAt && !error && !hasChanges ? (
            <p
              role="status"
              className={cn(
                "flex items-center gap-1.5 rounded-2xl bg-primary-faint px-3 py-2 text-sm font-bold text-lime-800",
                shadowSoft.sm,
              )}
            >
              <Check className={iconSize.sm} aria-hidden="true" />
              Perfil salvo com sucesso às {savedAt}.
            </p>
          ) : null}
        </div>
        <footer className="pt-2 text-center">
          <TextLink
            href="/terms"
            target="_blank"
            tone="brutal"
            className="inline-flex min-h-11 items-center text-xs font-medium no-underline!"
          >
            <span>
              <span className="underline">Termos de uso</span> e{" "}
              <span className="underline">política de privacidade</span>
            </span>
          </TextLink>
        </footer>
      </form>
      <AdopterTabBar />
    </PageShell>
  );
}

type SectionProps = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  activeSection: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
  isSaving: boolean;
  footer: ReactNode;
};

function Section({
  id,
  icon: Icon,
  title,
  description,
  children,
  activeSection,
  onOpen,
  onClose,
  isSaving,
  footer,
}: SectionProps) {
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => onOpen(id)}
        className="flex min-h-20 w-full items-center gap-4 rounded-2xl border border-border-light p-4 text-left transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-accent-tertiary"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-semibold">
            <Icon className="size-5 shrink-0 text-text" aria-hidden="true" />
            {title}
          </span>
          <span className="mt-1 block text-sm text-neutral-600">
            {description}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
      </button>
      {activeSection === id ? (
        <BottomSheet
          title={title}
          onClose={onClose}
          isBusy={isSaving}
          footer={footer}
        >
          <div id={id} className="flex flex-col gap-4">
            {children}
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
