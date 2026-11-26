"use client";

import { useAuthEmailDraft } from "@/components/auth/auth-email-draft";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";
import styles from "@/components/auth/photo-auth-layout.module.css";
import { BottomSheet, FormError, LinkButton } from "@/components/ui";
import { apiMutations } from "@/lib/api/mutations";
import { useMutation } from "@tanstack/react-query";
import { CircleCheck, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERROR_ID = "password-recovery-error";

type PasswordRecoveryFormProps =
  { mode: "request" } | { mode: "reset"; token: string };

/** Request a reset link by e-mail, or set a new password from that link. */
export function PasswordRecoveryForm(props: PasswordRecoveryFormProps) {
  const router = useRouter();
  const [email, setEmail] = useAuthEmailDraft();
  const [password, setPassword] = useState("");
  const forgot = useMutation(apiMutations.forgotPassword());
  const reset = useMutation(apiMutations.resetPassword());
  const mutation = props.mode === "request" ? forgot : reset;
  const error = mutation.error?.message ?? null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (props.mode === "request") forgot.mutate({ email });
    else reset.mutate({ token: props.token, password });
  }

  // Request: dismissing allows sending another link. Reset: the token is
  // spent, so dismissing also leads to sign-in.
  function handleSuccessClose() {
    if (props.mode === "request") forgot.reset();
    else router.replace("/login");
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="recovery-value">
          {props.mode === "request" ? "E-mail" : "Nova senha"}
        </label>
        {props.mode === "request" ? (
          <input
            id="recovery-value"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? ERROR_ID : undefined}
          />
        ) : (
          <AuthPasswordInput
            id="recovery-value"
            name="new-password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={72}
            placeholder="Nova senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? ERROR_ID : undefined}
          />
        )}
      </div>
      <FormError id={ERROR_ID} collapsible>
        {error}
      </FormError>
      <button
        type="submit"
        className={styles.submit}
        disabled={mutation.isPending || mutation.isSuccess}
        aria-busy={mutation.isPending || undefined}
      >
        {props.mode === "request" ? "ENVIAR LINK" : "REDEFINIR SENHA"}
      </button>
      {mutation.isSuccess ? (
        <BottomSheet
          title={
            props.mode === "request"
              ? "Verifique seu e-mail"
              : "Senha redefinida"
          }
          align="center"
          onClose={handleSuccessClose}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            {props.mode === "request" ? (
              <MailCheck
                className="size-14 text-accent-tertiary"
                aria-hidden="true"
              />
            ) : (
              <CircleCheck
                className="size-14 text-accent-tertiary"
                aria-hidden="true"
              />
            )}
            <p role="status" className="text-sm leading-relaxed text-text">
              {props.mode === "request"
                ? "Se houver uma conta com este e-mail, enviamos um link para redefinir a senha. Ele vale por 30 minutos."
                : "Sua senha foi alterada. Por segurança, todas as sessões foram encerradas."}
            </p>
            <LinkButton href="/login" variant="primary" size="lg">
              ENTRAR
            </LinkButton>
          </div>
        </BottomSheet>
      ) : null}
    </form>
  );
}
