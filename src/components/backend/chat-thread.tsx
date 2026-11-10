"use client";
import { ActionBar, Button, FormError, Input, cn } from "@/components/ui";
import { apiMutations } from "@/lib/api/mutations";
import { messagesOptions } from "@/lib/api/queries";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { formatDate } from "./labels";
import { QueryStatus } from "./query-status";

export function ChatThread({ id, userId }: { id: string; userId: string }) {
  const client = useQueryClient();
  const query = useQuery(messagesOptions(id));
  const mutation = useMutation({
    ...apiMutations.sendMessage(),
    onSuccess: () => {
      setText("");
      void client.invalidateQueries({ queryKey: messagesOptions(id).queryKey });
    },
  });
  const [text, setText] = useState("");
  const messages = query.data?.items.slice().reverse() ?? [];
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      window.scrollTo({ top: document.body.scrollHeight }),
    );
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.trim() && !mutation.isPending)
      mutation.mutate({ id, text: text.trim() });
  }
  return (
    <>
      <QueryStatus query={query} />
      <p className="text-sm">
        Mensagens recentes da conversa mediada pela organização.
      </p>
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
