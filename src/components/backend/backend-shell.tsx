import { AdopterTabBar } from "@/components/adopter/adopter-tab-bar";
import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { PageShell } from "@/components/ui";
import type { ReactNode } from "react";

type BackendShellProps = {
  title?: string;
  children: ReactNode;
  organization?: boolean;
  hasNavigation?: boolean;
};
export function BackendShell({
  title,
  children,
  organization = false,
  hasNavigation = true,
}: BackendShellProps) {
  return (
    <PageShell hasActionBar>
      {title ? <h1 className="text-2xl font-bold">{title}</h1> : null}
      {children}
      {hasNavigation ? organization ? <NgoTabBar /> : <AdopterTabBar /> : null}
    </PageShell>
  );
}
