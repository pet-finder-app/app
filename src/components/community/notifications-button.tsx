"use client";

import { useUnreadCounts } from "@/components/community/use-unread-counts";
import { NavigationTabIcon } from "@/components/navigation/navigation-tab-icon";
import { cn } from "@/components/ui";
import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NotificationsButtonProps = {
  /** Notifications list for the current context (adopter or NGO). */
  href: "/adopter/notifications" | "/ngo/notifications";
};

/** Header bell linking to notifications, with Go's unread total as a badge. */
export function NotificationsButton({ href }: NotificationsButtonProps) {
  const pathname = usePathname();
  const { notifications } = useUnreadCounts();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent-tertiary",
        isActive
          ? "text-accent-tertiary"
          : "text-neutral-600 hover:text-neutral-900",
      )}
    >
      <NavigationTabIcon icon={Bell} active={isActive} />
      <span className="sr-only">
        Avisos
        {notifications > 0 ? ` (${notifications} não lidos)` : ""}
      </span>
      {notifications > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-red-700 text-[9px] font-bold text-white"
        >
          {notifications > 9 ? "9+" : notifications}
        </span>
      ) : null}
    </Link>
  );
}
