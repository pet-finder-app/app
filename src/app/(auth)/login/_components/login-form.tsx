"use client";

import styles from "@/components/auth/photo-auth-layout.module.css";
import { FormError } from "@/components/ui";
import { iconSize } from "@/components/ui/icon";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
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
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? ERROR_ID : undefined}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Senha</label>
        <div className={styles.password}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? ERROR_ID : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            className={styles.passwordToggle}
          >
            {showPassword ? (
              <EyeOff className={iconSize.lg} aria-hidden="true" />
            ) : (
              <Eye className={iconSize.lg} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Link href="/forgot-password" className={styles.forgotPassword}>
        Esqueceu a senha?
      </Link>

      <FormError id={ERROR_ID} collapsible>
        {error}
      </FormError>

      <button
        type="submit"
        className={styles.submit}
        disabled={isSubmitting}
        aria-busy={isSubmitting || undefined}
      >
        {isSubmitting ? "ENTRANDO..." : "ENTRAR"}
      </button>
    </form>
  );
}
