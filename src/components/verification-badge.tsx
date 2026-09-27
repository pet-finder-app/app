import {
  Badge,
  cn,
  iconSize,
  type BadgeSize,
  type BadgeTone,
} from "@/components/ui";
import { VERIFICATION_STATUS_LABEL, type VerificationStatus } from "@/lib/ong";
import { Check } from "lucide-react";

const TONE: Record<VerificationStatus, BadgeTone> = {
  pendente: "warning",
  em_analise: "info",
  verificada: "success",
  suspensa: "danger",
};

/**
 * Selo de status — aparece no perfil e no painel. `label` sobrescreve o
 * texto padrão (ONG); o adotante usa `ADOPTER_VERIFICATION_STATUS_LABEL` de
 * `lib/adopter.ts`, já que o vocabulário de status é o mesmo dos dois lados.
 *
 * `compact`: selo pequeno e redondo, só com o ícone — para ficar do lado do
 * nome (estilo Twitter). Só aparece quando "verificada"; os outros status
 * já têm destaque próprio (ex.: o card de checklist) e não precisam de selo
 * aqui.
 */
export function VerificationBadge({
  status,
  label,
  size = "md",
  compact = false,
  className,
}: {
  status: VerificationStatus;
  label?: string;
  size?: BadgeSize;
  compact?: boolean;
  className?: string;
}) {
  const text = label ?? VERIFICATION_STATUS_LABEL[status];

  if (compact) {
    if (status !== "verificada") return null;
    return (
      <span
        role="img"
        aria-label={text}
        title={text}
        className={cn(
          "inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-neutral-900 bg-primary",
          className,
        )}
      >
        <Check
          className="size-2.5 text-neutral-900"
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <Badge tone={TONE[status]} size={size} className={className}>
      {status === "verificada" ? (
        <Check className={iconSize.sm} aria-hidden="true" />
      ) : null}
      {text}
    </Badge>
  );
}
