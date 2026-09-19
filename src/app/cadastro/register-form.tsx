"use client";

import { SubmitButton } from "@/components/submit-button";
import { TextField } from "@/components/text-field";
import type { AccountRole } from "@/lib/users";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERROR_ID = "register-error";

/** Qual campo o erro atual se refere a, quando o backend informa um. */
type ErrorField = "name" | "email" | "password" | "confirmPassword" | null;

// O rótulo do nome muda conforme o tipo de conta; os demais campos, por
// enquanto, são os mesmos para os dois — o formulário específico da ONG
// (dados da instituição, etc.) ainda não existe.
const NAME_FIELD_LABEL: Record<AccountRole, string> = {
  adopter: "Nome",
  ong: "Nome da ONG",
};

type RegisterFormProps = {
  role: AccountRole;
  /** Volta para a etapa de escolha entre ONG e adotante. */
  onBack: () => void;
};

export function RegisterForm({ role, onBack }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<ErrorField>(null);
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

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, email, password }),
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
      <button
        type="button"
        onClick={onBack}
        className="-mb-1 self-start rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        ‹ Trocar tipo de cadastro
      </button>

      <TextField
        id="name"
        label={NAME_FIELD_LABEL[role]}
        type="text"
        autoComplete={role === "ong" ? "organization" : "name"}
        required
        placeholder={NAME_FIELD_LABEL[role]}
        value={name}
        onChange={(event) => setName(event.target.value)}
        invalid={errorField === "name"}
        errorId={ERROR_ID}
      />

      <TextField
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

      <TextField
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

      <TextField
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

      {/* Sempre montado: leitores de tela detectam a mudança de texto de
          forma mais confiável do que a inserção tardia de um novo nó. */}
      <p
        id={ERROR_ID}
        role="alert"
        className="min-h-5 text-sm font-semibold text-red-400"
      >
        {error}
      </p>

      <SubmitButton
        isSubmitting={isSubmitting}
        label="CRIAR CONTA"
        loadingLabel="CRIANDO..."
      />
    </form>
  );
}
