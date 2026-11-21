"use client";
import { ActionBar, Button, FormError, Input, cn } from "@/components/ui";
import { communityMutations } from "@/lib/api/community";
import { apiMutations, sendMessageRequest } from "@/lib/api/mutations";
import { messageHistoryOptions } from "@/lib/api/queries";
import {
  addMessageToHistory,
  useChatSocket,
  type ChatSendResult,
} from "@/lib/api/use-chat-socket";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { formatDate } from "./labels";
import { QueryStatus } from "./query-status";

/** Wait for bursts of real-time messages before advancing the read cursor. */
const READ_DEBOUNCE_MS = 1_000;

const CONNECTION_LABELS = {
  connecting: "Conectando…",
  open: "Conectado em tempo real",
  offline: "Sem conexão em tempo real; atualizando periodicamente.",
} as const;

type ChatThreadProps = { id: string; userId: string };
export function ChatThread({ id, userId }: ChatThreadProps) {
  const client = useQueryClient();
  const socket = useChatSocket(id);
  const query = useInfiniteQuery(
    messageHistoryOptions(id, socket.status === "open"),
  );
  const scrollSnapshot = useRef<{ height: number; top: number } | null>(null);
  const newestMessage = useRef<string | null>(null);
  const shouldScrollToEnd = useRef(false);
  const mutation = useMutation({
    ...apiMutations.sendMessage(),
    // The socket is preferred; REST keeps sending possible while it reconnects.
    mutationFn: async (input: {
      id: string;
      text: string;
    }): Promise<ChatSendResult> => {
      if (socket.status === "open") return socket.send(input.text);
      return sendMessageRequest(input);
    },
    onMutate: () => {
      shouldScrollToEnd.current = true;
    },
    onError: () => {
      shouldScrollToEnd.current = false;
    },
    onSuccess: (result) => {
      addMessageToHistory(client, id, result.message);
      setText("");
    },
  });
  const [text, setText] = useState("");
  const messages = Array.from(
    new Map(
      (query.data?.pages.flatMap((page) => page.items) ?? []).map((message) => [
        message.id,
        message,
      ]),
    ).values(),
  ).reverse();
  const latestMessageId = messages.at(-1)?.id;
  const { mutate: markRead } = useMutation(
    communityMutations.markConversationRead(),
  );
  const lastReadMessage = useRef<string | null>(null);
  // Mark the newest rendered message read while the page is visible. Go keeps
  // the furthest cursor, so a late or repeated request never regresses it.
  useEffect(() => {
    if (!latestMessageId || latestMessageId === lastReadMessage.current) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState !== "visible") return;
      timer = setTimeout(() => {
        markRead(
          { conversationId: id, messageId: latestMessageId },
          {
            onSuccess: () => {
              lastReadMessage.current = latestMessageId;
            },
          },
        );
      }, READ_DEBOUNCE_MS);
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [id, latestMessageId, markRead]);
  useLayoutEffect(() => {
    if (scrollSnapshot.current && !query.isFetchingNextPage) {
      const snapshot = scrollSnapshot.current;
      window.scrollTo({
        top: snapshot.top + document.body.scrollHeight - snapshot.height,
      });
      scrollSnapshot.current = null;
    } else if (latestMessageId && latestMessageId !== newestMessage.current) {
      if (
        newestMessage.current === null ||
        shouldScrollToEnd.current ||
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 200
      )
        window.scrollTo({ top: document.body.scrollHeight });
      shouldScrollToEnd.current = false;
    }
    if (latestMessageId) newestMessage.current = latestMessageId;
  }, [latestMessageId, query.data, query.isFetchingNextPage]);
  function handleLoadOlder() {
    scrollSnapshot.current = {
      height: document.body.scrollHeight,
      top: window.scrollY,
    };
    void query.fetchNextPage({ cancelRefetch: false });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.trim() && !mutation.isPending)
      mutation.mutate({ id, text: text.trim() });
  }
  return (
    <>
      <QueryStatus query={query} />
      <p className="text-sm">Conversa mediada pela organização.</p>
      <p role="status" className="text-xs">
        {CONNECTION_LABELS[socket.status]}
      </p>
      {query.hasNextPage ? (
        <Button
          variant="outline"
          loading={query.isFetchingNextPage}
          disabled={query.isFetching}
          onClick={handleLoadOlder}
        >
          Carregar mensagens anteriores
        </Button>
      ) : null}
      <ul
        aria-live="polite"
        aria-label="Mensagens"
        className="flex flex-col gap-3"
      >
        {messages.map((message) => (
          <li
            key={message.id}
            className={cn(
              "flex flex-col",
              message.senderId === userId ? "items-end" : "items-start",
            )}
          >
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 break-words whitespace-pre-wrap",
                message.senderId === userId ? "bg-primary" : "bg-secondary",
              )}
            >
              {message.body}
            </p>
            <time className="text-xs">{formatDate(message.createdAt)}</time>
          </li>
        ))}
      </ul>
      <ActionBar>
        <form onSubmit={submit} className="flex flex-col gap-2">
          <FormError id="message-send-error">
            {mutation.error?.message}
          </FormError>
          {mutation.data?.warning ? (
            <p role="status">A mensagem recebeu um aviso de moderação.</p>
          ) : null}
          <div className="flex items-end gap-2">
            <Input
              id="message"
              label="Mensagem"
              className="min-w-0 flex-1"
              maxLength={5000}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={!text.trim()}
            >
              Enviar
            </Button>
          </div>
        </form>
      </ActionBar>
    </>
  );
}
