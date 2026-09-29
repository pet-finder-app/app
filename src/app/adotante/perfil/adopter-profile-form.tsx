"use client";

import { LogoutButton } from "@/components/logout-button";
import {
  ActionBar,
  Button,
  Card,
  CardDescription,
  CardTitle,
  Checkbox,
  cn,
  FileInput,
  FormError,
  iconSize,
  Input,
  LinkButton,
  PageShell,
  Select,
  Textarea,
  TextLink,
} from "@/components/ui";
import { pressSoft, shadowSoft } from "@/components/ui/elevation";
import { VerificationBadge } from "@/components/verification-badge";
import {
  ADOPTER_SECTION_KEYS,
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
import { maskCep, maskCpf, maskPhone, onlyDigits } from "@/lib/br-documents";
import { TERMS_VERSION } from "@/lib/ong";
import {
  PET_AGE_GROUP_LABEL,
  PET_SIZE_LABEL,
  PET_SPECIES_LABEL,
  type PetAgeGroup,
  type PetSize,
  type PetSpecies,
} from "@/lib/pet";
import { Check, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

const ERROR_ID = "adopter-profile-error";

const UFS = [
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
};

/**
 * Área de "completar perfil" do adotante: quatro cartões (identificação,
 * moradia, preferências de adoção e termos), espelhando o mesmo padrão de
 * `/ong/perfil` — um único botão salva tudo, "Enviar para verificação"
 * aparece quando o checklist está completo.
 */
export function AdopterProfileForm({
  initialProfile,
}: AdopterProfileFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<AdopterProfile>(initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const checklist = getAdopterChecklist(profile);
  const ready = isAdopterReadyForReview(profile);
  const status = profile.verification.status;
  const locked = status === "verificada" || status === "suspensa";

  function patch<K extends keyof AdopterProfile>(
    section: K,
    changes: Partial<AdopterProfile[K]>,
  ) {
    setProfile((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...changes },
    }));
  }

  async function save(submitForReview: boolean) {
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/adopter/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, submitForReview }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Não foi possível salvar.");
        return;
      }
      setProfile(data.profile);
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

  const sectionDone = (section: AdopterProfileSection) =>
    checklist.filter((i) => i.section === section).every((i) => i.done);

  return (
    <PageShell hasActionBar>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card as="header" className="gap-2">
          <div className="flex items-center justify-between gap-2">
            <LinkButton href="/" variant="pill" size="sm">
              <ChevronLeft className={iconSize.sm} aria-hidden="true" />
              Início
            </LinkButton>
            <LogoutButton />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {profile.personal.fullName || "Seu perfil"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-900">
            <VerificationBadge
              status={status}
              label={ADOPTER_VERIFICATION_STATUS_LABEL[status]}
            />
          </div>
          {profile.verification.statusNote ? (
            <p
              className={cn(
                "rounded-2xl bg-accent-peach px-3 py-2 text-sm text-neutral-900",
                shadowSoft.sm,
              )}
            >
              {profile.verification.statusNote}
            </p>
          ) : null}

          <nav
            aria-label="Seções do perfil"
            className="mt-1 flex flex-wrap gap-2"
          >
            {ADOPTER_SECTION_KEYS.map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className={cn(
                  "inline-flex min-h-7 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  sectionDone(key)
                    ? "bg-primary-soft text-lime-800"
                    : "bg-neutral-100 text-neutral-900 hover:bg-primary-faint",
                  shadowSoft.sm,
                  pressSoft.sm,
                )}
              >
                {sectionDone(key) ? (
                  <Check className={iconSize.sm} aria-hidden="true" />
                ) : null}
                {ADOPTER_SECTION_LABEL[key]}
                {sectionDone(key) ? (
                  <span className="sr-only"> (concluída)</span>
                ) : null}
              </a>
            ))}
          </nav>
        </Card>

        {/* 1. Identificação ---------------------------------------------- */}
        <Section
          id="personal"
          title={ADOPTER_SECTION_LABEL.personal}
          description="Quem é você, para a ONG conhecer antes de conversar."
        >
          <FileInput
            id="avatar"
            label="Foto"
            accept="image/*"
            value={profile.personal.avatar}
            onChange={(file) => patch("personal", { avatar: file })}
          />
          <Input
            id="fullName"
            label="Nome completo"
            autoComplete="name"
            value={profile.personal.fullName}
            onChange={(e) => patch("personal", { fullName: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="cpf"
              label="CPF"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={maskCpf(profile.personal.cpf)}
              onChange={(e) =>
                patch("personal", { cpf: onlyDigits(e.target.value) })
              }
            />
            <Input
              id="birthDate"
              label="Data de nascimento"
              type="date"
              value={profile.personal.birthDate}
              onChange={(e) => patch("personal", { birthDate: e.target.value })}
            />
          </div>
          <Input
            id="phone"
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
            label="Ocupação"
            value={profile.personal.occupation}
            onChange={(e) => patch("personal", { occupation: e.target.value })}
          />
          <Input
            id="instagram"
            label="Instagram"
            placeholder="@usuario"
            value={profile.personal.instagram}
            onChange={(e) => patch("personal", { instagram: e.target.value })}
          />
          <Textarea
            id="bio"
            label="Fale sobre você"
            placeholder="Rotina, experiência com animais, o que te motiva a adotar..."
            value={profile.personal.bio}
            onChange={(e) => patch("personal", { bio: e.target.value })}
          />

          <FileInput
            id="idDocument"
            label="Documento com foto"
            hint="RG, CNH ou passaporte. PDF ou imagem."
            accept="application/pdf,image/*"
            value={profile.personal.idDocument}
            onChange={(file) => patch("personal", { idDocument: file })}
          />
          <FileInput
            id="addressProof"
            label="Comprovante de residência"
            hint="Conta de luz, água ou telefone recente."
            accept="application/pdf,image/*"
            value={profile.personal.addressProof}
            onChange={(file) => patch("personal", { addressProof: file })}
          />

          <p className="mt-2 text-sm font-bold text-neutral-900">Endereço</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="cep"
              label="CEP"
              inputMode="numeric"
              placeholder="00000-000"
              value={maskCep(profile.personal.address.cep)}
              onChange={(e) =>
                patch("personal", {
                  address: {
                    ...profile.personal.address,
                    cep: onlyDigits(e.target.value),
                  },
                })
              }
            />
            <Select
              id="state"
              label="UF"
              placeholder="UF"
              value={profile.personal.address.state}
              onChange={(e) =>
                patch("personal", {
                  address: {
                    ...profile.personal.address,
                    state: e.target.value,
                  },
                })
              }
              options={UFS.map((uf) => ({ value: uf, label: uf }))}
            />
          </div>
          <Input
            id="city"
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
            label="Complemento"
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
          id="housing"
          title={ADOPTER_SECTION_LABEL.housing}
          description="O que uma ONG avalia antes de entregar um pet."
        >
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="housingType"
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

          {profile.housing.ownership === "alugada" ? (
            <Checkbox
              id="landlordAllowsPets"
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
              label="Tem quintal ou área externa"
              checked={profile.housing.hasYard}
              onChange={(e) => patch("housing", { hasYard: e.target.checked })}
            />
            <Checkbox
              id="hasScreens"
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
            label="Há crianças na casa"
            checked={profile.housing.hasChildren}
            onChange={(e) =>
              patch("housing", { hasChildren: e.target.checked })
            }
          />
          <Checkbox
            id="hasOtherPets"
            label="Já tem outros animais"
            checked={profile.housing.hasOtherPets}
            onChange={(e) =>
              patch("housing", { hasOtherPets: e.target.checked })
            }
          />
          {profile.housing.hasOtherPets ? (
            <Input
              id="otherPetsDescription"
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
            label="Já teve ou cuidou de animais antes"
            checked={profile.housing.hasPetExperience}
            onChange={(e) =>
              patch("housing", { hasPetExperience: e.target.checked })
            }
          />
          <Checkbox
            id="acceptsHomeVisit"
            label="Aceito receber visita domiciliar da ONG antes da adoção"
            checked={profile.housing.acceptsHomeVisit}
            onChange={(e) =>
              patch("housing", { acceptsHomeVisit: e.target.checked })
            }
          />
        </Section>

        {/* 3. Preferências de adoção ---------------------------------------- */}
        <Section
          id="preferences"
          title={ADOPTER_SECTION_LABEL.preferences}
          description="O que você procura, para o feed te mostrar os pets certos."
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-neutral-900">
              Espécies
            </legend>
            {(Object.keys(PET_SPECIES_LABEL) as PetSpecies[]).map((species) => (
              <Checkbox
                key={species}
                id={`species-${species}`}
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
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-neutral-900">
              Porte
            </legend>
            {(Object.keys(PET_SIZE_LABEL) as PetSize[]).map((size) => (
              <Checkbox
                key={size}
                id={`size-${size}`}
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
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-neutral-900">
              Idade
            </legend>
            {(Object.keys(PET_AGE_GROUP_LABEL) as PetAgeGroup[]).map(
              (ageGroup) => (
                <Checkbox
                  key={ageGroup}
                  id={`ageGroup-${ageGroup}`}
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
          </fieldset>

          <Checkbox
            id="acceptsSpecialNeeds"
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
            label="O que você procura num pet"
            placeholder="Temperamento, tamanho, se precisa se dar bem com outros animais..."
            value={profile.preferences.aboutIdealPet}
            onChange={(e) =>
              patch("preferences", { aboutIdealPet: e.target.value })
            }
          />
        </Section>

        {/* 4. Termos e LGPD --------------------------------------------- */}
        <Section
          id="legalConsent"
          title={ADOPTER_SECTION_LABEL.legalConsent}
          description="Aceite registrado com data, hora e IP."
        >
          <Checkbox
            id="acceptedTerms"
            checked={profile.legalConsent.terms !== null}
            onChange={(e) =>
              patch("legalConsent", {
                terms: e.target.checked
                  ? {
                      version: TERMS_VERSION,
                      acceptedAt: new Date().toISOString(),
                      ip: "",
                      userAgent: "",
                    }
                  : null,
              })
            }
            label={
              <>
                Li e aceito os{" "}
                <TextLink href="/termos" target="_blank">
                  termos de uso e a política de privacidade
                </TextLink>
                .
              </>
            }
          />
          {profile.legalConsent.terms?.ip ? (
            <p className="text-xs text-neutral-600">
              Registrado em{" "}
              {new Date(profile.legalConsent.terms.acceptedAt).toLocaleString(
                "pt-BR",
              )}{" "}
              · IP {profile.legalConsent.terms.ip}
            </p>
          ) : null}
        </Section>

        {/* Checklist ------------------------------------------------------- */}
        <Card className="gap-3">
          <CardTitle>Para as ONGs confiarem no seu perfil</CardTitle>
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
                  className={
                    item.done
                      ? "text-neutral-600 line-through"
                      : "text-neutral-900"
                  }
                >
                  {item.label}
                  <span className="sr-only">
                    {item.done ? " (concluído)" : " (pendente)"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Card>

        {/* Barra fixa de ações ---------------------------------------------- */}
        <ActionBar>
          <FormError id={ERROR_ID} className="min-h-4 text-xs">
            {error ??
              (savedAt ? (
                <span className="text-neutral-600">Salvo às {savedAt}.</span>
              ) : null)}
          </FormError>
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="flex-1"
              loading={isSaving}
              loadingLabel="SALVANDO..."
            >
              SALVAR
            </Button>
            {status === "pendente" ? (
              <Button
                size="lg"
                className="flex-1"
                disabled={isSaving || !ready || locked}
                onClick={() => void save(true)}
              >
                ENVIAR PARA VERIFICAÇÃO
              </Button>
            ) : null}
          </div>
        </ActionBar>
      </form>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------

function Section({
  id,
  title,
  description,
  children,
}: {
  id: AdopterProfileSection;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card id={id} aria-labelledby={`${id}-title`} className="scroll-mt-4">
      <div>
        <CardTitle id={`${id}-title`}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      {children}
    </Card>
  );
}
