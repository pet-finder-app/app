"use client";
import { APPLICATION_STATUS_LABELS } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { LinkButton } from "@/components/ui";
import { applicationOptions } from "@/lib/api/queries";
import { applicationAgreementOptions } from "@/lib/api/workflows";
import { useQuery } from "@tanstack/react-query";
import { canManageOrganization, type ViewerAccess } from "./access";
import { AgreementSetup } from "./agreement-setup";
import { AgreementSigning } from "./agreement-signing";

type AdoptionAgreementProps = { applicationId: string; access: ViewerAccess };

/** Adoption agreement for the adopter and the organization's representative. */
export function AdoptionAgreement({
  applicationId,
  access,
}: AdoptionAgreementProps) {
  const application = useQuery(applicationOptions(applicationId));
  const agreement = useQuery(applicationAgreementOptions(applicationId));
  const data = application.data?.application;
  if (!data || agreement.data === undefined)
    return (
      <>
        <QueryStatus query={application} />
        <QueryStatus query={agreement} />
      </>
    );
  const isApplicant = data.adopterId === access.userId;
  const canManage = canManageOrganization(access, data.organizationId);
  const isSignable = ["approved", "completed"].includes(data.status);
  return (
    <div className="flex flex-col gap-4">
      <p>
        Adoção de <strong>{data.animalName}</strong> pela ONG{" "}
        {data.organizationName} ·{" "}
        {APPLICATION_STATUS_LABELS[data.status] ?? "Situação não informada"}
      </p>
      <LinkButton
        variant="outline"
        href={`/${isApplicant ? "adopter" : "ngo"}/adoptions/${encodeURIComponent(applicationId)}`}
      >
        Voltar ao pedido
      </LinkButton>
      {agreement.data ? (
        <AgreementSigning
          agreementId={agreement.data.id}
          viewerId={access.userId}
          userLabel={
            isApplicant ? "Adotante" : `${data.adopterName} (adotante)`
          }
          isSignable={isSignable}
          memberOrganizationId={canManage ? data.organizationId : null}
        />
      ) : isSignable && canManage && data.organizationId ? (
        <AgreementSetup
          subject="application"
          subjectId={applicationId}
          organizationId={data.organizationId}
          kind="adoption"
          counterpartId={data.adopterId}
        />
      ) : (
        <p role="note">
          {isSignable
            ? "A ONG ainda não preparou o termo de adoção. Volte mais tarde ou fale com a ONG pela conversa do pedido."
            : "O termo de adoção fica disponível depois que a ONG aprova o pedido, inclusive após a adoção ser concluída."}
        </p>
      )}
    </div>
  );
}
