"use client";

import { Button, FormError, Input, TextLink } from "@/components/ui";
import { iconSize } from "@/components/ui/icon";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERROR_ID = "login-error";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Não foi possível entrar.");
        return;
      }

      router.push("/");
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        tone="primary"
        id="email"
        label="E-mail"
        type="email"
        leading={<Mail className={iconSize.lg} />}
        autoComplete="email"
        required
        placeholder="voce@email.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        invalid={Boolean(error)}
        errorId={ERROR_ID}
      />

      <Input
        tone="primary"
        id="password"
        label="Senha"
        type={showPassword ? "text" : "password"}
        leading={<Lock className={iconSize.lg} />}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            className="grid size-9 place-items-center rounded-xl text-neutral-600 transition-colors hover:bg-primary-faint hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900"
          >
            {showPassword ? (
              <EyeOff className={iconSize.lg} aria-hidden="true" />
            ) : (
              <Eye className={iconSize.lg} aria-hidden="true" />
            )}
          </button>
        }
        autoComplete="current-password"
        required
        placeholder="Sua senha"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        invalid={Boolean(error)}
        errorId={ERROR_ID}
      />

      <TextLink
        href="/esqueci-senha"
        tone="primary-pastel"
        subtle
        className="-mt-1 self-end text-xs"
      >
        Esqueceu a senha?
      </TextLink>

      <FormError id={ERROR_ID} collapsible>
        {error}
      </FormError>

      <Button
        type="submit"
        variant="dark"
        size="lg"
        className="mt-2 shadow-lime-900/40"
        loading={isSubmitting}
        loadingLabel="ENTRANDO..."
      >
        ENTRAR
        <ArrowRight className={iconSize.lg} aria-hidden="true" />
      </Button>
    </form>
  );
}
