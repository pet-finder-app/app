"use client";

import { Button, FormError, iconSize, Input } from "@/components/ui";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERROR_ID = "register-error";

/** Qual campo o erro atual se refere a, quando o backend informa um. */
type ErrorField = "name" | "email" | "password" | "confirmPassword" | null;

type RegisterFormProps = {
  /** Volta para a etapa de escolha entre ONG e adotante. */
  onBack: () => void;
};

/** Cadastro do adotante. O da ONG fica em ong-register-form.tsx. */
export function RegisterForm({ onBack }: RegisterFormProps) {
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
        body: JSON.stringify({ role: "adopter", name, email, password }),
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
        variant="pill"
        size="sm"
        className="-mb-1 self-start"
        onClick={onBack}
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Trocar tipo de cadastro
      </Button>

      <Input
        tone="primary"
        id="name"
        label="Nome"
        type="text"
        autoComplete="name"
        required
        placeholder="Nome"
        value={name}
        onChange={(event) => setName(event.target.value)}
        invalid={errorField === "name"}
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

      <FormError id={ERROR_ID}>{error}</FormError>

      <Button
        type="submit"
        variant="secondary"
        size="lg"
        className="mt-3"
        loading={isSubmitting}
        loadingLabel="CRIANDO..."
      >
        CRIAR CONTA
      </Button>
    </form>
  );
}
