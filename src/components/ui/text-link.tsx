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
  /** Link secundário: peso normal e sublinhado fino. */
  subtle?: boolean;
};

const toneClass: Record<TextLinkTone, string> = {
  primary: "text-neutral-900 focus-visible:outline-neutral-900",
  /** Só para o fundo "pastel" do AuthLayout (login): lime-800, o verde
   *  escuro da paleta, dá 4.5:1 sobre o pastel. */
  "primary-pastel": "text-lime-800 focus-visible:outline-lime-800",
  light: "text-lime-800 focus-visible:outline-primary",
  brutal: "text-neutral-900 focus-visible:outline-neutral-900",
};

/** Link inline, sublinhado, com foco visível. */
export function TextLink({
  href,
  tone = "light",
  subtle,
  className,
  ...props
}: TextLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        subtle
          ? "font-medium underline decoration-1 underline-offset-2"
          : "font-bold underline decoration-2 underline-offset-2",
        "focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
