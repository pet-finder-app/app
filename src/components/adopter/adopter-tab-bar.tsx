"use client";

import { ProfileTabIcon } from "@/components/account/profile-tab-icon";
import { useUnreadCounts } from "@/components/community/use-unread-counts";
import {
  NavigationTabLink,
  type NavigationTab,
} from "@/components/navigation/navigation-tab-link";
import { ActionBar } from "@/components/ui";
import { Bell, Heart, Home, MessagesSquare } from "lucide-react";
import { usePathname } from "next/navigation";

const TABS: NavigationTab[] = [
  { type: "icon", href: "/", label: "Início", icon: Home },
  {
    type: "icon",
    href: "/adopter/favorites",
    label: "Favoritos",
    icon: Heart,
  },
  {
    type: "icon",
    href: "/adopter/conversations",
    label: "Conversas",
    icon: MessagesSquare,
  },
  {
    type: "icon",
    href: "/adopter/notifications",
    label: "Avisos",
    icon: Bell,
  },
  {
    type: "component",
    href: "/me",
    label: "Perfil",
    component: ProfileTabIcon,
  },
];

/** Fixed adopter navigation for feed, favorites, conversations, notifications, and profile. */
export function AdopterTabBar() {
  const pathname = usePathname();
  const unread = useUnreadCounts();
  const badgeCount: Record<string, number> = {
    "/adopter/conversations": unread.messages,
    "/adopter/notifications": unread.notifications,
  };

  return (
    <ActionBar className="border-border-light! pt-1! pb-[calc(0.25rem+env(safe-area-inset-bottom))]! shadow-none!">
      <nav aria-label="Navegação principal" className="flex justify-around">
        {TABS.map((tab) => (
          <NavigationTabLink
            key={tab.href}
            tab={tab}
            pathname={pathname}
            avatarUrl={null}
            unreadCount={badgeCount[tab.href] ?? 0}
          />
        ))}
      </nav>
    </ActionBar>
  );
}
