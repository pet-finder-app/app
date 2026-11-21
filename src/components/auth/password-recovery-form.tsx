"use client";

import styles from "@/components/auth/photo-auth-layout.module.css";
import { FormError } from "@/components/ui";
import { apiMutations } from "@/lib/api/mutations";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const ERROR_ID = "password-recovery-error";

type PasswordRecoveryFormProps =
  { mode: "request" } | { mode: "reset"; token: string };

/** Request a reset link by e-mail, or set a new password from that link. */
export function PasswordRecoveryForm(props: PasswordRecoveryFormProps) {
  const [value, setValue] = useState("");
  const forgot = useMutation(apiMutations.forgotPassword());
  const reset = useMutation(apiMutations.resetPassword());
  const mutation = props.mode === "request" ? forgot : reset;
  const error = mutation.error?.message ?? null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (props.mode === "request") forgot.mutate({ email: value });
    else reset.mutate({ token: props.token, password: value });
  }

  if (mutation.isSuccess)
    return (
      <div className={styles.form}>
        <p role="status" className="text-text-light">
          {props.mode === "request"
            ? "Se houver uma conta com este e-mail, enviamos um link para redefinir a senha. Ele vale por 30 minutos."
            : "Senha redefinida. Por segurança, todas as sessões foram encerradas."}
        </p>
        <Link href="/login" className="text-text-light underline">
          Entrar
        </Link>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="recovery-value">
          {props.mode === "request" ? "E-mail" : "Nova senha"}
        </label>
        <input
          id="recovery-value"
          name={props.mode === "request" ? "email" : "new-password"}
          type={props.mode === "request" ? "email" : "password"}
          autoComplete={props.mode === "request" ? "email" : "new-password"}
          required
          minLength={props.mode === "request" ? undefined : 12}
          maxLength={props.mode === "request" ? 254 : 72}
          placeholder={props.mode === "request" ? "E-mail" : "Nova senha"}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? ERROR_ID : undefined}
        />
      </div>
      <FormError id={ERROR_ID} collapsible>
        {error}
      </FormError>
      <button
        type="submit"
        className={styles.submit}
        disabled={mutation.isPending}
        aria-busy={mutation.isPending || undefined}
      >
        {props.mode === "request" ? "ENVIAR LINK" : "REDEFINIR SENHA"}
      </button>
      <Link href="/login" className="text-text-light underline">
        Voltar para entrar
      </Link>
    </form>
  );
}
