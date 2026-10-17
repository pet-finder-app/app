import type { HTMLAttributes } from "react";
import { cn } from ".";

/** Profile/dashboard card styling uses a thin dark border without the standard soft shadow. */
type BrutalCardProps = HTMLAttributes<HTMLElement> & {
  /** Semantic card element, such as section, header, or article. */
  as?: "section" | "header" | "article" | "div";
};

/** Card variant with a thin dark border. */
export function BrutalCard({
  as: Tag = "section",
  className,
  ...props
}: BrutalCardProps) {
  return (
    <Tag
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-neutral-900 bg-white p-5",
        className,
      )}
      {...props}
    />
  );
}
