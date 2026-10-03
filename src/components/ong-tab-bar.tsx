"use client";

import { ActionBar, Button, cn, iconSize, LinkButton } from "@/components/ui";
import { useAvisos } from "@/lib/use-avisos";
import {
  Heart,
  House,
  Images,
  MessageCircle,
  PawPrint,
  Plus,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

type Tab = {
  href: string;
  label: string;
  icon: typeof House;
  /** Preenche com `unreadCount`/`unreadMessageCount`, se houver. */
  hasFillWhenActive?: boolean;
  /** Botão de ação central (criar), em destaque e sem rótulo visível. */
  isCreate?: boolean;
};

const TABS: Tab[] = [
  { href: "/ong/dashboard", label: "Início", icon: House },
  {
    href: "/ong/notificacoes",
    label: "Notificações",
    icon: Heart,
    hasFillWhenActive: true,
  },
  { href: "/ong/posts/novo", label: "Novo post", icon: Plus, isCreate: true },
  // Aba reservada: o chat com adotantes ainda não existe, só a navegação.
  { href: "/ong/mensagens", label: "Mensagens", icon: MessageCircle },
  { href: "/", label: "Perfil", icon: User },
];

/** Desce cada ícone em parábola: o meio fica no alto e as pontas curvam para baixo (arco). */
const dip = (index: number) =>
  Math.round(2.4 * (index - (TABS.length - 1) / 2) ** 2);

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
  const createDialog = useRef<HTMLDialogElement>(null);

  const { chats } = useAvisos();
  const badgeCount: Record<string, number> = {
    "/ong/notificacoes": unreadCount,
    "/ong/mensagens": Math.max(unreadMessageCount, chats),
  };

  return (
    <ActionBar className="border-0! bg-transparent! pt-8 shadow-none!">
      {/* Fundo em arco: o topo da barra acompanha a curva dos ícones. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 -z-10 size-full drop-shadow-[0_-4px_8px_rgba(15,23,42,0.08)]"
      >
        <path
          d="M0 100 L0 14 Q50 -14 100 14 L100 100 Z"
          className="fill-white"
        />
        <path
          d="M0 14 Q50 -14 100 14"
          className="fill-none stroke-stone-300"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <nav aria-label="Navegação principal" className="flex items-start pb-4">
        {TABS.map((tab, index) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const badge = badgeCount[tab.href] ?? 0;

          if (tab.isCreate) {
            return (
              <div
                key={tab.href}
                style={{ transform: `translateY(${dip(index)}px)` }}
                className="flex flex-1 items-center justify-center"
              >
                <button
                  type="button"
                  aria-label="Criar: cadastrar pet ou novo post"
                  aria-haspopup="dialog"
                  onClick={() => createDialog.current?.showModal()}
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Icon
                    className={iconSize.lg}
                    strokeWidth={2.75}
                    aria-hidden="true"
                  />
                </button>
              </div>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              style={{ transform: `translateY(${dip(index)}px)` }}
              className={cn(
                "relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-bold",
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
              {badge > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 right-2 flex size-4 items-center justify-center rounded-full border-2 border-white bg-red-700 text-[9px] font-bold text-white"
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

      <dialog
        ref={createDialog}
        aria-labelledby="create-dialog-title"
        onClick={(event) => {
          // Toque no fundo escurecido fecha.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-white p-5 text-neutral-900 shadow-xl backdrop:bg-neutral-900/50"
      >
        <h2 id="create-dialog-title" className="mb-3 text-base font-bold">
          O que você quer fazer?
        </h2>
        <div className="flex flex-col gap-2">
          <LinkButton
            href="/ong/pets/novo"
            size="lg"
            onClick={() => createDialog.current?.close()}
          >
            <PawPrint className={iconSize.md} aria-hidden="true" />
            Cadastrar pet
          </LinkButton>
          <LinkButton
            href="/ong/posts/novo"
            variant="outline"
            size="lg"
            onClick={() => createDialog.current?.close()}
          >
            <Images className={iconSize.md} aria-hidden="true" />
            Novo post
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
