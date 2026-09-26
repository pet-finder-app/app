"use client";

import { ActionBar, cn, iconSize } from "@/components/ui";
import { Heart, Home, User } from "lucide-react";
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
    href: "/adotante/notificacoes",
    label: "Notificações",
    icon: Heart,
    hasFillWhenActive: true,
  },
  { href: "/adotante/perfil", label: "Perfil", icon: User },
];

/** Navegação fixa do painel do adotante: feed de pets, notificações e perfil. */
export function AdopterTabBar() {
  const pathname = usePathname();

  return (
    <ActionBar className="pt-2">
      <nav aria-label="Navegação principal" className="flex justify-around">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
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
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </ActionBar>
  );
}
