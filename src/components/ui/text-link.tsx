import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { cn } from "./cn";
import type { FieldTone } from "./field";

export type TextLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  href: string;
  tone?: FieldTone;
};

const toneClass: Record<FieldTone, string> = {
  primary: "text-neutral-900 focus-visible:outline-neutral-900",
  light: "text-green-700 focus-visible:outline-primary",
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
