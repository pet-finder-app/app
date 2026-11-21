"use client";
import { QueryStatus } from "@/components/backend/query-status";
import { LinkButton } from "@/components/ui";
import {
  surrenderAgreementOptions,
  surrenderOptions,
} from "@/lib/api/workflows";
import { useQuery } from "@tanstack/react-query";
import { canManageOrganization, type ViewerAccess } from "./access";
import { AgreementSetup } from "./agreement-setup";
import { AgreementSigning } from "./agreement-signing";
import { SURRENDER_KIND_LABELS, SURRENDER_STATUS_LABELS } from "./labels";

type SurrenderAgreementProps = { surrenderId: string; access: ViewerAccess };

/** Surrender/return agreement, signed with the same flow as adoptions. */
export function SurrenderAgreement({
  surrenderId,
  access,
}: SurrenderAgreementProps) {
  const surrender = useQuery(surrenderOptions(surrenderId));
  const agreement = useQuery(surrenderAgreementOptions(surrenderId));
  const data = surrender.data;
  if (!data || agreement.data === undefined)
    return (
      <>
        <QueryStatus query={surrender} />
        <QueryStatus query={agreement} />
      </>
    );
  const isRequester = data.requesterId === access.userId;
  const canManage = canManageOrganization(access, data.organizationId);
  return (
    <div className="flex flex-col gap-4">
      <p>
        {SURRENDER_KIND_LABELS[data.kind] ?? "Entrega"} de{" "}
        <strong>{data.animal.name}</strong> · ONG {data.organizationName} ·{" "}
        {SURRENDER_STATUS_LABELS[data.status] ?? "Situação não informada"}
      </p>
      <LinkButton
        variant="outline"
        href={`/${isRequester ? "adopter" : "ngo"}/surrenders/${encodeURIComponent(surrenderId)}`}
      >
        Voltar à solicitação
      </LinkButton>
      {agreement.data ? (
        <AgreementSigning
          agreementId={agreement.data.id}
          viewerId={access.userId}
          userLabel={
            isRequester
              ? "Solicitante"
              : `${data.requesterName} (solicitante da entrega)`
          }
          isSignable={data.status === "accepted"}
          memberOrganizationId={canManage ? data.organizationId : null}
        />
      ) : data.status === "accepted" && canManage ? (
        <AgreementSetup
          subject="surrender"
          subjectId={surrenderId}
          organizationId={data.organizationId}
          kind="surrender"
          counterpartId={data.requesterId}
        />
      ) : (
        <p role="note">
          {data.status === "accepted"
            ? "A ONG ainda não preparou o termo de entrega. Volte mais tarde."
            : "O termo fica disponível depois que a ONG aceita a solicitação."}
        </p>
      )}
    </div>
  );
}
