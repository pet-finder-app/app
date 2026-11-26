import { AdopterTabBar } from "@/components/adopter/adopter-tab-bar";
import { NotificationsButton } from "@/components/community/notifications-button";
import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { PageShell } from "@/components/ui";
import type { ReactNode } from "react";

type BackendShellProps = {
  title?: string;
  children: ReactNode;
  organization?: boolean;
  hasNavigation?: boolean;
  /** Keep the title for assistive technology only; tab bar pages already name themselves. */
  isTitleHidden?: boolean;
  /** Edge-to-edge content; children provide their own gutters. */
  isFullBleed?: boolean;
};
export function BackendShell({
  title,
  children,
  organization = false,
  hasNavigation = true,
  isTitleHidden = false,
  isFullBleed = false,
}: BackendShellProps) {
  return (
    <PageShell
      hasActionBar
      isFullBleed={isFullBleed}
      headerAction={
        hasNavigation ? (
          <NotificationsButton
            href={
              organization ? "/ngo/notifications" : "/adopter/notifications"
            }
          />
        ) : null
      }
    >
      {title ? (
        <h1
          className={
            isTitleHidden
              ? "sr-only"
              : isFullBleed
                ? "px-4 pt-6 text-2xl font-bold"
                : "text-2xl font-bold"
          }
        >
          {title}
        </h1>
      ) : null}
      {children}
      {hasNavigation ? organization ? <NgoTabBar /> : <AdopterTabBar /> : null}
    </PageShell>
  );
}
