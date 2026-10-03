"use client";

import {
  Button,
  Checkbox,
  FormError,
  iconSize,
  Input,
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
  normalizeNickname,
  ORGANIZATION_TYPE_KEYS,
  ORGANIZATION_TYPES,
  type OrganizationType,
} from "@/lib/ong";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERROR_ID = "ong-register-error";

type ErrorField =
  | "organizationType"
  | "name"
  | "document"
  | "nickname"
  | "email"
  | "password"
  | "confirmPassword"
  | "acceptedTerms"
  | null;

type OngRegisterFormProps = {
  /** Volta para a etapa de escolha entre ONG e adotante. */
  onBack: () => void;
};

/**
 * Cadastro curto da ONG: só o necessário para criar a conta e deixar a ONG
 * explorar o app. O restante (documentos, endereço, equipe...) é pedido em
 * /ong/configuracoes e só vira obrigatório na hora de publicar o primeiro pet.
 */
export function OngRegisterForm({ onBack }: OngRegisterFormProps) {
  const router = useRouter();
  const [organizationType, setOrganizationType] = useState<
    OrganizationType | ""
  >("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  // Enquanto a pessoa não mexer no endereço, ele é sugerido a partir do nome.
  const [nicknameTouched, setNicknameTouched] = useState(false);
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
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
    // Se o tipo de documento muda (CPF <-> CNPJ), o número digitado não
    // serve mais.
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
      .replace(/s+/g, "_")
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
    // O erro fica no fim do formulário: leva a pessoa até o campo com problema.
    requestAnimationFrame(() => {
      const target = field ? globalThis.document.getElementById(field) : null;
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
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
          role: "ong",
          organizationType,
          name,
          nickname: normalizeNickname(nickname),
          document: onlyDigits(document),
          email,
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

      router.push("/");
    } catch {
      fail("Falha de conexão. Tente de novo.", null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Button
        variant="pill"
        size="sm"
        className="-mb-1 self-start"
        onClick={onBack}
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Trocar tipo de cadastro
      </Button>

      <Select
        tone="primary"
        id="organizationType"
        label="Qual é o seu caso?"
        required
        placeholder="Selecione..."
        value={organizationType}
        onChange={(event) => handleTypeChange(event.target.value)}
        options={ORGANIZATION_TYPE_KEYS.map((key) => ({
          value: key,
          label: ORGANIZATION_TYPES[key].label,
        }))}
        hint={
          organizationType
            ? ORGANIZATION_TYPES[organizationType].description
            : 'Não tem CNPJ? Escolha "Protetor(a) independente": você também pode se cadastrar.'
        }
        invalid={errorField === "organizationType"}
        errorId={ERROR_ID}
      />

      <Input
        tone="primary"
        id="name"
        label="Nome da ONG"
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
        tone="primary"
        id="nickname"
        label="Endereço do seu perfil"
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
        tone="primary"
        id="document"
        label={documentType ? DOCUMENT_LABEL[documentType] : "CPF ou CNPJ"}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required
        disabled={!documentType}
        placeholder={
          documentType === "cpf"
            ? "000.000.000-00"
            : documentType === "cnpj"
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

      <Input
        tone="primary"
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        placeholder="E-mail"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        invalid={errorField === "email"}
        errorId={ERROR_ID}
      />

      <Input
        tone="primary"
        id="password"
        label="Senha"
        type="password"
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

      <Input
        tone="primary"
        id="confirmPassword"
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        required
        placeholder="Confirmar senha"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        invalid={errorField === "confirmPassword"}
        errorId={ERROR_ID}
      />

      <Checkbox
        tone="primary"
        id="acceptedTerms"
        checked={acceptedTerms}
        onChange={(event) => setAcceptedTerms(event.target.checked)}
        invalid={errorField === "acceptedTerms"}
        errorId={ERROR_ID}
        label={
          <>
            Li e aceito os{" "}
            <TextLink href="/termos" target="_blank" tone="primary">
              termos de uso e a política de privacidade
            </TextLink>
            .
          </>
        }
      />

      <FormError id={ERROR_ID}>{error}</FormError>

      <Button
        type="submit"
        variant="dark"
        size="lg"
        className="mt-3"
        loading={isSubmitting}
        loadingLabel="CRIANDO..."
      >
        CRIAR CONTA
      </Button>

      <p className="text-center text-xs text-neutral-900">
        Depois de criar a conta, você completa o cadastro (documentos e
        endereço) e nossa equipe aprova antes de você publicar pets e posts.
      </p>
    </form>
  );
}
