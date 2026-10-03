"use client";

import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  Checkbox,
  cn,
  fieldControlClass,
  iconSize,
  Input,
  LinkButton,
  shadowSoft,
  Textarea,
} from "@/components/ui";
import {
  ADOPTION_STATUS_LABEL,
  ADOPTION_STEPS,
  adoptionStageLabel,
  createEmptyAdoptionForm,
  FOLLOW_UP_LABEL,
  handoverReminder,
  isAdoptionActive,
  turnHeadline,
  type Adoption,
  type FollowUp,
  type SignerRole,
} from "@/lib/adoption";
import {
  Bell,
  CalendarClock,
  Camera,
  Check,
  FileText,
  MapPin,
  MessageCircle,
  PartyPopper,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Answer,
  CancelBox,
  ConfirmButton,
  ErrorToast,
  HistoryCard,
  ProcessSteps,
  TermSignCard,
  WaitingCard,
} from "./process-cards";

type AdoptionPanelProps = {
  initialAdoption: Adoption;
  role: SignerRole;
  chatHref: string;
};

type ActionBody = { action: string } & Record<string, unknown>;

/**
 * Painel da adoção, igual para os dois lados: linha do tempo no topo e, embaixo,
 * só o que a pessoa pode fazer na etapa atual (ficha, análise, assinatura,
 * entrega, acompanhamento).
 */
export function AdoptionPanel({
  initialAdoption,
  role,
  chatHref,
}: AdoptionPanelProps) {
  const router = useRouter();
  const [adoption, setAdoption] = useState(initialAdoption);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const isOng = role === "ong";
  const active = isAdoptionActive(adoption.status);
  const headline = turnHeadline(adoption, role);

  function applyAdoption(next: Adoption) {
    setAdoption(next);
    router.refresh();
  }

  async function run(body: ActionBody): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/adocoes/${adoption.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        adoption?: Adoption;
        devCode?: string;
        message?: string;
      };
      if (!response.ok || !data.adoption) {
        setError(data.message ?? "Não foi possível concluir.");
        return false;
      }
      setAdoption(data.adoption);
      setDevCode(data.devCode ?? null);
      router.refresh();
      return true;
    } catch {
      setError("Falha de conexão. Tente de novo.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const currentStep = ADOPTION_STEPS.findIndex(
    (s) => s.status === adoption.status,
  );

  return (
    <div className="flex flex-col gap-4">
      <Card as="header" className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-neutral-900">
              Adoção de {adoption.petName}
            </h1>
            <p className="text-sm text-neutral-600">
              {isOng
                ? `Adotante: ${adoption.adopterName}`
                : "Processo de adoção"}
            </p>
          </div>
          <Badge
            tone={
              adoption.status === "concluida"
                ? "success"
                : adoption.status === "recusada" ||
                    adoption.status === "cancelada"
                  ? "danger"
                  : "info"
            }
          >
            {adoptionStageLabel(adoption)}
          </Badge>
        </div>

        {currentStep >= 0 ? (
          <ProcessSteps
            steps={ADOPTION_STEPS}
            currentIndex={currentStep}
            label="Etapas da adoção"
          />
        ) : null}

        {active && headline ? (
          headline.mine ? (
            <p className="rounded-2xl bg-accent-yellow px-3 py-2 text-sm font-bold text-neutral-900">
              {headline.text}
            </p>
          ) : (
            <p className="text-sm text-neutral-600">
              {headline.text} Avisamos você por aqui e na conversa quando mudar.
            </p>
          )
        ) : null}

        <div className="flex flex-wrap gap-2">
          <LinkButton href={chatHref} variant="pill" size="sm">
            <MessageCircle className={iconSize.sm} aria-hidden="true" />
            Conversa
          </LinkButton>
          {adoption.term ? (
            <LinkButton
              href={`/adocoes/${adoption.id}/termo`}
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

      <ErrorToast message={error} onClose={() => setError(null)} />

      {adoption.status === "ficha" ? (
        isOng ? (
          <WaitingCard
            title="Aguardando a ficha"
            text={`${adoption.adopterName} precisa preencher a ficha de adoção. Você pode conversar pelo chat enquanto isso.`}
          />
        ) : (
          <FormStep adoption={adoption} busy={busy} run={run} />
        )
      ) : null}

      {adoption.status === "analise" ? (
        isOng ? (
          <AnalysisStep adoption={adoption} busy={busy} run={run} />
        ) : (
          <WaitingCard
            title="A ONG está analisando"
            text={
              adoption.visit.required
                ? `A ONG pediu uma visita${adoption.visit.scheduledFor ? ` (${adoption.visit.scheduledFor})` : ""}. Combinem os detalhes na conversa.`
                : "A ONG vai ler a sua ficha e responder em breve."
            }
          />
        )
      ) : null}

      {adoption.status === "termo" && adoption.term ? (
        <TermSignCard
          term={adoption.term}
          title="Termo de adoção"
          ariaLabel="Texto do termo de adoção"
          adopterName={adoption.adopterName}
          role={role}
          busy={busy}
          devCode={devCode}
          run={run}
          signLabel="LI E ASSINO O TERMO"
        />
      ) : null}

      {adoption.status === "entrega" ? (
        <HandoverStep
          adoption={adoption}
          role={role}
          busy={busy}
          devCode={devCode}
          run={run}
        />
      ) : null}

      {adoption.status === "acompanhamento" ? (
        <FollowUpStep
          adoption={adoption}
          role={role}
          busy={busy}
          run={run}
          onUpdated={applyAdoption}
        />
      ) : null}

      {adoption.status === "concluida" ? (
        <Card className="gap-1">
          <CardTitle>Adoção concluída</CardTitle>
          <CardDescription>
            {adoption.petName} está num lar novo. Obrigado por fazer parte
            disso!
          </CardDescription>
        </Card>
      ) : null}

      {adoption.status === "devolvida" ? (
        <Card className="gap-1">
          <CardTitle>{ADOPTION_STATUS_LABEL.devolvida}</CardTitle>
          <CardDescription>
            {adoption.petName} voltou para a ONG. Obrigado por ter dado um lar a
            ele até aqui.
          </CardDescription>
        </Card>
      ) : null}

      {adoption.status === "recusada" || adoption.status === "cancelada" ? (
        <Card className="gap-1">
          <CardTitle>{ADOPTION_STATUS_LABEL[adoption.status]}</CardTitle>
          {adoption.decisionNote ? (
            <CardDescription>Motivo: {adoption.decisionNote}</CardDescription>
          ) : null}
          <CardDescription>
            {adoption.petName} voltou a ficar disponível para adoção.
          </CardDescription>
        </Card>
      ) : null}

      <HistoryCard events={adoption.events} />

      {active &&
      (adoption.status === "ficha" ||
        adoption.status === "analise" ||
        adoption.status === "termo" ||
        adoption.status === "entrega") ? (
        <CancelBox
          triggerLabel={isOng ? "Cancelar este processo" : "Desistir da adoção"}
          description="O pet volta a ficar disponível e o processo é encerrado. Isso não pode ser desfeito."
          busy={busy}
          run={run}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

type StepProps = {
  adoption: Adoption;
  busy: boolean;
  run: (body: ActionBody) => Promise<boolean>;
};

/** Valor de `datetime-local` (hora local) para daqui a um dia, às 10h. */
function defaultMeetingValue(): string {
  const d = new Date(Date.now() + 24 * 3_600_000);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Etapa de entrega: marcar local/data/horário do encontro, lembrete perto do
 * horário, código (OTP) do adotante e confirmação de entrega (ONG) e de
 * recebimento (adotante). O pet só vira "Adotado" depois das duas.
 */
function HandoverStep({
  adoption,
  role,
  busy,
  devCode,
  run,
}: StepProps & { role: SignerRole; devCode: string | null }) {
  const isOng = role === "ong";
  const handover = adoption.handover ?? null;
  const [place, setPlace] = useState(handover?.place ?? "");
  const [when, setWhen] = useState(defaultMeetingValue);
  const [editing, setEditing] = useState(!handover);
  const [code, setCode] = useState("");
  const [otpEnabled, setOtpEnabled] = useState(handover?.otpEnabled ?? true);
  const confirmed = Boolean(
    handover?.ongDeliveredAt || handover?.adopterReceivedAt,
  );
  const reminder = handoverReminder(handover);

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
            {confirmed ? null : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setEditing(true)}
                >
                  Remarcar
                </Button>
                <p className="text-xs text-neutral-600">
                  Remarcar muda o dia, a hora ou o local e avisa{" "}
                  {isOng ? adoption.adopterName : "a ONG"} na conversa.
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <CardDescription>
              {isOng
                ? `O termo está assinado. Combine com ${adoption.adopterName} o local, o dia e o horário para entregar ${adoption.petName}.`
                : `O termo está assinado. Combine com a ONG o local, o dia e o horário para buscar ${adoption.petName}.`}
            </CardDescription>
            <Input
              id="handover-place"
              label="Local do encontro"
              placeholder="Ex.: sede da ONG, Rua das Flores, 100"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
            <Input
              id="handover-at"
              label="Data e horário"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
            <Checkbox
              id="handover-otp"
              label="Exigir o código do adotante na entrega (mais seguro)"
              checked={otpEnabled}
              onChange={(e) => setOtpEnabled(e.target.checked)}
            />
            <p className="text-xs text-neutral-600">
              Com o código, o adotante vê 6 números no app dele e os mostra a
              você no encontro. Assim a entrega só vale com a pessoa presente.
            </p>
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
                    action: "schedule_handover",
                    place,
                    at: Number.isNaN(date.getTime()) ? "" : date.toISOString(),
                    otpEnabled,
                  });
                  if (ok) setEditing(false);
                }}
              >
                Marcar encontro
              </Button>
            </div>
          </>
        )}
      </Card>

      {handover ? (
        <Card className="gap-3">
          <CardTitle>Confirmar a entrega</CardTitle>
          <ul className="flex flex-col gap-1 text-sm text-neutral-900">
            <li className="flex items-center gap-2">
              <Check
                className={cn(
                  iconSize.sm,
                  handover.ongDeliveredAt ? "text-lime-800" : "opacity-30",
                )}
                aria-hidden="true"
              />
              {handover.ongDeliveredAt
                ? "A ONG confirmou a entrega"
                : "A ONG ainda não confirmou a entrega"}
            </li>
            <li className="flex items-center gap-2">
              <Check
                className={cn(
                  iconSize.sm,
                  handover.adopterReceivedAt ? "text-lime-800" : "opacity-30",
                )}
                aria-hidden="true"
              />
              {handover.adopterReceivedAt
                ? "O adotante confirmou o recebimento"
                : "O adotante ainda não confirmou o recebimento"}
            </li>
          </ul>

          {isOng ? (
            handover.ongDeliveredAt ? (
              <CardDescription>
                Entrega confirmada. Falta {adoption.adopterName} confirmar o
                recebimento.
              </CardDescription>
            ) : (
              <>
                {handover.otpEnabled ? (
                  <Input
                    id="handover-code"
                    label="Código do adotante"
                    hint="No encontro, peça o código de 6 dígitos que aparece no app do adotante."
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                ) : null}
                <ConfirmButton
                  label={`Confirmar que entreguei ${adoption.petName}`}
                  question={`Você já entregou ${adoption.petName} a ${adoption.adopterName}? Isso não pode ser desfeito.`}
                  confirmLabel="Sim, entreguei"
                  busy={busy}
                  onConfirm={() =>
                    run({ action: "deliver", code: code.trim() })
                  }
                />
              </>
            )
          ) : (
            <>
              {handover.otpEnabled && !handover.ongDeliveredAt ? (
                <div className="flex flex-col gap-2 rounded-2xl bg-primary-faint p-3">
                  <p className="text-sm text-neutral-900">
                    No encontro, mostre este código à ONG para liberar a
                    entrega. Só mostre quando estiver com o pet e não envie o
                    código por mensagem.
                  </p>
                  {devCode ? (
                    <p
                      role="status"
                      className="text-2xl font-bold tracking-widest text-neutral-900"
                    >
                      {devCode}
                    </p>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start"
                      loading={busy}
                      onClick={() => void run({ action: "reveal_otp" })}
                    >
                      Ver meu código
                    </Button>
                  )}
                </div>
              ) : null}
              {handover.adopterReceivedAt ? (
                <CardDescription>
                  Você confirmou o recebimento. Falta a ONG confirmar a entrega.
                </CardDescription>
              ) : (
                <ConfirmButton
                  label={`Confirmar que recebi ${adoption.petName}`}
                  question={`Você já está com ${adoption.petName}? Toque em "Sim" só depois de receber o pet.`}
                  confirmLabel="Sim, recebi"
                  busy={busy}
                  onConfirm={() => run({ action: "confirm_receipt" })}
                />
              )}
            </>
          )}
        </Card>
      ) : null}
    </>
  );
}

/** Etapa 1 (adotante): ficha de adoção. */
function FormStep({ adoption, busy, run }: StepProps) {
  const [form, setForm] = useState(
    adoption.form ? { ...adoption.form } : { ...createEmptyAdoptionForm() },
  );
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Card className="gap-3">
      <CardTitle>Ficha de adoção</CardTitle>
      <CardDescription>
        Responda com calma: é assim que a ONG conhece você e escolhe o melhor
        lar para {adoption.petName}.
      </CardDescription>
      {adoption.decisionNote ? (
        <p
          className={cn(
            "rounded-2xl bg-accent-yellow px-3 py-2 text-sm text-neutral-900",
            shadowSoft.sm,
          )}
        >
          A ONG pediu ajustes: {adoption.decisionNote}
        </p>
      ) : null}
      <Textarea
        id="reason"
        label="Por que você quer adotar este pet?"
        value={form.reason}
        onChange={(e) => set("reason", e.target.value)}
      />
      <Textarea
        id="household"
        label="Quem mora na sua casa?"
        hint="Adultos, crianças, idosos. Todos concordam com a adoção?"
        value={form.household}
        onChange={(e) => set("household", e.target.value)}
      />
      <Textarea
        id="otherPets"
        label="Você tem outros animais? (opcional)"
        value={form.otherPets}
        onChange={(e) => set("otherPets", e.target.value)}
      />
      <Textarea
        id="routine"
        label="Onde o pet vai ficar e quem cuida dele no dia a dia?"
        value={form.routine}
        onChange={(e) => set("routine", e.target.value)}
      />
      <Input
        id="hoursAlone"
        label="Quantas horas por dia ele ficaria sozinho? (opcional)"
        inputMode="numeric"
        value={form.hoursAlone ?? ""}
        onChange={(e) => set("hoursAlone", e.target.value)}
      />
      <Textarea
        id="experience"
        label="Você já cuidou de animais? Conte um pouco (opcional)"
        value={form.experience ?? ""}
        onChange={(e) => set("experience", e.target.value)}
      />
      <Checkbox
        id="agreesNeutering"
        label="Aceito castrar o pet quando a idade permitir"
        checked={form.agreesNeutering}
        onChange={(e) => set("agreesNeutering", e.target.checked)}
      />
      <Checkbox
        id="agreesVisit"
        label="Aceito receber uma visita combinada da ONG"
        checked={form.agreesVisit}
        onChange={(e) => set("agreesVisit", e.target.checked)}
      />
      <Checkbox
        id="agreesFollowUp"
        label="Aceito mandar notícias e fotos depois da adoção (1 semana, 1 mês e 3 meses)"
        checked={form.agreesFollowUp}
        onChange={(e) => set("agreesFollowUp", e.target.checked)}
      />
      <Button
        loading={busy}
        loadingLabel="ENVIANDO..."
        onClick={() => void run({ action: "submit_form", form })}
      >
        ENVIAR FICHA PARA A ONG
      </Button>
    </Card>
  );
}

/** Etapa 2 (ONG): ler a ficha, decidir sobre a visita e aprovar/pedir ajustes/recusar. */
function AnalysisStep({ adoption, busy, run }: StepProps) {
  const [visitRequired, setVisitRequired] = useState(adoption.visit.required);
  const [scheduledFor, setScheduledFor] = useState(adoption.visit.scheduledFor);
  const [visitNotes, setVisitNotes] = useState(adoption.visit.notes);
  const [visitDone, setVisitDone] = useState(adoption.visit.done);
  const [note, setNote] = useState("");
  const [noteFor, setNoteFor] = useState<"request_changes" | "reject" | null>(
    null,
  );
  const form = adoption.form;

  return (
    <>
      <Card className="gap-2">
        <CardTitle>Ficha de {adoption.adopterName}</CardTitle>
        {form ? (
          <dl className="flex flex-col gap-2 text-sm text-neutral-900">
            <Answer label="Por que quer adotar" value={form.reason} />
            <Answer label="Quem mora na casa" value={form.household} />
            <Answer
              label="Outros animais"
              value={form.otherPets || "Não informou (provavelmente nenhum)"}
            />
            <Answer label="Onde o pet vai ficar" value={form.routine} />
            <Answer
              label="Horas sozinho por dia"
              value={form.hoursAlone || "Não informou"}
            />
            <Answer
              label="Experiência com animais"
              value={form.experience || "Não informou"}
            />
            <Answer
              label="Aceita"
              value={[
                `castrar: ${form.agreesNeutering ? "sim" : "não"}`,
                `visita: ${form.agreesVisit ? "sim" : "não"}`,
                `acompanhamento: ${form.agreesFollowUp ? "sim" : "não"}`,
              ].join(" · ")}
            />
          </dl>
        ) : null}
        <p className="text-xs text-neutral-600">
          O perfil completo do adotante (documento, endereço e moradia) está no
          perfil dele, que você vê na conversa.
        </p>
      </Card>

      <Card className="gap-3">
        <CardTitle>Visita (opcional)</CardTitle>
        <Checkbox
          id="visitRequired"
          label="Quero fazer uma visita antes de aprovar"
          checked={visitRequired}
          onChange={(e) => setVisitRequired(e.target.checked)}
        />
        {visitRequired ? (
          <>
            <Input
              id="scheduledFor"
              label="Quando"
              placeholder="Sábado, 10h"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
            <Textarea
              id="visitNotes"
              label="Anotações da visita (opcional)"
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
            />
            <Checkbox
              id="visitDone"
              label="A visita já foi feita e está tudo certo"
              checked={visitDone}
              onChange={(e) => setVisitDone(e.target.checked)}
            />
          </>
        ) : null}
        <Button
          variant="outline"
          loading={busy}
          onClick={() =>
            void run({
              action: "set_visit",
              required: visitRequired,
              scheduledFor,
              notes: visitNotes,
              done: visitDone,
            })
          }
        >
          Salvar visita
        </Button>
      </Card>

      <Card className="gap-3">
        <CardTitle>Sua decisão</CardTitle>
        {noteFor ? (
          <>
            <Textarea
              id="decisionNote"
              label={
                noteFor === "reject"
                  ? "Motivo (será mostrado à pessoa, com educação)"
                  : "O que precisa mudar na ficha"
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
            <ConfirmButton
              label="APROVAR E GERAR O TERMO"
              question={`Aprovar ${adoption.adopterName} para adotar ${adoption.petName}? O termo será gerado para assinatura.`}
              confirmLabel="Sim, aprovar"
              busy={busy}
              onConfirm={() => run({ action: "approve" })}
            />
            <Button
              variant="outline"
              onClick={() => setNoteFor("request_changes")}
            >
              Pedir ajustes na ficha
            </Button>
            <Button variant="danger" onClick={() => setNoteFor("reject")}>
              Não seguir com esta adoção
            </Button>
          </>
        )}
      </Card>
    </>
  );
}

/**
 * Etapa 5: relatos depois da adoção. O adotante responde um pedido por vez
 * (o próximo só abre na data), com texto e, se quiser, uma foto; a ONG
 * acompanha e conclui quando terminar os prazos.
 */
function FollowUpStep({
  adoption,
  role,
  busy,
  run,
  onUpdated,
}: StepProps & {
  role: SignerRole;
  onUpdated: (adoption: Adoption) => void;
}) {
  const now = new Date().toISOString();
  const pending = adoption.followUps.filter((f) => f.receivedAt === null);
  const nextOpenId =
    pending.find((f) => f.dueAt <= now)?.id ?? pending[0]?.id ?? null;
  const allDone = pending.length === 0;
  const last = adoption.followUps.at(-1);

  return (
    <>
      <Card tone="success" className="gap-2">
        <p className="flex items-center gap-2 text-base font-bold text-neutral-900">
          <PartyPopper className={iconSize.md} aria-hidden="true" />
          {role === "adopter"
            ? `Parabéns! ${adoption.petName} agora é da sua família.`
            : `${adoption.petName} foi adotado!`}
        </p>
        <p className="text-sm text-neutral-900">
          A entrega foi registrada
          {adoption.deliveredAt
            ? ` em ${new Date(adoption.deliveredAt).toLocaleDateString("pt-BR")}`
            : ""}
          . {role === "adopter" ? "Guarde o" : "O"} termo assinado em &ldquo;Ver
          termo&rdquo;.
        </p>
        <p className="text-xs text-neutral-600">
          A adoção fica <strong>concluída</strong> quando a ONG encerrar o
          acompanhamento, depois dos relatos de 1 semana, 1 mês e 3 meses
          {last
            ? ` (o último a partir de ${new Date(last.dueAt).toLocaleDateString("pt-BR")})`
            : ""}
          .
        </p>
      </Card>

      <Card className="gap-3">
        <CardTitle>Acompanhamento</CardTitle>
        <CardDescription>
          {role === "adopter"
            ? `Conte como ${adoption.petName} está se adaptando, com texto e, se quiser, uma foto. A ONG é avisada na conversa a cada relato.`
            : `Notícias que ${adoption.adopterName} manda sobre ${adoption.petName}.`}
        </CardDescription>
        <ul className="flex flex-col gap-3">
          {adoption.followUps.map((followUp) => (
            <FollowUpItem
              key={followUp.id}
              adoptionId={adoption.id}
              followUp={followUp}
              role={role}
              isNext={followUp.id === nextOpenId}
              petName={adoption.petName}
              onUpdated={onUpdated}
            />
          ))}
        </ul>
        {role === "ong" ? (
          <ConfirmButton
            label="Concluir a adoção"
            question={
              allDone
                ? "Encerrar o acompanhamento e concluir a adoção?"
                : "Ainda há relatos pendentes. Concluir mesmo assim?"
            }
            confirmLabel="Sim, concluir"
            variant="outline"
            busy={busy}
            onConfirm={() => run({ action: "close" })}
          />
        ) : null}
      </Card>
    </>
  );
}

/** Um pedido de notícias: fechado até a data, aberto para escrever, ou já respondido. */
function FollowUpItem({
  adoptionId,
  followUp,
  role,
  isNext,
  petName,
  onUpdated,
}: {
  adoptionId: string;
  followUp: FollowUp;
  role: SignerRole;
  isNext: boolean;
  petName: string;
  onUpdated: (adoption: Adoption) => void;
}) {
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const due = followUp.dueAt <= new Date().toISOString();
  const dueDate = new Date(followUp.dueAt).toLocaleDateString("pt-BR");

  async function send() {
    setError(null);
    if (!note.trim()) {
      setError(`Escreva como ${petName} está se adaptando.`);
      return;
    }
    setSending(true);
    try {
      const form = new FormData();
      form.set("followUpId", followUp.id);
      form.set("note", note);
      if (photo) form.set("photo", photo);
      const response = await fetch(
        `/api/adocoes/${adoptionId}/acompanhamento`,
        {
          method: "POST",
          body: form,
        },
      );
      const data = (await response.json()) as {
        adoption?: Adoption;
        message?: string;
      };
      if (!response.ok || !data.adoption) {
        setError(data.message ?? "Não foi possível enviar.");
        return;
      }
      onUpdated(data.adoption);
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-neutral-100 p-3">
      <p className="text-sm font-bold text-neutral-900">
        Depois de {FOLLOW_UP_LABEL[followUp.kind]}
        <span className="font-normal text-neutral-600">
          {" "}
          · {due ? "pode responder agora" : `abre em ${dueDate}`}
        </span>
      </p>

      {followUp.receivedAt ? (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs font-bold text-lime-800">
            <Check className="size-4" aria-hidden="true" />
            Enviado em {new Date(followUp.receivedAt).toLocaleString("pt-BR")}
          </p>
          <p className="text-sm whitespace-pre-line text-neutral-900">
            {followUp.note}
          </p>
          {followUp.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={followUp.photoUrl}
              alt={`Foto de ${petName} enviada no relato`}
              className="max-h-64 w-full rounded-2xl object-cover"
            />
          ) : null}
        </div>
      ) : role === "adopter" ? (
        isNext ? (
          <>
            <Textarea
              id={`followup-${followUp.id}`}
              label="Como ele está?"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError(null);
              }}
              invalid={Boolean(error)}
              errorId={`followup-error-${followUp.id}`}
            />
            <label className="flex flex-col gap-1 text-sm font-semibold text-neutral-900">
              <span className="flex items-center gap-1.5">
                <Camera className={iconSize.sm} aria-hidden="true" />
                Foto (opcional)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className={cn(fieldControlClass.light, "text-xs")}
              />
            </label>
            {error ? (
              <p
                id={`followup-error-${followUp.id}`}
                role="alert"
                className="rounded-2xl bg-accent-peach px-3 py-2 text-sm font-semibold text-neutral-900"
              >
                {error}
              </p>
            ) : null}
            <Button size="sm" loading={sending} onClick={() => void send()}>
              Enviar notícias
            </Button>
          </>
        ) : (
          <p className="text-sm text-neutral-600">
            Este pedido abre depois do anterior, a partir de {dueDate}.
          </p>
        )
      ) : (
        <p className="text-sm text-neutral-600">
          {due ? "Ainda não respondeu." : `Chega a partir de ${dueDate}.`}
        </p>
      )}
    </li>
  );
}
