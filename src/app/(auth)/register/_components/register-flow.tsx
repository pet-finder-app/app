"use client";

import type { AccountRole } from "@/lib/users";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NgoRegisterForm } from "./ngo-register-form";
import styles from "./register-flow.module.css";
import { RegisterForm } from "./register-form";
import { RoleSelect } from "./role-select";

/** Select personal or NGO signup. Each account type has its own form. */
export function RegisterFlow() {
  const [role, setRole] = useState<AccountRole | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  function finishClosing() {
    setRole(null);
    setIsClosing(false);
  }

  useEffect(() => {
    if (!isClosing) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function finishIfReduced() {
      if (reducedMotion.matches) {
        setRole(null);
        setIsClosing(false);
      }
    }

    finishIfReduced();
    reducedMotion.addEventListener("change", finishIfReduced);
    return () => reducedMotion.removeEventListener("change", finishIfReduced);
  }, [isClosing]);
  const footer = (
    <p className={styles.footer}>
      Já possui uma conta? <Link href="/login">Entre aqui.</Link>
    </p>
  );

  return (
    <>
      <div
        className={styles.choices}
        data-covered={Boolean(role)}
        inert={Boolean(role)}
        aria-hidden={role ? true : undefined}
      >
        <RoleSelect
          onSelect={setRole}
          disabled={Boolean(role)}
          headingId={role ? "registration-choices-heading" : "auth-heading"}
        />
        {footer}
      </div>
      {role ? (
        <>
          <button
            type="button"
            className={styles.dismiss}
            aria-label="Fechar formulário de cadastro"
            tabIndex={-1}
            disabled={isClosing}
            onClick={() => setIsClosing(true)}
          />
          <div
            className={styles.sheet}
            data-registration-form
            data-closing={isClosing}
            inert={isClosing}
            onAnimationEnd={(event) => {
              if (isClosing && event.target === event.currentTarget) {
                finishClosing();
              }
            }}
          >
            <div className={styles.inner}>
              <h2 id="auth-heading" className="sr-only">
                {role === "ngo" ? "Cadastro de ONG" : "Cadastro pessoal"}
              </h2>
              {role === "ngo" ? (
                <NgoRegisterForm onBack={() => setIsClosing(true)} />
              ) : (
                <RegisterForm onBack={() => setIsClosing(true)} />
              )}
              {footer}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
