"use client";

import {
  Button,
  Checkbox,
  FormError,
  iconSize,
  Input,
  PasswordInput,
  Select,
  TextLink,
} from "@/components/ui";
import {
  DOCUMENT_LABEL,
  isValidDocument,
  maskDocument,
  onlyDigits,
} from "@/lib/br-documents";
import {
  isValidNickname,
  NGO_SIGNUP_TYPE_KEYS,
  normalizeNickname,
  ORGANIZATION_TYPES,
  type OrganizationType,
} from "@/lib/ngo";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERROR_ID = "ngo-register-error";

type ErrorField =
  | "organizationType"
  | "name"
  | "document"
  | "nickname"
  | "email"
  | "representativeName"
  | "acceptedRepresentation"
  | "password"
  | "confirmPassword"
  | "acceptedTerms"
  | null;

type NgoRegisterFormProps = {
  /** Return to account-type selection. */
  onBack: () => void;
};

/** Identify the organization and its representative. Administrative verification is required before publishing pets or coordinating adoptions. */
export function NgoRegisterForm({ onBack }: NgoRegisterFormProps) {
  const router = useRouter();
  const [organizationType, setOrganizationType] = useState<
    OrganizationType | ""
  >("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  // Suggest the nickname from the organization name until the user edits it.
  const [nicknameTouched, setNicknameTouched] = useState(false);
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [acceptedRepresentation, setAcceptedRepresentation] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<ErrorField>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const documentType = organizationType
    ? ORGANIZATION_TYPES[organizationType].documentType
    : null;

  function handleTypeChange(value: string) {
    const next = value as OrganizationType;
    // Changing the document type invalidates
    // the previously entered document number.
    if (
      organizationType &&
      ORGANIZATION_TYPES[organizationType].documentType !==
        ORGANIZATION_TYPES[next].documentType
    ) {
      setDocument("");
    }
    setOrganizationType(next);
  }

  function toNickname(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_@]/g, "")
      .slice(0, 24);
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!nicknameTouched) setNickname(toNickname(value));
  }

  function fail(message: string, field: ErrorField) {
    setError(message);
    setErrorField(field);
    // Move focus to the invalid field because the error summary is at the end of the form.
    requestAnimationFrame(() => {
      const target = field ? globalThis.document.getElementById(field) : null;
      target?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
      target?.focus({ preventScroll: true });
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrorField(null);

    if (!organizationType || !documentType) {
      return fail("Escolha o tipo de organização.", "organizationType");
    }
    if (!isValidDocument(documentType, document)) {
      return fail(
        `Informe um ${DOCUMENT_LABEL[documentType]} válido.`,
        "document",
      );
    }
    if (!isValidNickname(nickname)) {
      return fail(
        "O endereço do perfil precisa ter de 3 a 24 letras, números ou _ (sem espaços). Ex.: patinhas_felizes.",
        "nickname",
      );
    }
    if (password !== confirmPassword) {
      return fail("As senhas não conferem.", "confirmPassword");
    }
    if (!representativeName.trim()) {
      return fail(
        "Informe o nome completo do representante da organização.",
        "representativeName",
      );
    }
    if (!acceptedRepresentation) {
      return fail(
        "Confirme que você tem autorização para representar a organização.",
        "acceptedRepresentation",
      );
    }
    if (!acceptedTerms) {
      return fail(
        "É preciso aceitar os termos de uso para continuar.",
        "acceptedTerms",
      );
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "ngo",
          organizationType,
          name,
          nickname: normalizeNickname(nickname),
          document: onlyDigits(document),
          email,
          representativeName,
          acceptedRepresentation,
          password,
          acceptedTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        fail(
          data.message ?? "Não foi possível criar a conta.",
          data.field ?? null,
        );
        return;
      }

      router.push("/ngo/settings");
    } catch {
      fail("Falha de conexão. Tente de novo.", null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Button
        variant="photo-back"
        size="sm"
        className="-mb-1 self-start"
        onClick={onBack}
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Trocar tipo de cadastro
      </Button>

      <p className="text-sm text-neutral-900">
        Cadastre sua organização e identifique quem a representa. A equipe do
        Petfinder verificará os dados antes de liberar a publicação de animais e
        a coordenação de adoções.
      </p>

      <fieldset className="flex min-w-0 flex-col gap-4">
        <legend className="mb-4 text-base font-bold text-neutral-900">
          Dados da organização
        </legend>

        <Select
          tone="light"
          id="organizationType"
          label="Tipo de organização"
          required
          placeholder="Selecione..."
          value={organizationType}
          onChange={(event) => handleTypeChange(event.target.value)}
          options={NGO_SIGNUP_TYPE_KEYS.map((key) => ({
            value: key,
            label: ORGANIZATION_TYPES[key].label,
          }))}
          hint="Se você resgata ou acolhe animais como pessoa física, use o cadastro pessoal para buscar o apoio de uma ONG."
          invalid={errorField === "organizationType"}
          errorId={ERROR_ID}
        />

        <Input
          tone="light"
          id="name"
          label="Nome da organização"
          type="text"
          autoComplete="organization"
          required
          placeholder="Como vocês são conhecidos"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          invalid={errorField === "name"}
          errorId={ERROR_ID}
        />

        <Input
          tone="light"
          id="nickname"
          label="Nome de usuário da organização"
          type="text"
          autoComplete="off"
          required
          placeholder="ex.: patinhas_felizes"
          hint={
            normalizeNickname(nickname)
              ? `Seu perfil vai aparecer como @${normalizeNickname(nickname)}`
              : 'É o seu "@" no app. Só letras, números e _ (sem espaços). Ninguém mais pode usar o mesmo.'
          }
          value={nickname}
          onChange={(event) => {
            setNicknameTouched(true);
            setNickname(toNickname(event.target.value));
          }}
          invalid={errorField === "nickname"}
          errorId={ERROR_ID}
        />

        <Input
          tone="light"
          id="document"
          label="CNPJ da organização"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          disabled={!documentType}
          placeholder={
            documentType === "personalTaxId"
              ? "000.000.000-00"
              : documentType === "companyTaxId"
                ? "00.000.000/0000-00"
                : "Escolha o tipo de organização primeiro"
          }
          value={document}
          onChange={(event) =>
            setDocument(
              documentType
                ? maskDocument(documentType, event.target.value)
                : event.target.value,
            )
          }
          invalid={errorField === "document"}
          errorId={ERROR_ID}
        />
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-4">
        <legend className="mb-4 text-base font-bold text-neutral-900">
          Representante da organização
        </legend>

        <Input
          tone="light"
          id="representativeName"
          label="Nome completo do representante"
          type="text"
          autoComplete="name"
          required
          placeholder="Seu nome completo"
          value={representativeName}
          onChange={(event) => setRepresentativeName(event.target.value)}
          invalid={errorField === "representativeName"}
          errorId={ERROR_ID}
        />

        <Input
          tone="light"
          id="email"
          label="E-mail de acesso do representante"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@organizacao.org.br"
          hint="Use um e-mail ao qual você tenha acesso para entrar e recuperar a senha."
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          invalid={errorField === "email"}
          errorId={ERROR_ID}
        />
        <PasswordInput
          tone="light"
          id="password"
          label="Senha"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Senha"
          hint="Mínimo de 6 caracteres."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          invalid={errorField === "password"}
          errorId={ERROR_ID}
        />

        <PasswordInput
          tone="light"
          id="confirmPassword"
          label="Confirmar senha"
          autoComplete="new-password"
          required
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          invalid={errorField === "confirmPassword"}
          errorId={ERROR_ID}
        />
      </fieldset>

      <Checkbox
        tone="light"
        id="acceptedRepresentation"
        checked={acceptedRepresentation}
        onChange={(event) => setAcceptedRepresentation(event.target.checked)}
        invalid={errorField === "acceptedRepresentation"}
        errorId={ERROR_ID}
        label="Declaro que tenho autorização para representar esta organização."
      />

      <Checkbox
        tone="light"
        id="acceptedTerms"
        checked={acceptedTerms}
        onChange={(event) => setAcceptedTerms(event.target.checked)}
        invalid={errorField === "acceptedTerms"}
        errorId={ERROR_ID}
        label={
          <>
            Li e aceito os{" "}
            <TextLink href="/terms" target="_blank" tone="accent-underline">
              termos de uso e a política de privacidade
            </TextLink>
            .
          </>
        }
      />

      <FormError id={ERROR_ID} collapsible>
        {error}
      </FormError>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-3 border border-border-light"
        loading={isSubmitting}
        loadingLabel="CRIANDO..."
      >
        CADASTRAR ORGANIZAÇÃO
      </Button>

      <p className="text-center text-xs text-neutral-900">
        Na próxima etapa, complete os documentos da organização e do
        representante para solicitar a verificação. O cadastro não concede
        aprovação automática.
      </p>
    </form>
  );
}
