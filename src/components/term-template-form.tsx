"use client";

import {
  Button,
  Card,
  CardDescription,
  CardTitle,
  FormError,
  Textarea,
} from "@/components/ui";
import {
  DEFAULT_TERM_TEMPLATE,
  findUnknownVariables,
  TERM_VARIABLES,
} from "@/lib/term-template";
import { Check } from "lucide-react";
import { useState } from "react";

const ERROR_ID = "term-template-error";

/** Editor do modelo de termo de adoção da ONG. */
export function TermTemplateForm({
  initialBody,
  isCustom,
}: {
  initialBody: string;
  isCustom: boolean;
}) {
  const [body, setBody] = useState(initialBody);
  const [custom, setCustom] = useState(isCustom);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unknown = findUnknownVariables(body);

  async function save(text: string) {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/ong/termo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Não foi possível salvar.");
        return;
      }
      setSavedAt(new Date().toLocaleTimeString("pt-BR"));
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-2">
        <CardTitle>Termo de adoção da sua ONG</CardTitle>
        <CardDescription>
          {custom
            ? "Você está usando o seu próprio termo."
            : "Você está usando o modelo padrão do Petfinder."}{" "}
          O texto abaixo é o que o adotante lê e assina. Os trechos entre{" "}
          <code>{"{{chaves}}"}</code> são preenchidos sozinhos em cada adoção.
        </CardDescription>
        <p className="text-xs text-neutral-600">
          O modelo padrão é um ponto de partida, não um parecer jurídico. Revise
          com um advogado antes de usar.
        </p>
      </Card>

      <Card className="gap-3">
        <Textarea
          id="termBody"
          label="Texto do termo"
          rows={18}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          invalid={unknown.length > 0}
          errorId={ERROR_ID}
        />
        <FormError id={ERROR_ID} collapsible>
          {error ??
            (unknown.length > 0
              ? `Variável desconhecida: ${unknown.map((v) => `{{${v}}}`).join(", ")}. Confira a lista abaixo.`
              : null)}
        </FormError>
        {savedAt && !error ? (
          <p
            role="status"
            className="flex items-center gap-1.5 text-sm font-bold text-lime-800"
          >
            <Check className="size-4" aria-hidden="true" />
            Termo salvo às {savedAt}. Vale para as próximas adoções.
          </p>
        ) : null}
        <Button
          loading={busy}
          loadingLabel="SALVANDO..."
          disabled={unknown.length > 0 || !body.trim()}
          onClick={() => {
            setCustom(true);
            void save(body);
          }}
        >
          SALVAR TERMO
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => {
            setBody(DEFAULT_TERM_TEMPLATE);
            setCustom(false);
            void save("");
          }}
        >
          Voltar ao modelo padrão
        </Button>
      </Card>

      <Card className="gap-2">
        <CardTitle>Dados que o app preenche</CardTitle>
        <ul className="flex flex-col gap-1 text-sm text-neutral-900">
          {TERM_VARIABLES.map((variable) => (
            <li key={variable.name}>
              <code className="font-bold">{`{{${variable.name}}}`}</code>{" "}
              <span className="text-neutral-600">{variable.description}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-neutral-600">
          Termos já gerados não mudam quando você edita o modelo.
        </p>
      </Card>
    </div>
  );
}
