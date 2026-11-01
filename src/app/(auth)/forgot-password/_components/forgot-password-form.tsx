"use client";

import { Button, FormError, Input } from "@/components/ui";
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
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null) {
        setError("Não foi possível enviar. Tente de novo.");
        return;
      }
      if (!response.ok) {
        setError(
          "message" in data && typeof data.message === "string"
            ? data.message
            : "Não foi possível enviar.",
        );
        return;
      }
      setDevLink(
        "devLink" in data && typeof data.devLink === "string"
          ? data.devLink
          : null,
      );
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
        <p className="text-xl font-bold text-text-light">Confira seu e-mail</p>
        <p className="text-sm font-semibold text-text-light">
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
      <p className="text-xl font-bold text-text-light">Esqueceu a senha?</p>
      <p className="text-sm text-text-light">
        Informe o e-mail da sua conta e enviaremos um link para criar uma nova
        senha.
      </p>
      <Input
        tone="photo"
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
      <FormError id={ERROR_ID} collapsible>
        {error}
      </FormError>
      <Button
        type="submit"
        variant="photo"
        size="lg"
        loading={isSubmitting}
        loadingLabel="ENVIANDO..."
      >
        ENVIAR LINK
      </Button>
    </form>
  );
}
