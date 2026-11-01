"use client";

import { Card, LinkButton } from "@/components/ui";
import {
  useApplications,
  useConversations,
  useOrganization,
  useOrganizationId,
} from "@/lib/api/queries";
import { AppFrame, QueryState, statusLabel } from "./common";

export function DashboardScreen() {
  const [id] = useOrganizationId();
  return (
    <AppFrame title="Painel da ONG" organization>
      {id ? (
        <Dashboard organizationId={id} />
      ) : (
        <Card>
          <p>Selecione sua organização ou cadastre uma nova para começar.</p>
          <LinkButton href="/ngo/settings">Cadastrar organização</LinkButton>
        </Card>
      )}
    </AppFrame>
  );
}

function Dashboard({ organizationId }: { organizationId: string }) {
  const organization = useOrganization(organizationId);
  const applications = useApplications(1, organizationId);
  const conversations = useConversations(1, organizationId);
  return (
    <>
      <QueryState query={organization} />
      {organization.data && (
        <Card>
          <h2 className="text-xl font-bold">{organization.data.name}</h2>
          <p>
            Verificação: {statusLabel(organization.data.verification_status)}
          </p>
          <p>{organization.data.description}</p>
        </Card>
      )}
      <Card>
        <h2 className="font-bold">Candidaturas recentes</h2>
        <QueryState query={applications} />
        {applications.data?.items?.map((application) => (
          <LinkButton
            key={application.id}
            href={`/ngo/adoptions/${application.id}`}
            variant="pill"
          >
            {application.animal_name} · {statusLabel(application.status)}
          </LinkButton>
        ))}
        {applications.isSuccess && !applications.data.items?.length && (
          <p>Nenhuma candidatura.</p>
        )}
        <LinkButton href="/ngo/adoptions" variant="outline">
          Ver todas as candidaturas
        </LinkButton>
      </Card>
      <Card>
        <h2 className="font-bold">Conversas recentes</h2>
        <QueryState query={conversations} />
        {conversations.data?.items?.map((conversation) => (
          <LinkButton
            key={conversation.id}
            href={`/ngo/conversations/${conversation.id}`}
            variant="pill"
          >
            {conversation.animal_name}
          </LinkButton>
        ))}
        {conversations.isSuccess && !conversations.data.items?.length && (
          <p>Nenhuma conversa.</p>
        )}
        <LinkButton href="/ngo/messages" variant="outline">
          Ver todas as conversas
        </LinkButton>
      </Card>
    </>
  );
}
