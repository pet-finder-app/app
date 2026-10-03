import { PawIcon } from "@/components/paw-icon";
import { Card, cn, shadowSoft } from "@/components/ui";
import {
  countUnreadFor,
  formatChatTime,
  type ChatRole,
  type Conversation,
} from "@/lib/conversation";
import Link from "next/link";

type ConversationListProps = {
  conversations: Conversation[];
  role: ChatRole;
  /** Prefixo da rota da conversa, ex.: "/adotante/conversas". */
  basePath: string;
  /** Nome de quem está do outro lado, por conversa. */
  otherName: (conversation: Conversation) => string;
  emptyText: string;
};

/** Lista de conversas: nome do outro lado, pet, última mensagem, horário e não lidas. */
export function ConversationList({
  conversations,
  role,
  basePath,
  otherName,
  emptyText,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <Card className="items-center gap-2 text-center">
        <p className="text-sm text-neutral-600">{emptyText}</p>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {conversations.map((conversation) => {
        const unread = countUnreadFor(conversation, role);
        const last = conversation.messages.at(-1);
        const name = otherName(conversation);
        return (
          <li key={conversation.id}>
            <Link
              href={`${basePath}/${conversation.id}`}
              className={cn(
                "flex items-center gap-3 rounded-2xl bg-white p-3 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none",
                shadowSoft.md,
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft"
              >
                <PawIcon className="size-6 text-lime-800" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "truncate text-sm text-neutral-900",
                      unread > 0 ? "font-bold" : "font-semibold",
                    )}
                  >
                    {name}
                  </p>
                  {last ? (
                    <span className="shrink-0 text-xs text-neutral-600">
                      {formatChatTime(last.createdAt)}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-neutral-600">
                  {conversation.surrenderId ? "Entrega de" : "Sobre"}{" "}
                  {conversation.petName}
                </p>
                {last ? (
                  <p
                    className={cn(
                      "line-clamp-2 text-sm",
                      unread > 0
                        ? "font-bold text-neutral-900"
                        : "text-neutral-600",
                    )}
                  >
                    {last.text}
                  </p>
                ) : null}
              </div>
              {unread > 0 ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-700 text-xs font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                  <span className="sr-only"> mensagens novas</span>
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
