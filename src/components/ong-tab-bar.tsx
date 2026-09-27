"use client";

import { ActionBar, cn, iconSize } from "@/components/ui";
import { Heart, House, MessageCircle, PawPrint, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: typeof House;
  /** Preenche com `unreadCount`/`unreadMessageCount`, se houver. */
  hasFillWhenActive?: boolean;
};

const TABS: Tab[] = [
  { href: "/ong/dashboard", label: "Início", icon: House },
  {
    href: "/ong/notificacoes",
    label: "Notificações",
    icon: Heart,
    hasFillWhenActive: true,
  },
  { href: "/ong/pets", label: "Pets", icon: PawPrint },
  // Aba reservada: o chat com adotantes ainda não existe, só a navegação.
  { href: "/ong/mensagens", label: "Mensagens", icon: MessageCircle },
  { href: "/", label: "Perfil", icon: User },
];

type OngTabBarProps = {
  unreadCount?: number;
  unreadMessageCount?: number;
};

/** Navegação fixa do painel da ONG: início (dashboard com gráficos), perfil, notificações e mensagens. */
export function OngTabBar({
  unreadCount = 0,
  unreadMessageCount = 0,
}: OngTabBarProps) {
  const pathname = usePathname();

  const badgeCount: Record<string, number> = {
    "/ong/notificacoes": unreadCount,
    "/ong/mensagens": unreadMessageCount,
  };

  return (
    <ActionBar className="pt-2">
      <nav aria-label="Navegação principal" className="flex justify-around">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const badge = badgeCount[tab.href] ?? 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-bold",
                active
                  ? "text-primary-hover"
                  : "text-neutral-500 hover:text-neutral-800",
              )}
            >
              <Icon
                className={iconSize.lg}
                aria-hidden="true"
                fill={active && tab.hasFillWhenActive ? "currentColor" : "none"}
              />
              {badge > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 right-2 flex size-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[9px] font-bold text-white"
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
              {tab.label}
              {badge > 0 ? (
                <span className="sr-only">({badge} não lidas)</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </ActionBar>
  );
}
