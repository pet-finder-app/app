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
  /** Só para o fundo "pastel" do AuthLayout (login). Hoje igual ao
   *  "primary": a paleta do projeto não tem verde escuro com 4.5:1 sobre
   *  o fundo pastel, então o destaque vem do sublinhado. */
  "primary-pastel": "text-neutral-900 focus-visible:outline-neutral-900",
  light: "text-neutral-900 focus-visible:outline-primary",
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
