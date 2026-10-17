"use client";

import { cn } from "@/components/ui";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentType, CSSProperties } from "react";
import styles from "./navigation-feedback.module.css";
import { NavigationTabIcon } from "./navigation-tab-icon";
import { usePressFeedback } from "./use-press-feedback";

type NavigationTabComponentProps = {
  active: boolean;
  avatarUrl: string | null;
};

export type NavigationTab = {
  href: `/${string}`;
  /** Visible label and accessible name for the navigation destination. */
  label: string;
} & (
  | { type: "icon"; icon: LucideIcon }
  | { type: "component"; component: ComponentType<NavigationTabComponentProps> }
);

type NavigationTabLinkProps = {
  tab: NavigationTab;
  pathname: string;
  avatarUrl: string | null;
  unreadCount?: number;
  style?: CSSProperties;
};

/** Shared navigation states, component rendering, and unread-message badges. */
export function NavigationTabLink({
  tab,
  pathname,
  avatarUrl,
  unreadCount = 0,
  style,
}: NavigationTabLinkProps) {
  const pressFeedback = usePressFeedback();
  const active =
    pathname === tab.href ||
    (tab.href !== "/" && pathname.startsWith(`${tab.href}/`));

  return (
    <Link
      {...pressFeedback}
      href={tab.href}
      aria-current={active ? "page" : undefined}
      aria-label={tab.type === "component" ? tab.label : undefined}
      style={style}
      className={cn(
        styles.pressTarget,
        "relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-0.5 text-[10px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-tertiary",
        active
          ? "text-accent-tertiary"
          : "text-neutral-600 hover:text-neutral-900",
      )}
    >
      <span className={styles.pressContent}>
        <NavigationTabContent tab={tab} active={active} avatarUrl={avatarUrl} />
      </span>
      {unreadCount > 0 ? (
        <>
          <span
            aria-hidden="true"
            className="absolute top-0 right-1 flex size-4 items-center justify-center rounded-full bg-red-700 text-[9px] font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
          <span className="sr-only"> ({unreadCount} não lidas)</span>
        </>
      ) : null}
    </Link>
  );
}

function NavigationTabContent({
  tab,
  active,
  avatarUrl,
}: NavigationTabComponentProps & { tab: NavigationTab }) {
  if (tab.type === "component") {
    const Component = tab.component;
    return (
      <>
        <Component active={active} avatarUrl={avatarUrl} />
        <span className="leading-3">{tab.label}</span>
      </>
    );
  }

  return (
    <>
      <NavigationTabIcon icon={tab.icon} active={active} />
      <span className="leading-3">{tab.label}</span>
    </>
  );
}
