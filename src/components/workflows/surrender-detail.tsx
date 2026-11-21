"use client";
import { formatDate } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import {
  Button,
  Card,
  FormError,
  Input,
  LinkButton,
  Textarea,
} from "@/components/ui";
import {
  agreementOptions,
  surrenderOptions,
  workflowMutations,
  type SurrenderDecisionValue,
} from "@/lib/api/workflows";
import type { SurrenderResponse } from "@/lib/backend/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { canManageOrganization, type ViewerAccess } from "./access";
import {
  AnimalFields,
  AnimalSummary,
  animalFromSnapshot,
  cleanAnimal,
} from "./animal-fields";
import { EvidenceLinks } from "./evidence-links";
import { EvidenceUpload, type UploadedEvidence } from "./evidence-upload";
import {
  SURRENDER_ACTION_LABELS,
  SURRENDER_KIND_LABELS,
  SURRENDER_STATUS_LABELS,
} from "./labels";
import { ReasonSheet } from "./reason-sheet";

const OPEN_STATUSES = ["submitted", "needs_information"];
/** Go recorded handover notes in English before switching to Portuguese. */
const LEGACY_HANDOVER_NOTE = "Handover confirmed";

function ResubmitForm({ surrender }: { surrender: SurrenderResponse }) {
  const resubmit = useMutation(workflowMutations.resubmitSurrender());
  const [animal, setAnimal] = useState(() =>
    animalFromSnapshot(surrender.animal),
  );
  const [reason, setReason] = useState(surrender.reason);
  const [added, setAdded] = useState<UploadedEvidence[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resubmit.isPending || isUploading || reason.trim().length < 20) return;
    resubmit.mutate(
      {
        id: surrender.id,
        animal: cleanAnimal(animal),
        reason: reason.trim(),
        documents: [...surrender.documents, ...added.map((item) => item.id)],
      },
      { onSuccess: () => setAdded([]) },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 border-t border-border-light pt-4"
    >
      <h2 className="text-lg font-bold">Enviar novas informações</h2>
      <p className="text-sm text-neutral-600">
        Revise os dados pedidos pela ONG. Os documentos já enviados são
        mantidos.
      </p>
      <AnimalFields
        idPrefix="resubmit-animal"
        value={animal}
        onChange={setAnimal}
      />
      <Textarea
        id="resubmit-reason"
        label="Motivo da entrega"
        required
        minLength={20}
        maxLength={5000}
        rows={5}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <EvidenceUpload
        id="resubmit-documents"
        label="Novos documentos (opcional)"
        purpose="surrender"
        value={added}
        onChange={setAdded}
        maxFiles={Math.max(0, 20 - surrender.documents.length)}
        onBusyChange={setIsUploading}
      />
      <FormError id="resubmit-error">{resubmit.error?.message}</FormError>
      <Button
        type="submit"
        loading={resubmit.isPending}
        disabled={isUploading || reason.trim().length < 20}
      >
        Reenviar para a ONG
      </Button>
    </form>
  );
}

function DecisionForm({ surrenderId }: { surrenderId: string }) {
  const decide = useMutation(workflowMutations.decideSurrender());
  const [reason, setReason] = useState("");
  const decisions: { value: SurrenderDecisionValue; label: string }[] = [
    { value: "accepted", label: "Aceitar" },
    { value: "needs_information", label: "Pedir informações" },
    { value: "rejected", label: "Recusar" },
  ];
  return (
    <section className="flex flex-col gap-3 border-t border-border-light pt-4">
      <h2 className="text-lg font-bold">Analisar solicitação</h2>
      <Textarea
        id="surrender-decision-reason"
        label="Resposta para o solicitante"
        required
        minLength={5}
        maxLength={3000}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {decisions.map((decision) => (
          <Button
            key={decision.value}
            variant={decision.value === "rejected" ? "danger-ghost" : "outline"}
            disabled={decide.isPending || reason.trim().length < 5}
            onClick={() =>
              decide.mutate(
                {
                  id: surrenderId,
                  decision: decision.value,
                  reason: reason.trim(),
                },
                { onSuccess: () => setReason("") },
              )
            }
          >
            {decision.label}
          </Button>
        ))}
      </div>
      <FormError id="surrender-decision-error">
        {decide.error?.message}
      </FormError>
    </section>
  );
}

type HandoverProps = {
  surrender: SurrenderResponse;
  isRequester: boolean;
  canManage: boolean;
};
function Handover({ surrender, isRequester, canManage }: HandoverProps) {
  const sendCode = useMutation(workflowMutations.sendHandoverCode());
  const confirm = useMutation(workflowMutations.confirmHandover());
  const [code, setCode] = useState("");
  const isReceived = Boolean(surrender.receivedAt);
  const isDelivered = Boolean(surrender.deliveredAt);

  function handleReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirm.isPending || !/^[0-9]{6}$/.test(code)) return;
    confirm.mutate(
      { id: surrender.id, type: "receipt", code },
      { onSuccess: () => setCode("") },
    );
  }

  return (
    <section
      aria-labelledby="handover-title"
      className="flex flex-col gap-3 border-t border-border-light pt-4"
    >
      <h2 id="handover-title" className="text-lg font-bold">
        Entrega do animal
      </h2>
      <ul className="text-sm">
        <li>
          Entrega pelo solicitante:{" "}
          {isDelivered ? formatDate(surrender.deliveredAt) : "pendente"}
        </li>
        <li>
          Recebimento pela ONG:{" "}
          {isReceived ? formatDate(surrender.receivedAt) : "pendente"}
        </li>
      </ul>
      {isRequester && !isReceived ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-neutral-600">
            No momento da entrega, peça o código por e-mail e informe-o à pessoa
            da ONG que receber o animal. O código vale por 10 minutos.
          </p>
          <Button
            variant="outline"
            loading={sendCode.isPending}
            onClick={() => sendCode.mutate(surrender.id)}
          >
            Enviar código de entrega por e-mail
          </Button>
          {sendCode.isSuccess ? (
            <p role="status" className="text-sm">
              Código enviado para o seu e-mail.
            </p>
          ) : null}
          <FormError id="handover-code-error" collapsible>
            {sendCode.error?.message}
          </FormError>
        </div>
      ) : null}
      {isRequester && !isDelivered ? (
        <Button
          loading={confirm.isPending && confirm.variables?.type === "delivery"}
          disabled={confirm.isPending}
          onClick={() => confirm.mutate({ id: surrender.id, type: "delivery" })}
        >
          Confirmar que entreguei o animal
        </Button>
      ) : null}
      {canManage && !isReceived ? (
        <form onSubmit={handleReceipt} className="flex flex-col gap-3">
          <Input
            id="handover-receipt-code"
            label="Código informado pelo solicitante"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            errorId="handover-error"
            invalid={Boolean(confirm.error)}
          />
          <Button
            type="submit"
            loading={confirm.isPending && confirm.variables?.type === "receipt"}
            disabled={confirm.isPending || code.length !== 6}
          >
            Confirmar recebimento do animal
          </Button>
        </form>
      ) : null}
      <FormError id="handover-error">{confirm.error?.message}</FormError>
      {isDelivered !== isReceived ? (
        <p role="note" className="text-sm">
          A entrega é concluída quando as duas confirmações forem registradas.
        </p>
      ) : null}
    </section>
  );
}

type SurrenderDetailProps = { surrenderId: string; access: ViewerAccess };

/** Intake/return case for its requester and the organization's managers. */
export function SurrenderDetail({ surrenderId, access }: SurrenderDetailProps) {
  const query = useQuery(surrenderOptions(surrenderId));
  const data = query.data;
  const agreement = useQuery({
    ...agreementOptions(data?.agreementId ?? ""),
    enabled: Boolean(data?.agreementId),
  });
  const cancel = useMutation(workflowMutations.cancelSurrender());
  const [isCancelling, setIsCancelling] = useState(false);
  if (!data) return <QueryStatus query={query} />;

  const isRequester = data.requesterId === access.userId;
  const canManage = canManageOrganization(access, data.organizationId);
  const signatures = agreement.data?.signatures.length ?? 0;
  const isSigned = signatures >= 2;
  const isHandoverStarted = Boolean(data.deliveredAt || data.receivedAt);
  const canCancel =
    (isRequester || canManage) &&
    [...OPEN_STATUSES, "accepted"].includes(data.status) &&
    !isHandoverStarted;
  const actorLabel = (record: { actorId: string; actorName: string }) =>
    record.actorId === access.userId
      ? `${record.actorName} (você)`
      : record.actorId === data.requesterId
        ? `${record.actorName} (solicitante)`
        : `${record.actorName} (ONG ${data.organizationName})`;

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-2">
        <p className="font-bold">
          {SURRENDER_STATUS_LABELS[data.status] ?? "Situação não informada"}
        </p>
        <p>
          {SURRENDER_KIND_LABELS[data.kind] ?? "Entrega"} · ONG{" "}
          {data.organizationName}
        </p>
        <p>
          Solicitante: {data.requesterName}
          {isRequester ? " (você)" : ""}
        </p>
        <p className="text-sm">Aberta em {formatDate(data.createdAt)}</p>
        {data.reviewReason ? (
          <p className="whitespace-pre-wrap">
            <span className="font-semibold">Resposta mais recente: </span>
            {data.reviewReason}
          </p>
        ) : null}
        {data.status === "completed" && data.animalId ? (
          <LinkButton
            variant="outline"
            href={`/pets/${encodeURIComponent(data.animalId)}`}
          >
            Ver animal publicado pela ONG
          </LinkButton>
        ) : null}
      </Card>

      <section
        aria-labelledby="surrender-animal"
        className="flex flex-col gap-2"
      >
        <h2 id="surrender-animal" className="text-lg font-bold">
          Animal
        </h2>
        <AnimalSummary animal={data.animal} />
      </section>

      <section
        aria-labelledby="surrender-reason"
        className="flex flex-col gap-2"
      >
        <h2 id="surrender-reason" className="text-lg font-bold">
          Motivo
        </h2>
        <p className="whitespace-pre-wrap">{data.reason}</p>
        <EvidenceLinks
          ids={data.documents}
          label="Documentos enviados"
          variant="documents"
        />
      </section>

      {isRequester && data.status === "needs_information" ? (
        <ResubmitForm key={data.updatedAt} surrender={data} />
      ) : null}
      {canManage && OPEN_STATUSES.includes(data.status) ? (
        <DecisionForm surrenderId={data.id} />
      ) : null}

      {["accepted", "completed"].includes(data.status) || data.agreementId ? (
        <section
          aria-labelledby="surrender-agreement"
          className="flex flex-col gap-2 border-t border-border-light pt-4"
        >
          <h2 id="surrender-agreement" className="text-lg font-bold">
            Termo de entrega
          </h2>
          <p>
            {data.agreementId
              ? `${signatures} de 2 assinaturas registradas.`
              : canManage
                ? "Prepare o termo para que as duas partes possam assinar."
                : "A ONG ainda não preparou o termo."}
          </p>
          {data.agreementId || canManage ? (
            <LinkButton
              variant="outline"
              href={`/surrenders/${encodeURIComponent(data.id)}/agreement`}
            >
              {data.agreementId ? "Ver e assinar o termo" : "Preparar o termo"}
            </LinkButton>
          ) : null}
          {data.status === "accepted" && !isSigned ? (
            <p role="note" className="text-sm">
              A entrega só pode ser confirmada depois que as duas partes
              assinarem o termo.
            </p>
          ) : null}
        </section>
      ) : null}

      {data.status === "accepted" && isSigned && (isRequester || canManage) ? (
        <Handover
          surrender={data}
          isRequester={isRequester}
          canManage={canManage}
        />
      ) : null}

      {canCancel ? (
        <Button variant="danger-ghost" onClick={() => setIsCancelling(true)}>
          Cancelar solicitação
        </Button>
      ) : null}
      {isCancelling ? (
        <ReasonSheet
          title="Cancelar solicitação"
          description="O cancelamento encerra a solicitação antes da entrega e fica registrado no histórico. Esta ação não pode ser desfeita."
          label="Motivo do cancelamento"
          confirmLabel="Cancelar solicitação"
          isBusy={cancel.isPending}
          error={cancel.error?.message}
          onConfirm={(reason) => cancel.mutateAsync({ id: data.id, reason })}
          onClose={() => {
            setIsCancelling(false);
            cancel.reset();
          }}
        />
      ) : null}

      <section
        aria-labelledby="surrender-history"
        className="flex flex-col gap-2"
      >
        <h2 id="surrender-history" className="text-lg font-bold">
          Histórico
        </h2>
        <ol className="flex flex-col gap-2">
          {data.history.map((record, index) => (
            <li
              key={`${record.createdAt}-${index}`}
              className="rounded-2xl border border-border-light p-3 text-sm"
            >
              <p className="font-semibold">
                {SURRENDER_ACTION_LABELS[record.action] ?? "Atualização"} ·{" "}
                {formatDate(record.createdAt)}
              </p>
              <p>{actorLabel(record)}</p>
              {record.notes && record.notes.trim() !== LEGACY_HANDOVER_NOTE ? (
                <p className="whitespace-pre-wrap">{record.notes}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
