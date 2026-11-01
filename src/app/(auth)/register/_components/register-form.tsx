"use client";

import {
  Button,
  Checkbox,
  FormError,
  iconSize,
  Input,
  PasswordInput,
  TextLink,
} from "@/components/ui";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERROR_ID = "register-error";

/** Field associated with a server validation error, when provided. */
type ErrorField =
  "name" | "email" | "password" | "confirmPassword" | "acceptedTerms" | null;

type RegisterFormProps = {
  /** Return to account-type selection. */
  onBack: () => void;
};

/** Personal accounts support adoption and requests for NGO assistance. */
export function RegisterForm({ onBack }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<ErrorField>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrorField(null);

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      setErrorField("confirmPassword");
      return;
    }

    if (!acceptedTerms) {
      setError("É preciso aceitar os termos de uso para continuar.");
      setErrorField("acceptedTerms");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "adopter",
          name,
          email,
          password,
          acceptedTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Não foi possível criar a conta.");
        setErrorField(data.field ?? null);
        return;
      }

      router.push("/");
    } catch {
      setError("Falha de conexão. Tente de novo.");
      setErrorField(null);
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
        Com sua conta pessoal, você pode adotar ou encaminhar um animal a uma
        ONG. A ONG responsável acompanha todo o processo.
      </p>

      <Input
        tone="light"
        id="name"
        label="Nome completo"
        type="text"
        autoComplete="name"
        required
        placeholder="Seu nome completo"
        value={name}
        onChange={(event) => setName(event.target.value)}
        invalid={errorField === "name"}
        errorId={ERROR_ID}
      />

      <Input
        tone="light"
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
        CRIAR CONTA
      </Button>
    </form>
  );
}
