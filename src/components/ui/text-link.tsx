import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { cn } from "./cn";
import type { FieldTone } from "./field";

export type TextLinkTone = FieldTone | "primary-pastel";

export type TextLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  href: string;
  tone?: TextLinkTone;
};

const toneClass: Record<TextLinkTone, string> = {
  primary: "text-neutral-900 focus-visible:outline-neutral-900",
  /** Só para o fundo "pastel" do AuthLayout (login): verde escuro o
   *  bastante para 4.5:1 sobre green-300, dando destaque de cor que o
   *  neutral-900 escuro (igual ao resto do texto) não dava. Sobre o
   *  fundo "vivid" (green-500) esse mesmo tom não teria contraste
   *  suficiente — por isso é uma tonalidade separada, não o "primary". */
  "primary-pastel": "text-green-900 focus-visible:outline-green-900",
  light: "text-green-700 focus-visible:outline-primary",
  brutal: "text-neutral-900 focus-visible:outline-neutral-900",
};

/** Link inline, sublinhado, com foco visível. */
export function TextLink({
  href,
  tone = "light",
  className,
  ...props
}: TextLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-bold underline decoration-2 underline-offset-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
