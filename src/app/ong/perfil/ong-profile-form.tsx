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
import { pressBrutal, shadowBrutal } from "@/components/ui/brutal";
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
  SECTION_KEYS,
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
import { Check, ChevronLeft, Plus } from "lucide-react";
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

type OngProfileFormProps = {
  initialProfile: OngProfile;
};

/**
 * Área de "completar cadastro" da ONG: as seis camadas do modelo, cada uma
 * em um cartão. Um único botão salva tudo; "Enviar para análise" aparece
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

  const sectionDone = (section: OngProfileSection) =>
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
            {profile.legal.tradeName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-700">
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
                "rounded-lg border-2 border-line bg-accent-peach px-3 py-2 text-sm text-neutral-900",
                shadowBrutal.sm,
              )}
            >
              {profile.verification.statusNote}
            </p>
          ) : null}

          {/* Navegação entre seções, com o estado do checklist */}
          <nav
            aria-label="Seções do cadastro"
            className="mt-1 flex flex-wrap gap-2"
          >
            {SECTION_KEYS.map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className={cn(
                  "inline-flex min-h-7 items-center gap-1 rounded-full border-2 border-line px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  sectionDone(key)
                    ? "bg-primary-soft text-green-900"
                    : "bg-white text-neutral-800 hover:bg-primary-faint",
                  shadowBrutal.sm,
                  pressBrutal.sm,
                )}
              >
                {sectionDone(key) ? (
                  <Check className={iconSize.sm} aria-hidden="true" />
                ) : null}
                {SECTION_LABEL[key]}
                {sectionDone(key) ? (
                  <span className="sr-only"> (concluída)</span>
                ) : null}
              </a>
            ))}
          </nav>
        </Card>

        {/* 1. Identificação jurídica ---------------------------------------- */}
        <Section
          id="legal"
          title={SECTION_LABEL.legal}
          description="Quem é a organização, juridicamente."
        >
          <Input
            id="tradeName"
            label="Nome fantasia"
            value={profile.legal.tradeName}
            onChange={(e) => patch("legal", { tradeName: e.target.value })}
            required
          />
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

          <p className="mt-2 text-sm font-bold text-neutral-800">
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
              label="UF"
              placeholder="UF"
              value={profile.legal.address.state}
              onChange={(e) =>
                patch("legal", {
                  address: { ...profile.legal.address, state: e.target.value },
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
                  address: { ...profile.legal.address, street: e.target.value },
                })
              }
            />
            <Input
              id="number"
              label="Número"
              value={profile.legal.address.number}
              onChange={(e) =>
                patch("legal", {
                  address: { ...profile.legal.address, number: e.target.value },
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
            label="Cargo"
            placeholder="Presidente, tesoureira, fundador..."
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
            onChange={(e) => patch("representative", { email: e.target.value })}
            hint={
              profile.representative.emailVerifiedAt
                ? "E-mail confirmado."
                : "A confirmação por código será enviada quando o backend estiver pronto."
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
              hint="Nome ou contato de ONGs que conhecem seu trabalho, separados por vírgula."
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
            <legend className="mb-1 text-sm font-semibold text-neutral-800">
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
                      : profile.operations.species.filter((s) => s !== species),
                  })
                }
              />
            ))}
          </fieldset>

          <ListField
            id="serviceAreas"
            label="Área de atuação"
            hint="Cidades ou bairros onde vocês entregam animais, separados por vírgula."
            value={profile.operations.serviceAreas}
            onChange={(list) => patch("operations", { serviceAreas: list })}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-neutral-800">
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

        {/* 5. Perfil público ------------------------------------------------ */}
        <Section
          id="publicProfile"
          title={SECTION_LABEL.publicProfile}
          description="O que o adotante vê."
        >
          <FileInput
            id="logo"
            label="Logo"
            accept="image/*"
            value={profile.publicProfile.logo}
            onChange={(file) => patch("publicProfile", { logo: file })}
          />
          <Textarea
            id="description"
            label="Descrição / missão"
            placeholder="Conte quem vocês são e como trabalham."
            value={profile.publicProfile.description}
            onChange={(e) =>
              patch("publicProfile", { description: e.target.value })
            }
          />
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

          <p className="mt-2 text-sm font-bold text-neutral-800">Doações</p>
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
            hint="Ração, areia, medicamentos... separados por vírgula."
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

        {/* 6. Jurídico e LGPD ----------------------------------------------- */}
        <Section
          id="legalConsent"
          title={SECTION_LABEL.legalConsent}
          description="Aceites registrados com data, hora e IP."
        >
          <div
            className={cn(
              "rounded-lg border-2 border-line bg-accent-yellow px-4 py-3 text-xs text-neutral-800",
              shadowBrutal.sm,
            )}
          >
            <p className="font-semibold text-neutral-800">
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
            <p className="text-xs text-neutral-500">
              Registrado em{" "}
              {new Date(
                profile.legalConsent.adoptersDataConsent.acceptedAt,
              ).toLocaleString("pt-BR")}{" "}
              · IP {profile.legalConsent.adoptersDataConsent.ip}
            </p>
          ) : null}
        </Section>

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
                      : "border-2 border-line bg-white",
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
                      ? "text-neutral-500 line-through"
                      : "text-neutral-800"
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
                <span className="text-neutral-500">Salvo às {savedAt}.</span>
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
  id: OngProfileSection;
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
      <legend className="mb-1 text-sm font-semibold text-neutral-800">
        Equipe
      </legend>
      <p className="-mt-1 text-xs text-neutral-500">
        Outras pessoas que vão usar o app pela ONG. O convite por e-mail chega
        com o backend.
      </p>

      {team.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {team.map((member) => (
            <li
              key={member.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border-2 border-line bg-primary-faint px-3 py-2 text-sm",
                shadowBrutal.sm,
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-900">
                  {member.name}
                </p>
                <p className="truncate text-xs text-neutral-500">
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
