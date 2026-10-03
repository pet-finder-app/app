"use client";

import { DeleteAccountButton } from "@/components/delete-account-button";
import { LogoutButton } from "@/components/logout-button";
import { PawIcon } from "@/components/paw-icon";
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
  DOCUMENT_LABEL,
  maskCep,
  maskCpf,
  maskDocument,
  maskPhone,
  onlyDigits,
} from "@/lib/br-documents";
import {
  getOngChecklist,
  isOngReadyForReview,
  ORGANIZATION_TYPES,
  PREFERRED_CONTACT_LABEL,
  SECTION_LABEL,
  SPECIES_LABEL,
  TEAM_ROLE_LABEL,
  TERMS_VERSION,
  type OngProfile,
  type OngProfileSection,
  type PreferredContact,
  type Species,
  type TeamMember,
  type TeamRole,
} from "@/lib/ong";
import { Camera, Check, ChevronLeft, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

const ERROR_ID = "ong-profile-error";

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

/** Grupos de configurações; cada um reúne seções do checklist. */
const GROUPS: { id: string; label: string; sections: OngProfileSection[] }[] = [
  { id: "group-perfil", label: "Perfil", sections: ["publicProfile"] },
  {
    id: "group-org",
    label: "ONG",
    sections: ["legal", "representative", "verification"],
  },
  { id: "group-atuacao", label: "Adoção", sections: ["operations"] },
  { id: "group-conta", label: "Conta", sections: ["legalConsent"] },
];

type OngProfileFormProps = {
  initialProfile: OngProfile;
};

/**
 * Configurações da ONG: foto/nome/bio no topo e as seis camadas do modelo
 * organizadas em quatro grupos (perfil, organização, atendimento, conta). Um único botão salva tudo; "Enviar para análise" aparece
 * quando o checklist está completo.
 */
export function OngProfileForm({ initialProfile }: OngProfileFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<OngProfile>(initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const checklist = getOngChecklist(profile);
  const ready = isOngReadyForReview(profile);
  const status = profile.verification.status;
  const isCompany = profile.legal.documentType === "cnpj";
  const locked = status === "verificada" || status === "suspensa";

  function patch<K extends keyof OngProfile>(
    section: K,
    changes: Partial<OngProfile[K]>,
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
      const response = await fetch("/api/ong/profile", {
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

  const [active, setActive] = useState(GROUPS[0].id);

  /** Abre a aba que contém a seção e rola até ela (usado pelo checklist). */
  function openSection(section: OngProfileSection) {
    const group = GROUPS.find((g) => g.sections.includes(section));
    if (group) setActive(group.id);
    requestAnimationFrame(() =>
      document.getElementById(section)?.scrollIntoView({ block: "start" }),
    );
  }

  return (
    <PageShell hasActionBar>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card as="header" className="gap-2">
          <LinkButton href="/" variant="pill" size="sm" className="self-start">
            <ChevronLeft className={iconSize.sm} aria-hidden="true" />
            Voltar ao perfil
          </LinkButton>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Configurações
            </h1>
            <p className="text-sm text-neutral-600">
              {profile.legal.tradeName} · @{profile.legal.nickname}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-900">
            <VerificationBadge status={status} />
            <span>
              {ORGANIZATION_TYPES[profile.legal.organizationType].label} ·{" "}
              {DOCUMENT_LABEL[profile.legal.documentType]}{" "}
              {maskDocument(profile.legal.documentType, profile.legal.document)}
            </span>
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
        </Card>

        {/* Abas: um grupo por vez; a barra fica fixa ao rolar */}
        <div className="sticky top-0 z-10 -mx-4 bg-neutral-100 px-4 py-2">
          <div
            role="tablist"
            aria-label="Grupos de configurações"
            className={cn(
              "grid grid-cols-4 gap-1 rounded-2xl bg-white p-1",
              shadowSoft.md,
            )}
          >
            {GROUPS.map((group) => {
              const selected = active === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  id={`tab-${group.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${group.id}`}
                  onClick={() => setActive(group.id)}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    selected
                      ? "bg-primary text-neutral-900"
                      : "text-neutral-600 hover:bg-primary-faint",
                  )}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="tabpanel"
          id="panel-group-perfil"
          aria-labelledby="tab-group-perfil"
          hidden={active !== "group-perfil"}
          className="flex flex-col gap-4"
        >
          <div className="px-1">
            <h2 className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
              Perfil público
            </h2>
            <p className="text-xs text-neutral-600">
              Como adotantes veem sua ONG.
            </p>
          </div>

          <Section
            id="publicProfile"
            title="Foto, nome e bio"
            description="O que aparece no topo do seu perfil."
          >
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <span
                  aria-hidden="true"
                  className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border border-neutral-900 bg-primary-soft"
                >
                  {profile.publicProfile.logo?.url ? (
                    <Image
                      src={profile.publicProfile.logo.url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <PawIcon className="size-10 text-lime-800" />
                  )}
                </span>
                <label
                  htmlFor="logo"
                  className={cn(
                    "absolute -right-1 -bottom-1 flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary text-neutral-900 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2",
                    shadowSoft.md,
                    pressSoft.md,
                  )}
                >
                  <Camera className={iconSize.md} aria-hidden="true" />
                  <span className="sr-only">Alterar foto do perfil</span>
                  <input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      patch("publicProfile", {
                        logo: {
                          name: file.name,
                          size: file.size,
                          mimeType: file.type,
                          uploadedAt: new Date().toISOString(),
                          url: null,
                        },
                      });
                    }}
                  />
                </label>
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-neutral-900">
                  {profile.legal.tradeName}
                </p>
                <p className="truncate text-xs text-neutral-600">
                  @{profile.legal.nickname}
                </p>
                {profile.publicProfile.logo ? (
                  <p className="truncate text-xs text-neutral-600">
                    Foto: {profile.publicProfile.logo.name}
                  </p>
                ) : null}
              </div>
            </div>
            <Input
              id="tradeName"
              label="Nome do perfil"
              value={profile.legal.tradeName}
              onChange={(e) => patch("legal", { tradeName: e.target.value })}
              required
            />
            <Textarea
              id="description"
              label="Bio"
              placeholder="Conte quem vocês são e como trabalham."
              value={profile.publicProfile.description}
              onChange={(e) =>
                patch("publicProfile", { description: e.target.value })
              }
            />
          </Section>

          {/* 5. Perfil público ------------------------------------------------ */}
          <Section
            id="links"
            title="Links e doações"
            description="Onde o adotante te encontra e como pode ajudar."
          >
            <Input
              id="website"
              label="Site"
              type="url"
              placeholder="https://"
              value={profile.publicProfile.website}
              onChange={(e) =>
                patch("publicProfile", { website: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="instagram"
                label="Instagram"
                placeholder="@usuario"
                value={profile.publicProfile.instagram}
                onChange={(e) =>
                  patch("publicProfile", { instagram: e.target.value })
                }
              />
              <Input
                id="facebook"
                label="Facebook"
                value={profile.publicProfile.facebook}
                onChange={(e) =>
                  patch("publicProfile", { facebook: e.target.value })
                }
              />
            </div>

            <p className="mt-2 text-sm font-bold text-neutral-900">Doações</p>
            <Input
              id="pixKey"
              label="Chave Pix"
              value={profile.publicProfile.donation.pixKey}
              onChange={(e) =>
                patch("publicProfile", {
                  donation: {
                    ...profile.publicProfile.donation,
                    pixKey: e.target.value,
                  },
                })
              }
            />
            <Input
              id="bankAccount"
              label="Conta bancária"
              placeholder="Banco · Agência · Conta"
              value={profile.publicProfile.donation.bankAccount}
              onChange={(e) =>
                patch("publicProfile", {
                  donation: {
                    ...profile.publicProfile.donation,
                    bankAccount: e.target.value,
                  },
                })
              }
            />
            <ListField
              id="neededItems"
              label="Itens que vocês precisam"
              hint="Ração, areia, medicamentos... separe com vírgula."
              value={profile.publicProfile.donation.neededItems}
              onChange={(list) =>
                patch("publicProfile", {
                  donation: {
                    ...profile.publicProfile.donation,
                    neededItems: list,
                  },
                })
              }
            />
          </Section>
        </div>

        <div
          role="tabpanel"
          id="panel-group-org"
          aria-labelledby="tab-group-org"
          hidden={active !== "group-org"}
          className="flex flex-col gap-4"
        >
          <div className="px-1">
            <h2 className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
              Sobre a organização
            </h2>
            <p className="text-xs text-neutral-600">
              Dados jurídicos e documentos de confiança.
            </p>
          </div>

          {/* 1. Identificação jurídica ---------------------------------------- */}
          <Section
            id="legal"
            title={SECTION_LABEL.legal}
            description="Quem é a organização, juridicamente."
          >
            <Input
              id="legalName"
              label={isCompany ? "Razão social" : "Nome completo"}
              autoComplete={isCompany ? "organization" : "name"}
              value={profile.legal.legalName}
              onChange={(e) => patch("legal", { legalName: e.target.value })}
            />
            {!isCompany ? (
              <Input
                id="rg"
                label="RG"
                value={profile.legal.rg}
                onChange={(e) => patch("legal", { rg: e.target.value })}
              />
            ) : null}
            <Input
              id="foundedAt"
              label={
                isCompany ? "Data de fundação" : "Desde quando resgata animais"
              }
              type="date"
              value={profile.legal.foundedAt}
              onChange={(e) => patch("legal", { foundedAt: e.target.value })}
            />

            <p className="mt-2 text-sm font-bold text-neutral-900">
              Endereço {isCompany ? "da sede" : "do abrigo"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="cep"
                label="CEP"
                inputMode="numeric"
                placeholder="00000-000"
                value={maskCep(profile.legal.address.cep)}
                onChange={(e) =>
                  patch("legal", {
                    address: {
                      ...profile.legal.address,
                      cep: onlyDigits(e.target.value),
                    },
                  })
                }
              />
              <Select
                id="state"
                label="Estado (UF)"
                placeholder="Selecione"
                value={profile.legal.address.state}
                onChange={(e) =>
                  patch("legal", {
                    address: {
                      ...profile.legal.address,
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
              value={profile.legal.address.city}
              onChange={(e) =>
                patch("legal", {
                  address: { ...profile.legal.address, city: e.target.value },
                })
              }
            />
            <Input
              id="neighborhood"
              label="Bairro"
              value={profile.legal.address.neighborhood}
              onChange={(e) =>
                patch("legal", {
                  address: {
                    ...profile.legal.address,
                    neighborhood: e.target.value,
                  },
                })
              }
            />
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <Input
                id="street"
                label="Rua"
                value={profile.legal.address.street}
                onChange={(e) =>
                  patch("legal", {
                    address: {
                      ...profile.legal.address,
                      street: e.target.value,
                    },
                  })
                }
              />
              <Input
                id="number"
                label="Número"
                value={profile.legal.address.number}
                onChange={(e) =>
                  patch("legal", {
                    address: {
                      ...profile.legal.address,
                      number: e.target.value,
                    },
                  })
                }
              />
            </div>
            <Input
              id="complement"
              label="Complemento"
              value={profile.legal.address.complement}
              onChange={(e) =>
                patch("legal", {
                  address: {
                    ...profile.legal.address,
                    complement: e.target.value,
                  },
                })
              }
            />
          </Section>

          {/* 2. Responsável legal --------------------------------------------- */}
          <Section
            id="representative"
            title={SECTION_LABEL.representative}
            description="A pessoa que responde pela organização no app."
          >
            <Input
              id="repFullName"
              label="Nome completo"
              autoComplete="name"
              value={profile.representative.fullName}
              onChange={(e) =>
                patch("representative", { fullName: e.target.value })
              }
            />
            <Input
              id="repCpf"
              label="CPF"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={maskCpf(profile.representative.cpf)}
              onChange={(e) =>
                patch("representative", { cpf: onlyDigits(e.target.value) })
              }
            />
            <Input
              id="repPosition"
              label="Cargo ou função"
              placeholder="Presidente, tesoureira, protetora, voluntária..."
              value={profile.representative.position}
              onChange={(e) =>
                patch("representative", { position: e.target.value })
              }
            />
            <Input
              id="repEmail"
              label="E-mail"
              type="email"
              value={profile.representative.email}
              onChange={(e) =>
                patch("representative", { email: e.target.value })
              }
              hint={
                profile.representative.emailVerifiedAt
                  ? "E-mail confirmado."
                  : "A confirmação do e-mail por código ainda não está disponível."
              }
            />
            <Input
              id="repPhone"
              label="Telefone / WhatsApp"
              type="tel"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              value={maskPhone(profile.representative.phone)}
              onChange={(e) =>
                patch("representative", { phone: onlyDigits(e.target.value) })
              }
              hint={
                profile.representative.phoneVerifiedAt
                  ? "Telefone confirmado."
                  : undefined
              }
            />
            <FileInput
              id="repIdDocument"
              label="Documento com foto"
              hint="RG, CNH ou passaporte. PDF ou imagem."
              accept="application/pdf,image/*"
              value={profile.representative.idDocument}
              onChange={(file) => patch("representative", { idDocument: file })}
            />
          </Section>

          {/* 3. Verificação e confiança --------------------------------------- */}
          <Section
            id="verification"
            title={SECTION_LABEL.verification}
            description="Documentos que provam que a organização existe e é confiável."
          >
            {isCompany ? (
              <FileInput
                id="bylaws"
                label="Estatuto social ou ata de fundação"
                hint="PDF."
                accept="application/pdf"
                value={profile.verification.bylaws}
                onChange={(file) => patch("verification", { bylaws: file })}
              />
            ) : (
              <ListField
                id="references"
                label="Referências de ONGs já cadastradas"
                hint="Opcional se você não conhecer outras. Ex.: nome ou telefone de uma ONG ou protetor que conhece seu trabalho."
                value={profile.verification.references}
                onChange={(list) => patch("verification", { references: list })}
              />
            )}
            <FileInput
              id="addressProof"
              label="Comprovante de endereço da sede/abrigo"
              hint="Conta de luz, água ou telefone recente."
              accept="application/pdf,image/*"
              value={profile.verification.addressProof}
              onChange={(file) => patch("verification", { addressProof: file })}
            />
            <Input
              id="animalProtectionRegistry"
              label="Registro municipal/estadual de proteção animal"
              hint="Se houver."
              value={profile.verification.animalProtectionRegistry}
              onChange={(e) =>
                patch("verification", {
                  animalProtectionRegistry: e.target.value,
                })
              }
            />
            <Input
              id="veterinarianCrmv"
              label="CRMV do veterinário responsável"
              hint="Se tiver um parceiro fixo."
              placeholder="CRMV-SP 00000"
              value={profile.verification.veterinarianCrmv}
              onChange={(e) =>
                patch("verification", { veterinarianCrmv: e.target.value })
              }
            />
          </Section>
        </div>

        <div
          role="tabpanel"
          id="panel-group-atuacao"
          aria-labelledby="tab-group-atuacao"
          hidden={active !== "group-atuacao"}
          className="flex flex-col gap-4"
        >
          <div className="px-1">
            <h2 className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
              Atendimento e adoção
            </h2>
            <p className="text-xs text-neutral-600">
              Como funciona o dia a dia.
            </p>
          </div>

          {/* 4. Dados operacionais -------------------------------------------- */}
          <Section
            id="operations"
            title={SECTION_LABEL.operations}
            description="Como funciona o dia a dia da adoção."
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="shelterCapacity"
                label="Capacidade"
                type="number"
                min={0}
                inputMode="numeric"
                value={profile.operations.shelterCapacity ?? ""}
                onChange={(e) =>
                  patch("operations", {
                    shelterCapacity:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <Input
                id="currentAnimals"
                label="Animais hoje"
                type="number"
                min={0}
                inputMode="numeric"
                value={profile.operations.currentAnimals ?? ""}
                onChange={(e) =>
                  patch("operations", {
                    currentAnimals:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold text-neutral-900">
                Espécies atendidas
              </legend>
              {(Object.keys(SPECIES_LABEL) as Species[]).map((species) => (
                <Checkbox
                  key={species}
                  id={`species-${species}`}
                  label={SPECIES_LABEL[species]}
                  checked={profile.operations.species.includes(species)}
                  onChange={(e) =>
                    patch("operations", {
                      species: e.target.checked
                        ? [...profile.operations.species, species]
                        : profile.operations.species.filter(
                            (s) => s !== species,
                          ),
                    })
                  }
                />
              ))}
            </fieldset>

            <ListField
              id="serviceAreas"
              label="Área de atuação"
              hint="Cidades ou bairros onde vocês entregam animais, separe com vírgula."
              value={profile.operations.serviceAreas}
              onChange={(list) => patch("operations", { serviceAreas: list })}
            />

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold text-neutral-900">
                Processo de adoção
              </legend>
              <Checkbox
                id="homeVisit"
                label="Fazemos visita domiciliar antes da adoção"
                checked={profile.operations.homeVisit}
                onChange={(e) =>
                  patch("operations", { homeVisit: e.target.checked })
                }
              />
              <Checkbox
                id="requiresContract"
                label="Exigimos assinatura de termo de adoção"
                checked={profile.operations.requiresContract}
                onChange={(e) =>
                  patch("operations", { requiresContract: e.target.checked })
                }
              />
              <Checkbox
                id="chargesAdoptionFee"
                label="Cobramos taxa de adoção"
                checked={profile.operations.chargesAdoptionFee}
                onChange={(e) =>
                  patch("operations", {
                    chargesAdoptionFee: e.target.checked,
                    adoptionFee: e.target.checked
                      ? profile.operations.adoptionFee
                      : null,
                  })
                }
              />
            </fieldset>
            {profile.operations.chargesAdoptionFee ? (
              <Input
                id="adoptionFee"
                label="Valor da taxa (R$)"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={profile.operations.adoptionFee ?? ""}
                onChange={(e) =>
                  patch("operations", {
                    adoptionFee:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            ) : null}

            <Input
              id="contactHours"
              label="Horários de atendimento"
              placeholder="Seg a sex, 9h às 18h"
              value={profile.operations.contactHours}
              onChange={(e) =>
                patch("operations", { contactHours: e.target.value })
              }
            />
            <Select
              id="preferredContact"
              label="Forma de contato preferida"
              value={profile.operations.preferredContact}
              onChange={(e) =>
                patch("operations", {
                  preferredContact: e.target.value as PreferredContact,
                })
              }
              options={(
                Object.keys(PREFERRED_CONTACT_LABEL) as PreferredContact[]
              ).map((key) => ({
                value: key,
                label: PREFERRED_CONTACT_LABEL[key],
              }))}
            />

            <TeamEditor
              team={profile.operations.team}
              onChange={(team) => patch("operations", { team })}
            />
          </Section>
        </div>

        <div
          role="tabpanel"
          id="panel-group-conta"
          aria-labelledby="tab-group-conta"
          hidden={active !== "group-conta"}
          className="flex flex-col gap-4"
        >
          <div className="px-1">
            <h2 className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
              Conta e privacidade
            </h2>
            <p className="text-xs text-neutral-600">
              Acesso, termos e proteção de dados.
            </p>
          </div>

          <Section id="account" title="Conta" description="Acesso e sessão.">
            <Input
              id="accountEmail"
              label="E-mail de acesso"
              type="email"
              value={profile.representative.email}
              readOnly
              hint="Para trocar o e-mail da conta, edite o e-mail do responsável legal."
            />
            <LogoutButton variant="danger" size="lg" />
            <DeleteAccountButton isOng />
          </Section>

          {/* 6. Jurídico e LGPD ----------------------------------------------- */}
          <Section
            id="legalConsent"
            title={SECTION_LABEL.legalConsent}
            description="Aceites registrados com data, hora e IP."
          >
            <div
              className={cn(
                "rounded-2xl bg-accent-yellow px-4 py-3 text-xs text-neutral-900",
                shadowSoft.sm,
              )}
            >
              <p className="font-semibold text-neutral-900">
                Termos de uso aceitos
              </p>
              <p>
                Versão {profile.legalConsent.terms.version} ·{" "}
                {new Date(profile.legalConsent.terms.acceptedAt).toLocaleString(
                  "pt-BR",
                )}{" "}
                · IP {profile.legalConsent.terms.ip}
              </p>
              <TextLink href="/termos" target="_blank">
                Ler os termos
              </TextLink>
            </div>

            <FileInput
              id="adoptionTermTemplate"
              label="Modelo de termo de adoção da ONG"
              hint="Opcional. Um modelo padrão do Petfinder será oferecido no futuro."
              accept="application/pdf,.doc,.docx"
              value={profile.legalConsent.adoptionTermTemplate}
              onChange={(file) =>
                patch("legalConsent", { adoptionTermTemplate: file })
              }
            />

            <Checkbox
              id="adoptersDataConsent"
              checked={profile.legalConsent.adoptersDataConsent !== null}
              onChange={(e) =>
                patch("legalConsent", {
                  adoptersDataConsent: e.target.checked
                    ? {
                        version: TERMS_VERSION,
                        acceptedAt: new Date().toISOString(),
                        ip: "",
                        userAgent: "",
                      }
                    : null,
                })
              }
              label="Comprometo-me a tratar os dados dos adotantes recebidos pelo app apenas para fins de adoção, conforme a LGPD."
            />
            {profile.legalConsent.adoptersDataConsent?.ip ? (
              <p className="text-xs text-neutral-600">
                Registrado em{" "}
                {new Date(
                  profile.legalConsent.adoptersDataConsent.acceptedAt,
                ).toLocaleString("pt-BR")}{" "}
                · IP {profile.legalConsent.adoptersDataConsent.ip}
              </p>
            ) : null}
          </Section>
        </div>

        {/* Checklist ------------------------------------------------------- */}
        <Card className="gap-3">
          <CardTitle>Para publicar o primeiro pet</CardTitle>
          <ul className="flex flex-col gap-1.5">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                    item.done
                      ? "bg-primary text-neutral-900"
                      : "border border-stone-300 bg-white",
                  )}
                >
                  {item.done ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : null}
                </span>
                <a
                  href={`#${item.section}`}
                  onClick={(e) => {
                    e.preventDefault();
                    openSection(item.section);
                  }}
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
            {error ?? null}
          </FormError>
          {!error && savedAt ? (
            <p className="text-xs font-semibold text-lime-800">
              ✓ {status === "em_analise" ? "Enviado para análise" : "Salvo"} às{" "}
              {savedAt}.
            </p>
          ) : null}
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
                ENVIAR PARA ANÁLISE
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
  id: string;
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

/** Lista de textos editada como "a, b, c". Só propaga ao sair do campo. */
function ListField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string[];
  onChange: (list: string[]) => void;
}) {
  const [text, setText] = useState(value.join(", "));

  return (
    <Input
      id={id}
      label={label}
      hint={hint}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() =>
        onChange(
          text
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        )
      }
    />
  );
}

function TeamEditor({
  team,
  onChange,
}: {
  team: TeamMember[];
  onChange: (team: TeamMember[]) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<TeamRole[]>(["cadastra_pet"]);

  function add() {
    if (!name.trim() || !email.trim() || roles.length === 0) return;
    onChange([
      ...team,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        roles,
        invitedAt: new Date().toISOString(),
      },
    ]);
    setName("");
    setEmail("");
    setRoles(["cadastra_pet"]);
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold text-neutral-900">
        Equipe
      </legend>
      <p className="-mt-1 text-xs text-neutral-600">
        Outras pessoas que vão usar o app pela ONG. Por enquanto a equipe fica
        só anotada aqui. Em breve cada pessoa receberá um convite por e-mail.
      </p>

      {team.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {team.map((member) => (
            <li
              key={member.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl bg-primary-faint px-3 py-2 text-sm",
                shadowSoft.sm,
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-900">
                  {member.name}
                </p>
                <p className="truncate text-xs text-neutral-600">
                  {member.email} ·{" "}
                  {member.roles.map((r) => TEAM_ROLE_LABEL[r]).join(", ")}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                aria-label={`Remover ${member.name} da equipe`}
                onClick={() => onChange(team.filter((m) => m.id !== member.id))}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="teamName"
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          id="teamEmail"
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {(Object.keys(TEAM_ROLE_LABEL) as TeamRole[]).map((role) => (
          <Checkbox
            key={role}
            id={`teamRole-${role}`}
            label={TEAM_ROLE_LABEL[role]}
            checked={roles.includes(role)}
            onChange={(e) =>
              setRoles(
                e.target.checked
                  ? [...roles, role]
                  : roles.filter((r) => r !== role),
              )
            }
          />
        ))}
      </div>
      <Button variant="outline" size="sm" className="self-start" onClick={add}>
        <Plus className={iconSize.sm} aria-hidden="true" />
        Adicionar à equipe
      </Button>
    </fieldset>
  );
}
