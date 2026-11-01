"use client";

import { Button, Card, LinkButton, Textarea } from "@/components/ui";
import { api, result } from "@/lib/api/client";
import {
  keys,
  useApiMutation,
  useConversations,
  useMe,
  useMessages,
  useOrganizationId,
  type ConversationRow,
} from "@/lib/api/queries";
import { useState } from "react";
import {
  AppFrame,
  dateLabel,
  ErrorMessage,
  Pagination,
  QueryState,
} from "./common";
import { ReportForm } from "./reports";

export function ConversationListScreen({
  organization = false,
}: {
  organization?: boolean;
}) {
  const [id] = useOrganizationId();
  return (
    <AppFrame title="Conversas" organization={organization}>
      {organization && !id ? (
        <Card>
          <p>Selecione sua organização para consultar as conversas.</p>
        </Card>
      ) : (
        <ConversationList organizationId={organization ? id : undefined} />
      )}
    </AppFrame>
  );
}

function ConversationList({ organizationId }: { organizationId?: string }) {
  const [page, setPage] = useState(1);
  const query = useConversations(page, organizationId);
  return (
    <>
      <QueryState query={query} />
      {query.isSuccess && (
        <>
          {!query.data.items?.length && (
            <Card>
              <p>
                Nenhuma conversa nesta página. As conversas são abertas a partir
                de candidaturas de adoção.
              </p>
            </Card>
          )}
          {query.data.items?.map((row) => {
            const conversation = row as ConversationRow;
            return (
              <Card key={conversation.id}>
                <h2 className="font-bold">{conversation.animal_name}</h2>
                <p>
                  {organizationId
                    ? conversation.counterparty_name
                    : conversation.organization_name}
                </p>
                <p className="text-sm">
                  {conversation.last_message_body || "Nenhuma mensagem ainda."}
                </p>
                <p className="text-xs">
                  {dateLabel(conversation.last_message_at)}
                </p>
                <LinkButton
                  href={`/${organizationId ? "ngo" : "adopter"}/conversations/${conversation.id}`}
                  variant="outline"
                >
                  Abrir conversa
                </LinkButton>
                {conversation.application_id && (
                  <LinkButton
                    href={`/${organizationId ? "ngo" : "adopter"}/adoptions/${conversation.application_id}`}
                    variant="pill"
                  >
                    Ver adoção
                  </LinkButton>
                )}
              </Card>
            );
          })}
          <Pagination
            page={page}
            count={query.data.items?.length ?? 0}
            onPage={setPage}
          />
        </>
      )}
    </>
  );
}

export function ChatScreen({
  id,
  organization = false,
}: {
  id: string;
  organization?: boolean;
}) {
  const query = useMessages(id);
  const me = useMe();
  const [text, setText] = useState("");
  const mutation = useApiMutation(
    (body: string) =>
      result(
        api.POST("/v1/conversations/{conversationId}/messages", {
          params: { path: { conversationId: id } },
          body: { body },
        }),
      ),
    [keys.conversations],
  );
  const messages = [...(query.data?.items ?? [])].reverse();
  return (
    <AppFrame title="Conversa" organization={organization}>
      <QueryState query={query} />
      {query.isSuccess && (
        <Card>
          <div
            role="log"
            aria-label="Mensagens"
            aria-live="polite"
            className="flex flex-col gap-3"
          >
            {!messages.length && <p>Nenhuma mensagem ainda.</p>}
            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[90%] rounded-2xl p-3 ${message.sender_id === me.data?.id ? "self-end bg-primary-soft" : "self-start bg-neutral-100"}`}
              >
                <p className="text-sm break-words whitespace-pre-wrap">
                  {message.body}
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  {message.sender_id === me.data?.id ? "Você" : "Participante"}{" "}
                  · {dateLabel(message.created_at)}
                </p>
              </article>
            ))}
          </div>
          {messages.length === 100 && (
            <p className="text-xs">
              Mostrando as 100 mensagens mais recentes. O serviço ainda não
              oferece acesso às mensagens anteriores.
            </p>
          )}
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate(text.trim(), { onSuccess: () => setText("") });
            }}
          >
            <Textarea
              id="message"
              label="Mensagem"
              value={text}
              onChange={(e) => setText(e.target.value)}
              minLength={1}
              maxLength={5000}
              required
            />
            <ErrorMessage error={mutation.error} />
            {mutation.data?.warning && (
              <p role="status" className="text-sm text-red-700">
                {mutation.data.warning}
              </p>
            )}
            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={!text.trim()}
            >
              Enviar
            </Button>
          </form>
        </Card>
      )}
      <ReportForm subjectType="conversation" subjectId={id} />
    </AppFrame>
  );
}
