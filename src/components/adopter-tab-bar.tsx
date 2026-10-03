"use client";

import { ActionBar, cn, iconSize } from "@/components/ui";
import { useAvisos } from "@/lib/use-avisos";
import { Heart, History, Home, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  hasFillWhenActive?: boolean;
};

const TABS: Tab[] = [
  { href: "/", label: "Início", icon: Home },
  {
    href: "/adotante/favoritos",
    label: "Favoritos",
    icon: Heart,
    hasFillWhenActive: true,
  },
  { href: "/adotante/conversas", label: "Conversas", icon: MessageCircle },
  { href: "/adotante/notificacoes", label: "Atividade", icon: History },
  { href: "/adotante/perfil", label: "Perfil", icon: User },
];

/** Navegação fixa do painel do adotante: feed de pets, favoritos, atividade e perfil. */
export function AdopterTabBar() {
  const pathname = usePathname();
  const { chats } = useAvisos();
  const badges: Record<string, number> = { "/adotante/conversas": chats };

  return (
    <ActionBar className="pt-2">
      <nav aria-label="Navegação principal" className="flex justify-around">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const badge = badges[tab.href] ?? 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-bold",
                active
                  ? "text-primary-hover"
                  : "text-neutral-600 hover:text-neutral-900",
              )}
            >
              <Icon
                className={iconSize.lg}
                aria-hidden="true"
                fill={active && tab.hasFillWhenActive ? "currentColor" : "none"}
              />
              {tab.label}
              {badge > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0 right-1 flex size-4 items-center justify-center rounded-full bg-red-700 text-[9px] font-bold text-white"
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
              {badge > 0 ? (
                <span className="sr-only"> ({badge} novas)</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </ActionBar>
  );
}
