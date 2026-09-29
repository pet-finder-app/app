import type { ReactNode } from "react";
import { PetfinderMark } from "./petfinder-mark";

type AuthLayoutProps = {
  /** Título da seção (ex.: "Entrar", "Criar conta"), lido por leitores de
   *  tela como <h2>; a marca "Petfinder" acima já é o <h1> da página. */
  heading: string;
  children: ReactNode;
  footer: ReactNode;
  /**
   * "vivid" (padrão, usada no cadastro): fundo no verde primário puro, com
   * o ícone acima do wordmark (PET escuro, FINDER. branco), sem textura.
   * "pastel" (só a tela de login, por pedido): fundo green-300, sem o
   * ícone no título — ele reaparece em verde escuro (tom sobre tom),
   * repetido e compacto, como marca d'água atrás do conteúdo, e de novo
   * em tamanho grande e sólido (lime-800) centralizado no espaço vazio
   * entre o título e o formulário, como ilustração principal da tela.
   * Wordmark todo escuro, porque o branco não teria contraste sobre um
   * fundo tão claro.
   */
  background?: "vivid" | "pastel";
};

/**
 * Formulário ancorado embaixo, marca no topo. Campos e links aqui usam
 * `tone="primary"`.
 */
export function AuthLayout({
  heading,
  children,
  footer,
  background = "vivid",
}: AuthLayoutProps) {
  const isPastel = background === "pastel";

  return (
    <main
      className={`relative isolate flex min-h-dvh flex-col px-4 pt-[8dvh] pb-8 ${
        isPastel ? "bg-green-300" : "bg-primary"
      }`}
    >
      {isPastel ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-45"
          style={{
            backgroundImage: "url('/logo-pattern.svg')",
            backgroundSize: "120px 120px",
            backgroundRepeat: "repeat",
          }}
        />
      ) : null}

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <h1
          aria-label="Petfinder"
          className="flex flex-col items-center gap-1.5 text-neutral-900"
        >
          {isPastel ? null : <PetfinderMark className="size-16" />}
          {isPastel ? (
            <span className="font-brand text-4xl leading-none">PETFINDER.</span>
          ) : (
            <span className="font-brand text-4xl leading-none">
              PET<span className="text-white">FINDER.</span>
            </span>
          )}
        </h1>

        {isPastel ? (
          <div
            aria-hidden="true"
            className="flex flex-1 items-center justify-center"
          >
            <PetfinderMark className="size-32 text-lime-800" />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <h2 className="sr-only">{heading}</h2>

        {children}

        <p className="mt-6 text-center text-xs font-semibold text-neutral-900">
          {footer}
        </p>
      </div>
    </main>
  );
}
