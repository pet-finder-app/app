"use client";

import {
  ActionBar,
  Button,
  cn,
  fieldControlClass,
  FormError,
  shadowSoft,
} from "@/components/ui";
import {
  formatChatTime,
  MAX_MESSAGE_LENGTH,
  type ChatMessage,
} from "@/lib/conversation";
import { Send } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

const POLL_MS = 4000;
const ERROR_ID = "chat-error";

type ChatThreadProps = {
  conversationId: string;
  /** Identifier of the current viewer. */
  meId: string;
  otherName: string;
  initialMessages: ChatMessage[];
};

/** Chat view with outgoing messages on the right and a fixed composer. Poll for new messages while the page is open. */
export function ChatThread({
  conversationId,
  meId,
  otherName,
  initialMessages,
}: ChatThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function refresh() {
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/conversations/${conversationId}`);
        if (!response.ok) return;
        const data = (await response.json()) as { messages: ChatMessage[] };
        setMessages((prev) =>
          data.messages.length === prev.length &&
          data.messages.at(-1)?.id === prev.at(-1)?.id
            ? prev
            : data.messages,
        );
      } catch {
        // Retry on the next polling cycle if the connection is unavailable.
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId]);

  // Scroll to the latest message after the first paint and whenever messages change.
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      window.scrollTo({ top: document.body.scrollHeight }),
    );
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setError(null);
    setIsSending(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        },
      );
      const data = (await response.json()) as {
        message?: ChatMessage | string;
      };
      if (!response.ok || typeof data.message === "string" || !data.message) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Não foi possível enviar.",
        );
        return;
      }
      const sent = data.message;
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
      setText("");
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <ul
        aria-label={`Conversa com ${otherName}`}
        aria-live="polite"
        className="flex flex-col gap-2"
      >
        {messages.map((message) => {
          if (message.kind === "system") {
            return (
              <li key={message.id} className="flex justify-center py-1">
                <p className="max-w-[90%] rounded-2xl bg-accent-yellow px-3 py-2 text-center text-xs font-semibold text-neutral-900">
                  {message.text}
                </p>
              </li>
            );
          }
          const mine = message.senderId === meId;
          return (
            <li
              key={message.id}
              className={cn(
                "flex flex-col",
                mine ? "items-end" : "items-start",
              )}
            >
              <p
                className={cn(
                  "max-w-[85%] rounded-3xl px-4 py-2.5 text-sm break-words whitespace-pre-line",
                  mine
                    ? "rounded-br-lg bg-primary text-primary-foreground"
                    : cn(
                        "rounded-bl-lg bg-white text-neutral-900",
                        shadowSoft.sm,
                      ),
                )}
              >
                <span className="sr-only">
                  {mine ? "Você: " : `${otherName}: `}
                </span>
                {message.text}
              </p>
              <span className="mt-0.5 px-2 text-[11px] text-neutral-600">
                {formatChatTime(message.createdAt)}
              </span>
            </li>
          );
        })}
      </ul>
      <div ref={bottomRef} />

      <ActionBar>
        <form onSubmit={handleSubmit} className="flex flex-col gap-1">
          <FormError id={ERROR_ID} collapsible className="text-xs">
            {error}
          </FormError>
          <div className="flex items-center gap-2">
            <input
              type="text"
              aria-label={`Mensagem para ${otherName}`}
              aria-describedby={ERROR_ID}
              placeholder="Escreva uma mensagem..."
              maxLength={MAX_MESSAGE_LENGTH}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={cn(fieldControlClass.light, "min-w-0 flex-1")}
            />
            <Button
              type="submit"
              size="md"
              loading={isSending}
              disabled={!text.trim()}
              aria-label="Enviar mensagem"
              className="shrink-0"
            >
              <Send className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </ActionBar>
    </>
  );
}
