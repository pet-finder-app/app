import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { cn } from "./cn";
import type { FieldTone } from "./field";

export type TextLinkTone = FieldTone | "primary-pastel" | "accent-underline";

export type TextLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  href: string;
  tone?: TextLinkTone;
  /** Secondary link with regular weight and a thin underline. */
  subtle?: boolean;
};

const toneClass: Record<TextLinkTone, string> = {
  "accent-underline":
    "text-text decoration-accent focus-visible:outline-accent",
  photo: "text-primary focus-visible:outline-primary",
  primary: "text-neutral-900 focus-visible:outline-neutral-900",
  /** Dark-green link tone for sufficient contrast on pastel authentication backgrounds. */
  "primary-pastel": "text-lime-800 focus-visible:outline-lime-800",
  light: "text-lime-800 focus-visible:outline-primary",
  brutal: "text-neutral-900 focus-visible:outline-neutral-900",
};

/** Inline underlined link with a visible focus indicator. */
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
