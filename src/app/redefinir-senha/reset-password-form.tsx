"use client";

import { Button, FormError, Input, LinkButton } from "@/components/ui";
import { iconSize } from "@/components/ui/icon";
import { Lock } from "lucide-react";
import { useState, type FormEvent } from "react";

const ERROR_ID = "reset-error";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("As senhas não são iguais.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Não foi possível redefinir.");
        return;
      }
      setDone(true);
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-3 text-center">
        <p className="text-sm font-semibold text-neutral-900">
          Senha alterada! Já pode entrar com a nova senha.
        </p>
        <LinkButton href="/login" variant="dark" size="lg">
          IR PARA O LOGIN
        </LinkButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        tone="primary"
        id="password"
        label="Nova senha"
        type="password"
        leading={<Lock className={iconSize.lg} />}
        autoComplete="new-password"
        required
        hint="Pelo menos 6 caracteres."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        invalid={Boolean(error)}
        errorId={ERROR_ID}
      />
      <Input
        tone="primary"
        id="confirm"
        label="Repita a nova senha"
        type="password"
        leading={<Lock className={iconSize.lg} />}
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        invalid={Boolean(error)}
        errorId={ERROR_ID}
      />
      <FormError id={ERROR_ID} collapsible>
        {error}
      </FormError>
      <Button
        type="submit"
        variant="dark"
        size="lg"
        loading={isSubmitting}
        loadingLabel="SALVANDO..."
      >
        SALVAR NOVA SENHA
      </Button>
    </form>
  );
}
