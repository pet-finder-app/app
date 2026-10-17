import { AppHeader } from "@/components/brand/app-header";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type PageShellProps = HTMLAttributes<HTMLElement> & {
  /** Maximum content width: sm for authentication, md for application pages, lg for long documents. */
  width?: "sm" | "md" | "lg";
  /** Reserve space for a fixed bottom ActionBar. */
  hasActionBar?: boolean;
  /** Show the fixed application header; defaults to pages with a bottom bar. */
  hasHeader?: boolean;
  /** Page background: white by default, or primary green. */
  background?: "neutral" | "primary";
  children: ReactNode;
};

const widths = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

/** Standard centered page shell with mobile gutters and a maximum width, including page headers. */
export function PageShell({
  width = "md",
  hasActionBar = false,
  hasHeader = hasActionBar,
  background = "neutral",
  className,
  children,
  ...props
}: PageShellProps) {
  return (
    <>
      {hasHeader ? <AppHeader /> : null}
      <main
        className={cn(
          "flex min-h-dvh flex-col px-4 py-6",
          background === "primary" ? "bg-primary" : "bg-white",
          hasActionBar && "pb-32",
          hasHeader && "pt-[calc(4.5rem+env(safe-area-inset-top))]",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col gap-4",
            widths[width],
          )}
        >
          {children}
        </div>
      </main>
    </>
  );
}

/** Fixed bottom form action bar aligned with PageShell and the device safe area. */
export function ActionBar({
  width = "md",
  className,
  children,
}: {
  width?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 border-t border-stone-300 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className={cn("mx-auto flex w-full flex-col gap-2", widths[width])}>
        {children}
      </div>
    </div>
  );
}
