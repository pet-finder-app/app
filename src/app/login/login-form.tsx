"use client";

import { Button, FormError, Input } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERROR_ID = "login-error";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        autoComplete="email"
        required
        placeholder="E-mail"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        invalid={Boolean(error)}
        errorId={ERROR_ID}
      />

      <Input
        tone="primary"
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
        placeholder="Senha"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        invalid={Boolean(error)}
        errorId={ERROR_ID}
      />

      <FormError id={ERROR_ID}>{error}</FormError>

      <Button
        type="submit"
        variant="dark"
        size="lg"
        className="mt-3"
        loading={isSubmitting}
        loadingLabel="ENTRANDO..."
      >
        ENTRAR
      </Button>
    </form>
  );
}
