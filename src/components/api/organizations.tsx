"use client";

import { Card, LinkButton } from "@/components/ui";
import { useOrganization, useOrganizations } from "@/lib/api/queries";
import { useState } from "react";
import { AppFrame, Pagination, QueryState, statusLabel } from "./common";
import { ReportForm } from "./reports";

export function OrganizationsScreen() {
  const [page, setPage] = useState(1);
  const query = useOrganizations(page);
  return (
    <AppFrame title="Organizações verificadas">
      <QueryState query={query} />
      {query.isSuccess && (
        <>
          {!query.data.items?.length && (
            <Card>
              <p>Nenhuma organização nesta página.</p>
            </Card>
          )}
          {query.data.items?.map((org) => (
            <Card key={org.id}>
              <h2 className="font-bold">{org.name}</h2>
              <p>
                {org.location.city} / {org.location.state}
              </p>
              <p>{org.description}</p>
              <LinkButton href={`/ngos/${org.id}`} variant="outline">
                Ver organização
              </LinkButton>
            </Card>
          ))}
          <Pagination
            page={page}
            count={query.data.items?.length ?? 0}
            onPage={setPage}
          />
        </>
      )}
    </AppFrame>
  );
}

export function OrganizationDetailScreen({ id }: { id: string }) {
  const query = useOrganization(id);
  const org = query.data;
  return (
    <AppFrame title={org?.name ?? "Organização"}>
      <QueryState query={query} />
      {org && (
        <>
          <Card>
            <h2 className="text-lg font-bold">{org.name}</h2>
            <p>{statusLabel(org.verification_status)}</p>
            <p>{org.description}</p>
            <p>
              {org.location.city} / {org.location.state}
            </p>
            <p className="text-sm">E-mail: {org.official_channels.email}</p>
            {org.official_channels.phone && (
              <p>Telefone: {org.official_channels.phone}</p>
            )}
            {org.official_channels.website &&
              /^https?:\/\//.test(org.official_channels.website) && (
                <a
                  className="font-bold underline"
                  href={org.official_channels.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Site oficial
                </a>
              )}
            <p className="text-xs break-all">ID: {org.id}</p>
          </Card>
          <ReportForm subjectType="organization" subjectId={id} />
        </>
      )}
    </AppFrame>
  );
}
