"use client";

import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  cn,
  FormError,
  iconSize,
  Input,
  LinkButton,
  shadowSoft,
  Textarea,
} from "@/components/ui";
import type { SignerRole } from "@/lib/adoption";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SIZE_LABEL,
  PET_SPECIES_LABEL,
} from "@/lib/pet";
import {
  isSurrenderActive,
  SURRENDER_REASON_LABEL,
  SURRENDER_STATUS_LABEL,
  SURRENDER_STEPS,
  SURRENDER_URGENCY_LABEL,
  surrenderHandoverReminder,
  whoActsNow,
  type Surrender,
  type SurrenderFormInput,
  type SurrenderPet,
} from "@/lib/surrender";
import {
  Bell,
  CalendarClock,
  FileText,
  MapPin,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Answer,
  CancelBox,
  HistoryCard,
  ProcessSteps,
  TermSignCard,
  WaitingCard,
  type ProcessRun,
} from "./process-cards";
import { SurrenderFields } from "./surrender-request-form";

const ERROR_ID = "surrender-panel-error";

type SurrenderPanelProps = {
  initialSurrender: Surrender;
  role: SignerRole;
  chatHref: string;
  /** Só para a ONG: quantas vagas ela diz ter, para ajudar na decisão. */
  shelterNote?: string | null;
};

/**
 * Painel da entrega de um pet à ONG, igual para os dois lados (como o painel
 * da adoção, de ponta-cabeça): linha do tempo no topo e, embaixo, só o que a
 * pessoa pode fazer na etapa atual.
 */
export function SurrenderPanel({
  initialSurrender,
  role,
  chatHref,
  shelterNote,
}: SurrenderPanelProps) {
  const router = useRouter();
  const [surrender, setSurrender] = useState(initialSurrender);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const isOng = role === "ong";
  const active = isSurrenderActive(surrender.status);
  const myTurn = whoActsNow(surrender) === role;
  const petName = surrender.pet.name;

  const run: ProcessRun = async (body) => {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/acolhimentos/${surrender.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        surrender?: Surrender;
        devCode?: string;
        message?: string;
      };
      if (!response.ok || !data.surrender) {
        setError(data.message ?? "Não foi possível concluir.");
        return false;
      }
      setSurrender(data.surrender);
      setDevCode(data.devCode ?? null);
      router.refresh();
      return true;
    } catch {
      setError("Falha de conexão. Tente de novo.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const currentStep = SURRENDER_STEPS.findIndex(
    (s) => s.status === surrender.status,
  );
  const reminder = surrenderHandoverReminder(surrender);

  return (
    <div className="flex flex-col gap-4">
      <Card as="header" className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-neutral-900">
              {surrender.adoptionId
                ? `Devolução de ${petName}`
                : `Entrega de ${petName}`}
            </h1>
            <p className="text-sm text-neutral-600">
              {isOng
                ? `Tutor: ${surrender.adopterName}`
                : `Para ${surrender.ongName}`}
            </p>
          </div>
          <Badge
            tone={
              surrender.status === "concluida"
                ? "success"
                : surrender.status === "recusada" ||
                    surrender.status === "cancelada"
                  ? "danger"
                  : "info"
            }
          >
            {SURRENDER_STATUS_LABEL[surrender.status]}
          </Badge>
        </div>

        {currentStep >= 0 ? (
          <ProcessSteps
            steps={SURRENDER_STEPS}
            currentIndex={currentStep}
            label="Etapas da entrega do pet"
          />
        ) : null}

        {active && myTurn ? (
          <p className="rounded-2xl bg-accent-yellow px-3 py-2 text-sm font-bold text-neutral-900">
            É a sua vez: veja o que fazer abaixo.
          </p>
        ) : active ? (
          <p className="text-sm text-neutral-600">
            Agora é com {isOng ? surrender.adopterName : "a ONG"}. Avisamos você
            por aqui e na conversa quando mudar.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <LinkButton href={chatHref} variant="pill" size="sm">
            <MessageCircle className={iconSize.sm} aria-hidden="true" />
            Conversa
          </LinkButton>
          {surrender.term ? (
            <LinkButton
              href={`/acolhimentos/${surrender.id}/termo`}
              variant="pill"
              size="sm"
              target="_blank"
            >
              <FileText className={iconSize.sm} aria-hidden="true" />
              Ver termo
            </LinkButton>
          ) : null}
        </div>
      </Card>

      <FormError id={ERROR_ID} collapsible>
        {error}
      </FormError>

      {surrender.status === "ficha" ? (
        isOng ? (
          <WaitingCard
            title="Aguardando os ajustes"
            text={`${surrender.adopterName} vai ajustar o pedido conforme o que você pediu. Vocês podem conversar pelo chat enquanto isso.`}
          />
        ) : (
          <AdjustStep surrender={surrender} busy={busy} run={run} />
        )
      ) : null}

      {surrender.status === "analise" ? (
        isOng ? (
          <ReviewStep
            surrender={surrender}
            shelterNote={shelterNote ?? null}
            busy={busy}
            run={run}
          />
        ) : (
          <>
            <WaitingCard
              title="A ONG está analisando"
              text="A ONG vai ler o seu pedido e responder em breve. Ela precisa ver se tem espaço e cuidados para receber o animal. Você pode conversar pelo chat enquanto isso."
            />
            <RequestSummary surrender={surrender} />
          </>
        )
      ) : null}

      {surrender.status === "termo" && surrender.term ? (
        <>
          <TermSignCard
            term={surrender.term}
            title="Termo de entrega do pet"
            ariaLabel="Texto do termo de entrega do pet"
            adopterName={surrender.adopterName}
            role={role}
            busy={busy}
            devCode={devCode}
            run={run}
            signLabel="LI E ASSINO O TERMO"
          />
        </>
      ) : null}

      {surrender.status === "entrega" ? (
        <HandoverStep
          surrender={surrender}
          reminder={reminder}
          isOng={isOng}
          busy={busy}
          run={run}
        />
      ) : null}

      {surrender.status === "concluida" ? (
        <Card className="gap-2">
          <CardTitle>Pet recebido pela ONG</CardTitle>
          {isOng ? (
            <>
              <CardDescription>
                {petName} entrou no seu cadastro como
                &ldquo;Indisponível&rdquo;, enquanto você o avalia e cuida dele.
                Quando estiver pronto, complete as informações e publique para
                adoção.
              </CardDescription>
              {surrender.receivedPetId ? (
                <LinkButton
                  href={`/ong/pets/${surrender.receivedPetId}/editar`}
                  size="sm"
                  className="self-start"
                >
                  Revisar o cadastro de {petName}
                </LinkButton>
              ) : null}
            </>
          ) : (
            <CardDescription>
              {surrender.ongName} recebeu {petName}. Obrigado por cuidar dele
              até aqui e por buscar um lugar seguro para ele.
            </CardDescription>
          )}
        </Card>
      ) : null}

      {surrender.status === "recusada" || surrender.status === "cancelada" ? (
        <Card className="gap-2">
          <CardTitle>{SURRENDER_STATUS_LABEL[surrender.status]}</CardTitle>
          {surrender.decisionNote ? (
            <CardDescription>Motivo: {surrender.decisionNote}</CardDescription>
          ) : null}
          {!isOng ? (
            <>
              <CardDescription>
                Cada ONG tem um limite de vagas. Você pode pedir a outra ONG.
              </CardDescription>
              <LinkButton
                href="/adotante/acolhimentos/novo"
                size="sm"
                className="self-start"
              >
                Fazer um novo pedido
              </LinkButton>
            </>
          ) : null}
        </Card>
      ) : null}

      {active ? (
        <CancelBox
          triggerLabel={
            isOng ? "Cancelar este processo" : "Desistir deste pedido"
          }
          description="O processo é encerrado e não pode ser desfeito. Quem precisar pode fazer um novo pedido depois."
          busy={busy}
          run={run}
        />
      ) : null}

      <HistoryCard events={surrender.events} />
    </div>
  );
}

// ---------------------------------------------------------------------------

type StepProps = {
  surrender: Surrender;
  busy: boolean;
  run: ProcessRun;
};

/** Resumo do pedido: o que o tutor contou sobre o pet e o motivo. */
function RequestSummary({ surrender }: { surrender: Surrender }) {
  const { pet, form } = surrender;
  const health = [
    pet.health.vaccinated ? "vacinado" : null,
    pet.health.neutered ? "castrado" : null,
    pet.health.dewormed ? "vermifugado" : null,
  ].filter(Boolean);
  const photos = pet.photos.filter(
    (p): p is typeof p & { url: string } => p.url !== null,
  );

  return (
    <Card className="gap-3">
      <CardTitle>Pedido de {surrender.adopterName}</CardTitle>
      {photos.length > 0 ? (
        <ul className="flex gap-2 overflow-x-auto">
          {photos.map((photo, index) => (
            <li
              key={`${photo.name}-${index}`}
              className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-100"
            >
              <Image
                src={photo.url}
                alt={`Foto ${index + 1} de ${pet.name}`}
                fill
                unoptimized
                sizes="96px"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}
      <dl className="flex flex-col gap-2 text-sm text-neutral-900">
        <Answer
          label="Animal"
          value={[
            pet.name,
            PET_SPECIES_LABEL[pet.species],
            pet.breed || "sem raça definida",
            PET_SEX_LABEL[pet.sex],
            `porte ${PET_SIZE_LABEL[pet.size].toLowerCase()}`,
            PET_AGE_GROUP_LABEL[pet.ageGroup].toLowerCase(),
          ].join(" · ")}
        />
        <Answer
          label="Saúde"
          value={
            [
              ...health,
              pet.health.specialNeeds
                ? `cuidados: ${pet.health.specialNeeds}`
                : null,
            ]
              .filter(Boolean)
              .join(", ") || "nada informado"
          }
        />
        <Answer label="Como ele é" value={pet.description} />
        <Answer label="Motivo" value={SURRENDER_REASON_LABEL[form.reason]} />
        <Answer label="O que aconteceu" value={form.reasonDetails} />
        <Answer label="Convivência" value={form.behavior || "—"} />
        <Answer
          label="Urgência"
          value={SURRENDER_URGENCY_LABEL[form.urgency]}
        />
      </dl>
    </Card>
  );
}

/** Adotante: ajustar o pedido quando a ONG pediu mudanças. */
function AdjustStep({ surrender, busy, run }: StepProps) {
  const [pet, setPet] = useState<SurrenderPet>(surrender.pet);
  const [form, setForm] = useState<SurrenderFormInput>({ ...surrender.form });

  return (
    <>
      <Card className="gap-2">
        <CardTitle>Ajuste o pedido</CardTitle>
        {surrender.decisionNote ? (
          <p
            className={cn(
              "rounded-2xl bg-accent-yellow px-3 py-2 text-sm text-neutral-900",
              shadowSoft.sm,
            )}
          >
            A ONG pediu ajustes: {surrender.decisionNote}
          </p>
        ) : null}
      </Card>
      <SurrenderFields
        pet={pet}
        form={form}
        onPetChange={setPet}
        onFormChange={setForm}
        lockPet={Boolean(surrender.petId)}
      />
      <Button
        loading={busy}
        loadingLabel="ENVIANDO..."
        onClick={() => void run({ action: "resubmit", pet, form })}
      >
        ENVIAR PEDIDO AJUSTADO
      </Button>
    </>
  );
}

/** ONG: ler o pedido e aceitar, pedir ajustes ou recusar com educação. */
function ReviewStep({
  surrender,
  shelterNote,
  busy,
  run,
}: StepProps & { shelterNote: string | null }) {
  const [note, setNote] = useState("");
  const [noteFor, setNoteFor] = useState<"request_changes" | "reject" | null>(
    null,
  );

  return (
    <>
      <RequestSummary surrender={surrender} />

      <Card className="gap-3">
        <CardTitle>Sua decisão</CardTitle>
        {shelterNote ? <CardDescription>{shelterNote}</CardDescription> : null}
        {noteFor ? (
          <>
            <Textarea
              id="surrenderDecisionNote"
              label={
                noteFor === "reject"
                  ? "Motivo (será mostrado à pessoa, com educação)"
                  : "O que precisa mudar no pedido"
              }
              hint={
                noteFor === "reject"
                  ? "Se puder, indique outro caminho: outra ONG, um abrigo ou um lar temporário."
                  : undefined
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setNoteFor(null);
                  setNote("");
                }}
              >
                Voltar
              </Button>
              <Button
                variant={noteFor === "reject" ? "danger" : "primary"}
                className="flex-1"
                loading={busy}
                onClick={() => void run({ action: noteFor, note })}
              >
                {noteFor === "reject" ? "Recusar" : "Pedir ajustes"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button
              loading={busy}
              onClick={() => void run({ action: "approve" })}
            >
              ACEITAR E GERAR O TERMO
            </Button>
            <Button
              variant="outline"
              onClick={() => setNoteFor("request_changes")}
            >
              Pedir mais informações no pedido
            </Button>
            <Button variant="danger" onClick={() => setNoteFor("reject")}>
              Não posso receber agora
            </Button>
          </>
        )}
      </Card>
    </>
  );
}

/** Valor de `datetime-local` (hora local) para daqui a um dia, às 10h. */
function defaultMeetingValue(): string {
  const d = new Date(Date.now() + 24 * 3_600_000);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Entrega: a ONG marca onde e quando recebe o animal e, no encontro, confirma
 * o recebimento. Só então o pet entra no catálogo dela.
 */
function HandoverStep({
  surrender,
  reminder,
  isOng,
  busy,
  run,
}: StepProps & { reminder: string | null; isOng: boolean }) {
  const { handover } = surrender;
  const petName = surrender.pet.name;
  const [place, setPlace] = useState(handover?.place ?? "");
  const [when, setWhen] = useState(defaultMeetingValue);
  const [editing, setEditing] = useState(!handover);

  return (
    <>
      {reminder ? (
        <Card role="status" tone="highlight" className="gap-1">
          <p className="flex items-center gap-2 text-sm font-bold text-neutral-900">
            <Bell className={iconSize.sm} aria-hidden="true" />
            {reminder}
          </p>
        </Card>
      ) : null}

      <Card className="gap-3">
        <CardTitle>Encontro para a entrega</CardTitle>
        {handover && !editing ? (
          <>
            <p className="flex items-start gap-2 text-sm text-neutral-900">
              <CalendarClock className={iconSize.md} aria-hidden="true" />
              <span>
                {new Date(handover.at).toLocaleString("pt-BR", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
                <br />
                <span className="inline-flex items-center gap-1">
                  <MapPin className={iconSize.sm} aria-hidden="true" />
                  {handover.place}
                </span>
              </span>
            </p>
            {isOng ? (
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setEditing(true)}
              >
                Remarcar
              </Button>
            ) : null}
          </>
        ) : isOng ? (
          <>
            <CardDescription>
              O termo está assinado. Combine com {surrender.adopterName} o
              local, o dia e o horário para receber {petName}.
            </CardDescription>
            <Input
              id="surrender-place"
              label="Local do encontro"
              placeholder="Ex.: sede da ONG, Rua das Flores, 100"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
            <Input
              id="surrender-at"
              label="Data e horário"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
            <div className="flex gap-2">
              {handover ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </Button>
              ) : null}
              <Button
                className="flex-1"
                loading={busy}
                onClick={async () => {
                  const date = new Date(when);
                  const ok = await run({
                    action: "set_handover",
                    place,
                    at: Number.isNaN(date.getTime()) ? "" : date.toISOString(),
                  });
                  if (ok) setEditing(false);
                }}
              >
                Marcar encontro
              </Button>
            </div>
          </>
        ) : (
          <CardDescription>
            O termo está assinado. A ONG vai marcar o local, o dia e o horário
            para você levar {petName}. Combinem os detalhes pela conversa.
          </CardDescription>
        )}
      </Card>

      <Card className="gap-3">
        <CardTitle>
          {isOng ? "Confirmar o recebimento" : "O que levar no encontro"}
        </CardTitle>
        {isOng ? (
          <>
            <CardDescription>
              Quando {petName} chegar até você, toque no botão abaixo. Ele entra
              no seu cadastro como &ldquo;Indisponível&rdquo; até você avaliá-lo
              e publicá-lo para adoção.
            </CardDescription>
            <Button
              loading={busy}
              onClick={() => void run({ action: "receive" })}
            >
              Confirmar que recebi {petName}
            </Button>
          </>
        ) : (
          <ul className="list-disc pl-5 text-sm text-neutral-900">
            <li>Carteirinha de vacinação e exames, se tiver.</li>
            <li>Remédios e a ração que ele come.</li>
            <li>Coleira, guia ou caixa de transporte.</li>
            <li>Um brinquedo ou cobertor dele ajuda na adaptação.</li>
          </ul>
        )}
      </Card>
    </>
  );
}
