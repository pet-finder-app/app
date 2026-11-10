"use client";

import { ProfileTabIcon } from "@/components/account/profile-tab-icon";
import feedbackStyles from "@/components/navigation/navigation-feedback.module.css";
import {
  NavigationTabLink,
  type NavigationTab,
} from "@/components/navigation/navigation-tab-link";
import { usePressFeedback } from "@/components/navigation/use-press-feedback";
import { ActionBar, Button, cn, iconSize, LinkButton } from "@/components/ui";
import {
  Heart,
  House,
  MessageCircle,
  PawPrint,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef } from "react";

type NgoTab =
  | NavigationTab
  | { type: "action"; id: string; label: string; icon: LucideIcon };

const TABS: NgoTab[] = [
  { type: "icon", href: "/ngo/dashboard", label: "Início", icon: House },
  {
    type: "icon",
    href: "/ngo/adoptions",
    label: "Solicitações",
    icon: Heart,
  },
  {
    type: "action",
    id: "create",
    label: "Criar: cadastrar pet ou novo post",
    icon: Plus,
  },
  // Reserved navigation tab for future adopter chat support.
  {
    type: "icon",
    href: "/ngo/messages",
    label: "Mensagens",
    icon: MessageCircle,
  },
  {
    type: "component",
    href: "/me",
    label: "Perfil",
    component: ProfileTabIcon,
  },
];

/** Position icons along a parabolic arc with the center icon highest. */
const dip = (index: number) =>
  Math.round(1.2 * (index - (TABS.length - 1) / 2) ** 2);

type NgoTabBarProps = {
  unreadCount?: number;
  unreadMessageCount?: number;
};

/** Fixed NGO navigation for dashboard, profile, notifications, and messages. */
export function NgoTabBar({
  unreadCount = 0,
  unreadMessageCount = 0,
}: NgoTabBarProps) {
  const pathname = usePathname();
  const createDialog = useRef<HTMLDialogElement>(null);
  const createPressFeedback = usePressFeedback();

  const badgeCount: Record<string, number> = {
    "/ngo/notifications": unreadCount,
    "/ngo/messages": unreadMessageCount,
  };

  return (
    <ActionBar className="border-0! bg-transparent! pt-3 pb-[calc(0.25rem+env(safe-area-inset-bottom))]! shadow-none!">
      {/* The bar background follows the arc of the navigation icons. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 -z-10 size-full"
      >
        <path
          d="M0 100 L0 14 Q50 -14 100 14 L100 100 Z"
          className="fill-white"
        />
        <path
          d="M0 14 Q50 -14 100 14"
          className="fill-none stroke-border-light"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <nav aria-label="Navegação principal" className="flex items-start pb-1">
        {TABS.map((tab, index) => {
          const style = { transform: `translateY(${dip(index)}px)` };

          if (tab.type === "action") {
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                style={style}
                className="flex flex-1 items-center justify-center"
              >
                <button
                  {...createPressFeedback}
                  type="button"
                  aria-label={tab.label}
                  aria-haspopup="dialog"
                  onClick={() => createDialog.current?.showModal()}
                  className={cn(
                    feedbackStyles.pressTarget,
                    "flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                  )}
                >
                  <span className={feedbackStyles.pressContent}>
                    <Icon
                      className={iconSize.lg}
                      strokeWidth={2.75}
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </div>
            );
          }
          return (
            <NavigationTabLink
              key={tab.href}
              tab={tab}
              pathname={pathname}
              avatarUrl={null}
              unreadCount={badgeCount[tab.href] ?? 0}
              style={style}
            />
          );
        })}
      </nav>

      <dialog
        ref={createDialog}
        aria-labelledby="create-dialog-title"
        onClick={(event) => {
          // Click the backdrop to close.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-white p-5 text-neutral-900 shadow-xl backdrop:bg-neutral-900/50"
      >
        <h2 id="create-dialog-title" className="mb-3 text-base font-bold">
          O que você quer fazer?
        </h2>
        <div className="flex flex-col gap-2">
          <LinkButton
            href="/ngo/pets/new"
            size="lg"
            onClick={() => createDialog.current?.close()}
          >
            <PawPrint className={iconSize.md} aria-hidden="true" />
            Cadastrar pet
          </LinkButton>
          <Button
            variant="pill"
            size="md"
            className="self-center"
            onClick={() => createDialog.current?.close()}
          >
            Cancelar
          </Button>
        </div>
      </dialog>
    </ActionBar>
  );
}
