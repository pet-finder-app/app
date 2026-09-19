import type { ReactNode } from "react";

type AuthLayoutProps = {
  /** Título da seção (ex.: "Entrar", "Criar conta"), lido por leitores de
   *  tela como <h2>; a marca "Petfinder" acima já é o <h1> da página. */
  heading: string;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * A foto ocupa a tela inteira; um degradê escurece o topo e funde o rodapé
 * no preto, onde o formulário fica ancorado.
 */
export function AuthLayout({ heading, children, footer }: AuthLayoutProps) {
  return (
    <main
      className="relative flex min-h-dvh flex-col bg-neutral-800 bg-cover bg-center"
      style={{ backgroundImage: "url('/login-hero.jpg')" }}
    >
      {/* Foto decorativa: o conteúdo textual por cima já descreve a tela. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.2)_20%,rgba(0,0,0,0)_42%,rgba(0,0,0,0.8)_68%,#000_80%)]"
      />

      <div className="relative z-10 flex min-h-dvh flex-col px-7 pt-[12dvh] pb-8">
        <h1
          aria-label="Petfinder"
          className="text-center text-5xl tracking-tight text-white"
        >
          <span aria-hidden="true" className="font-extrabold text-brand">
            PET
          </span>
          <span aria-hidden="true" className="font-light italic">
            FINDER.
          </span>
        </h1>

        <div className="flex-1" />

        <h2 className="sr-only">{heading}</h2>

        {children}

        <p className="mt-6 text-center text-xs font-semibold text-white">
          {footer}
        </p>
      </div>
    </main>
  );
}
