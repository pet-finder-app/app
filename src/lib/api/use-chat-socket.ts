"use client";
import {
  chatEventSchema,
  chatTicketResponseSchema,
  type CollectionResponseMessage,
  type Message,
} from "@/lib/backend/contracts";
import {
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, jsonBody, requestData } from "./client";
import { queryKeys } from "./keys";
import { backendPath } from "./queries";

export type ChatSocketStatus = "connecting" | "open" | "offline";
export type ChatSendResult = { message: Message; warning?: string };

/** Closing codes from the Go chat protocol. */
const TOKEN_EXPIRED = 4001;
const ACK_TIMEOUT_MS = 10_000;
const MAX_RETRY_DELAY_MS = 30_000;

type PendingAck = {
  resolve: (result: ChatSendResult) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

/** Insert a message received in real time at the head of the history cache. */
export function addMessageToHistory(
  client: QueryClient,
  conversationId: string,
  message: Message,
) {
  client.setQueryData<InfiniteData<CollectionResponseMessage, unknown>>(
    [...queryKeys.messages(conversationId), "history"],
    (data) => {
      if (!data?.pages.length) return data;
      if (
        data.pages.some((page) => page.items.some((m) => m.id === message.id))
      )
        return data;
      const [first, ...rest] = data.pages;
      return {
        ...data,
        pages: [{ ...first, items: [message, ...first.items] }, ...rest],
      };
    },
  );
}

function chatError(status: number | undefined, title: string | undefined) {
  if (status === 403)
    return new ApiError(403, "Esta conversa não aceita novas mensagens.");
  if (status === 422)
    return new ApiError(422, "A mensagem deve ter entre 1 e 5000 caracteres.");
  return new ApiError(
    status ?? 500,
    title ?? "Não foi possível enviar a mensagem.",
  );
}

/**
 * Real-time conversation channel. The access token never reaches JavaScript:
 * the Next proxy exchanges the HttpOnly session for a one-minute,
 * conversation-scoped ticket, which is offered as a WebSocket subprotocol.
 */
export function useChatSocket(conversationId: string) {
  const client = useQueryClient();
  const [status, setStatus] = useState<ChatSocketStatus>("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const pending = useRef(new Map<string, PendingAck>());
  const sequence = useRef(0);

  useEffect(() => {
    let disposed = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const acks = pending.current;

    const failPending = () => {
      for (const [, ack] of acks) {
        clearTimeout(ack.timer);
        ack.reject(new Error("A conexão foi interrompida. Tente novamente."));
      }
      acks.clear();
    };
    const scheduleReconnect = (delay: number) => {
      if (disposed) return;
      setStatus("offline");
      retryTimer = setTimeout(() => void connect(), delay);
    };
    const connect = async () => {
      if (disposed) return;
      setStatus("connecting");
      let socket: WebSocket;
      try {
        const ticket = await requestData(
          backendPath(
            `/v1/conversations/${encodeURIComponent(conversationId)}/ws-ticket`,
          ),
          chatTicketResponseSchema,
          { ...jsonBody({}), signal: controller.signal },
        );
        if (disposed) return;
        socket = new WebSocket(ticket.url, [
          ticket.subprotocol,
          `ticket.${ticket.ticket}`,
        ]);
      } catch (error: unknown) {
        // Lost access is final; transient failures retry with backoff.
        if (
          disposed ||
          (error instanceof ApiError && [401, 403, 404].includes(error.status))
        )
          return setStatus("offline");
        attempt += 1;
        return scheduleReconnect(
          Math.min(1_000 * 2 ** attempt, MAX_RETRY_DELAY_MS),
        );
      }
      socketRef.current = socket;
      socket.onopen = () => {
        attempt = 0;
        setStatus("open");
        // Fill any gap between the last history read and this connection.
        void client.invalidateQueries({
          queryKey: queryKeys.messages(conversationId),
        });
      };
      socket.onmessage = (frame) => {
        if (typeof frame.data !== "string") return;
        let payload: unknown;
        try {
          payload = JSON.parse(frame.data);
        } catch {
          return;
        }
        const parsed = chatEventSchema.safeParse(payload);
        if (!parsed.success) return;
        const event = parsed.data;
        if (event.message)
          addMessageToHistory(client, conversationId, event.message);
        const ack = event.clientId ? acks.get(event.clientId) : undefined;
        if (!ack || !event.clientId) return;
        acks.delete(event.clientId);
        clearTimeout(ack.timer);
        if (event.type === "message.ack" && event.message)
          ack.resolve({ message: event.message, warning: event.warning });
        else ack.reject(chatError(event.error?.status, event.error?.title));
      };
      socket.onclose = (event) => {
        if (socketRef.current === socket) socketRef.current = null;
        failPending();
        if (disposed) return;
        void client.invalidateQueries({ queryKey: queryKeys.conversations });
        // An expired access token reconnects at once through a refreshed session.
        attempt = event.code === TOKEN_EXPIRED ? 0 : attempt + 1;
        scheduleReconnect(
          event.code === TOKEN_EXPIRED
            ? 0
            : Math.min(1_000 * 2 ** attempt, MAX_RETRY_DELAY_MS),
        );
      };
    };

    void connect();
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(retryTimer);
      failPending();
      socketRef.current?.close(1000);
      socketRef.current = null;
    };
  }, [client, conversationId]);

  /** Send over the socket and resolve when the server acknowledges it. */
  const send = useCallback((body: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN)
      return Promise.reject(new Error("Conexão em tempo real indisponível."));
    sequence.current += 1;
    const clientId = `${Date.now().toString(36)}-${sequence.current}`;
    return new Promise<ChatSendResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.current.delete(clientId);
        reject(new Error("O envio demorou demais. Confira a conversa."));
      }, ACK_TIMEOUT_MS);
      pending.current.set(clientId, { resolve, reject, timer });
      socket.send(
        JSON.stringify({ type: "message.send", client_id: clientId, body }),
      );
    });
  }, []);

  return { status, send };
}
