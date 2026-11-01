import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./photo-auth-layout.module.css";

export function PhotoAuthLayout({
  children,
  registration = false,
  heading = "Entrar",
  footer,
}: {
  children: ReactNode;
  registration?: boolean;
  heading?: string;
  footer?: ReactNode;
}) {
  return (
    <main
      className={`${styles.screen} ${registration ? styles.registration : ""}`}
    >
      <div className={styles.content}>
        <h1 className={styles.wordmark} aria-label="Petfinder">
          <span className={styles.pet}>PET</span>
          <span className={styles.finder}>FINDER.</span>
        </h1>
        <section className={styles.signIn} aria-labelledby="auth-heading">
          {registration ? null : (
            <h2 id="auth-heading" className="sr-only">
              {heading}
            </h2>
          )}
          {children}
          {registration ? null : (
            <p className={styles.register}>
              {footer === undefined ? (
                <>
                  Não possui uma conta?{" "}
                  <Link href="/register">
                    <strong>Crie uma aqui.</strong>
                  </Link>
                </>
              ) : (
                footer
              )}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
