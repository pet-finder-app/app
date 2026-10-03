"use client";

import { Button, FormError, Input } from "@/components/ui";
import { iconSize } from "@/components/ui/icon";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const ERROR_ID = "forgot-error";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        message?: string;
        devLink?: string;
      };
      if (!response.ok) {
        setError(data.message ?? "Não foi possível enviar.");
        return;
      }
      setDevLink(data.devLink ?? null);
      setSent(true);
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col gap-3 text-center">
        <p className="text-sm font-semibold text-neutral-900">
          Se esse e-mail estiver cadastrado, enviamos um link para criar uma
          nova senha. Ele vale por 30 minutos.
        </p>
        {devLink ? (
          <p className="rounded-2xl bg-accent-yellow p-3 text-xs text-neutral-900">
            Protótipo: sem envio de e-mail, o link aparece aqui.{" "}
            <Link href={devLink} className="font-bold underline">
              Criar nova senha
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-neutral-900">
        Informe o e-mail da sua conta e enviaremos um link para criar uma nova
        senha.
      </p>
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
      <FormError id={ERROR_ID} collapsible>
        {error}
      </FormError>
      <Button
        type="submit"
        variant="dark"
        size="lg"
        loading={isSubmitting}
        loadingLabel="ENVIANDO..."
      >
        ENVIAR LINK
      </Button>
    </form>
  );
}
