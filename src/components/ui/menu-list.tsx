import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  useId,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "./cn";
import { iconSize } from "./icon";

export type MenuItemTone = "neutral" | "danger";

const itemClasses = (tone: MenuItemTone) =>
  cn(
    "flex min-h-14 w-full items-center gap-3 px-1 py-3 text-left font-medium transition-colors hover:bg-primary-faint focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-tertiary disabled:pointer-events-none disabled:opacity-60",
    tone === "danger" ? "text-red-700" : "text-text",
  );

const ROW_CLASS = "border-t border-border-light last:border-b";

export type MenuListProps = HTMLAttributes<HTMLUListElement> & {
  /** Visible heading above the rows; it names the list and replaces the first row's top line. */
  title?: string;
};

/** Flat list of navigation rows separated by thin lines, without elevation. */
export function MenuList({ title, className, ...props }: MenuListProps) {
  const headingId = useId();
  const list = (
    <ul
      aria-labelledby={title ? headingId : undefined}
      className={cn(
        "flex flex-col",
        title && "[&>li:first-child]:border-t-0",
        className,
      )}
      {...props}
    />
  );
  if (!title) return list;
  return (
    <section className="flex flex-col gap-1">
      <h2 id={headingId} className="text-lg font-bold">
        {title}
      </h2>
      {list}
    </section>
  );
}

export type MenuLinkProps = {
  href: string;
  icon: LucideIcon;
  tone?: MenuItemTone;
  children: ReactNode;
};

/** MenuList row that navigates. */
export function MenuLink({
  href,
  icon: Icon,
  tone = "neutral",
  children,
}: MenuLinkProps) {
  return (
    <li className={ROW_CLASS}>
      <Link href={href} className={itemClasses(tone)}>
        <Icon className={cn(iconSize.lg, "shrink-0")} aria-hidden="true" />
        {children}
      </Link>
    </li>
  );
}

export type MenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  tone?: MenuItemTone;
  /** Secondary line under the label, such as a status. */
  description?: ReactNode;
  /** Dialog or status opened by the row, kept inside the same list item. */
  dialog?: ReactNode;
};

/** MenuList row that runs an action, such as opening a sheet. */
export function MenuButton({
  icon: Icon,
  tone = "neutral",
  description,
  dialog,
  className,
  children,
  type = "button",
  ...props
}: MenuButtonProps) {
  return (
    <li className={ROW_CLASS}>
      <button
        type={type}
        className={cn(itemClasses(tone), className)}
        {...props}
      >
        <Icon className={cn(iconSize.lg, "shrink-0")} aria-hidden="true" />
        {description ? (
          <span className="flex min-w-0 flex-col">
            {children}
            <span className="text-sm font-normal text-neutral-600">
              {description}
            </span>
          </span>
        ) : (
          children
        )}
      </button>
      {dialog}
    </li>
  );
}
