"use client";

import { Button, Card, Select, Textarea } from "@/components/ui";
import { api, result, type Schema } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/queries";
import { ErrorMessage, field } from "./common";

export function ReportForm({
  subjectId,
  subjectType,
}: {
  subjectId: string;
  subjectType: Schema["ReportRequest"]["subject_type"];
}) {
  const mutation = useApiMutation(
    (body: Schema["ReportRequest"]) =>
      result(api.POST("/v1/reports", { body })),
    [["reports"]],
  );
  return (
    <Card>
      <details>
        <summary className="cursor-pointer font-bold">
          Denunciar um problema
        </summary>
        <form
          className="mt-3 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            mutation.mutate({
              subject_id: subjectId,
              subject_type: subjectType,
              category: field(
                form,
                "category",
              ) as Schema["ReportRequest"]["category"],
              description: field(form, "report-description"),
            });
          }}
        >
          <Select
            id="category"
            label="Motivo"
            options={[
              { value: "payment_request", label: "Pedido de pagamento" },
              { value: "fraud", label: "Fraude" },
              { value: "harassment", label: "Assédio" },
              { value: "inappropriate_content", label: "Conteúdo inadequado" },
              {
                value: "off_platform_contact",
                label: "Contato fora da plataforma",
              },
              { value: "animal_welfare", label: "Bem-estar animal" },
              { value: "other", label: "Outro" },
            ]}
          />
          <Textarea
            id="report-description"
            label="Descreva o problema"
            minLength={10}
            maxLength={5000}
            required
          />
          <ErrorMessage error={mutation.error} />
          {mutation.isSuccess && <p role="status">Denúncia enviada.</p>}
          <Button type="submit" variant="outline" loading={mutation.isPending}>
            Enviar denúncia
          </Button>
        </form>
      </details>
    </Card>
  );
}
