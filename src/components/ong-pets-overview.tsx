"use client";

import { BrutalCard } from "@/components/brutal-card";
import {
  ActivityWave,
  SpeciesPie,
  type ActivityPoint,
} from "@/components/ong-pets-charts";
import { cn, iconSize } from "@/components/ui";
import { PET_STATUS_LABEL, type Pet, type PetStatus } from "@/lib/pet";
import {
  Ban,
  CircleCheck,
  Eye,
  Heart,
  HeartHandshake,
  Hourglass,
  MessageCircle,
  PawPrint,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_ORDER: PetStatus[] = [
  "disponivel",
  "em_processo",
  "adotado",
  "indisponivel",
];

const STATUS_SHORT: Record<PetStatus, string> = {
  disponivel: "Disponível",
  em_processo: "Em processo",
  adotado: "Adotado",
  indisponivel: "Indisponível",
};

/** Cor da marca no gráfico + ícone: o estado nunca fica só na cor. */
const STATUS_STYLE: Record<
  PetStatus,
  { stroke: string; dot: string; icon: LucideIcon }
> = {
  disponivel: {
    stroke: "stroke-lime-600",
    dot: "bg-lime-600",
    icon: CircleCheck,
  },
  em_processo: {
    stroke: "stroke-amber-400",
    dot: "bg-amber-400",
    icon: Hourglass,
  },
  adotado: {
    stroke: "stroke-zinc-600",
    dot: "bg-zinc-600",
    icon: HeartHandshake,
  },
  indisponivel: {
    stroke: "stroke-gray-400",
    dot: "bg-gray-400",
    icon: Ban,
  },
};

/** Número que sobe de 0 até o valor; respeita `prefers-reduced-motion`. */
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Movimento reduzido: o primeiro quadro já termina a contagem.
    const instant = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = instant ? 1 : Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: string;
  index: number;
}) {
  const shown = useCountUp(value);
  return (
    <div
      className={cn(
        "rise-in flex items-center gap-3 rounded-xl border border-neutral-900 p-3",
        tone,
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-900 bg-white text-neutral-900">
        <Icon className={iconSize.md} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xl leading-none font-bold text-neutral-900 tabular-nums">
          {shown}
        </p>
        <p className="mt-1 text-xs leading-tight text-neutral-900">{label}</p>
      </div>
    </div>
  );
}

/** Rosca de status: cada fatia desenha em sequência, com o total no centro. */
function StatusDonut({
  counts,
  total,
}: {
  counts: Record<PetStatus, number>;
  total: number;
}) {
  const GAP = 1.2;
  const starts = STATUS_ORDER.map((_, i) =>
    STATUS_ORDER.slice(0, i).reduce(
      (sum, s) => sum + (counts[s] / total) * 100,
      0,
    ),
  );

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-32 shrink-0">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Pets por status: ${STATUS_ORDER.map(
            (s) => `${counts[s]} ${PET_STATUS_LABEL[s].toLowerCase()}`,
          ).join(", ")}`}
          className="size-full -rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            strokeWidth="12"
            pathLength={100}
            className="stroke-neutral-100"
          />
          {STATUS_ORDER.map((status, i) => {
            if (counts[status] === 0) return null;
            const share = (counts[status] / total) * 100;
            const visible = Math.max(share - GAP, 0.5);
            const start = starts[i];
            return (
              <circle
                key={status}
                cx="50"
                cy="50"
                r="38"
                fill="none"
                strokeWidth="12"
                strokeLinecap="butt"
                pathLength={100}
                strokeDasharray={`${visible} ${100 - visible}`}
                strokeDashoffset={-start}
                className={cn("ring-draw", STATUS_STYLE[status].stroke)}
                style={{ animationDelay: `${start * 6}ms` }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl leading-none font-bold text-neutral-900 tabular-nums">
            {total}
          </span>
          <span className="mt-0.5 text-[10px] font-bold tracking-wide text-neutral-600 uppercase">
            {total === 1 ? "pet" : "pets"}
          </span>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-2">
        {STATUS_ORDER.map((status) => {
          const { dot, icon: Icon } = STATUS_STYLE[status];
          return (
            <li key={status} className="flex items-center gap-2 text-sm">
              <span
                className={cn("size-3 shrink-0 rounded-full", dot)}
                aria-hidden="true"
              />
              <Icon
                className={cn(iconSize.sm, "shrink-0 text-neutral-900")}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 text-sm leading-tight text-neutral-900">
                {STATUS_SHORT[status]}
              </span>
              <span className="font-bold text-neutral-900 tabular-nums">
                {counts[status]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Ranking dos pets mais procurados: barra empilhada de interessados + curtidas. */
function PopularBars({
  rows,
}: {
  rows: { id: string; name: string; interested: number; likes: number }[];
}) {
  const max = Math.max(...rows.map((r) => r.interested + r.likes), 1);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-1.5">
        <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-neutral-600 uppercase">
          <TrendingUp className={iconSize.sm} aria-hidden="true" />
          Mais procurados
        </h3>
        <div className="flex items-center gap-3 text-xs text-neutral-900">
          <span className="flex items-center gap-1">
            <span
              className="size-2.5 rounded-full bg-lime-600"
              aria-hidden="true"
            />
            Interessados
          </span>
          <span className="flex items-center gap-1">
            <span
              className="size-2.5 rounded-full bg-rose-400"
              aria-hidden="true"
            />
            Curtidas
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <li key={row.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-bold text-neutral-900">
                {row.name}
              </span>
              <span className="shrink-0 text-xs text-neutral-600 tabular-nums">
                {row.interested} interessados · {row.likes} curtidas
              </span>
            </div>
            <div
              className="flex h-3 overflow-hidden rounded-full bg-neutral-100"
              style={{ width: "100%" }}
            >
              <div
                className="flex h-full gap-0.5"
                style={{
                  width: `${((row.interested + row.likes) / max) * 100}%`,
                }}
              >
                {row.interested > 0 ? (
                  <span
                    className="grow-x h-full rounded-full bg-lime-600"
                    style={{
                      flexGrow: row.interested,
                      animationDelay: `${index * 90}ms`,
                    }}
                  />
                ) : null}
                {row.likes > 0 ? (
                  <span
                    className="grow-x h-full rounded-full bg-rose-400"
                    style={{
                      flexGrow: row.likes,
                      animationDelay: `${index * 90 + 120}ms`,
                    }}
                  />
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Painel de resumo da tela de gestão: totais, rosca por status e ranking de interesse. */
export function OngPetsOverview({
  pets,
  likesByPet,
  interestedByPet,
  activity,
  showTotals = true,
}: {
  /** Mostra os quatro números de topo (a dashboard já tem os próprios KPIs). */
  showTotals?: boolean;
  pets: Pet[];
  likesByPet: Record<string, number>;
  interestedByPet: Record<string, number>;
  activity: ActivityPoint[];
}) {
  const counts = STATUS_ORDER.reduce(
    (acc, status) => ({
      ...acc,
      [status]: pets.filter((pet) => pet.status === status).length,
    }),
    {} as Record<PetStatus, number>,
  );
  const totalLikes = pets.reduce(
    (sum, pet) => sum + (likesByPet[pet.id] ?? 0),
    0,
  );
  const totalInterested = pets.reduce(
    (sum, pet) => sum + (interestedByPet[pet.id] ?? 0),
    0,
  );
  const totalViews = pets.reduce((sum, pet) => sum + pet.views, 0);

  const ranking = pets
    .map((pet) => ({
      id: pet.id,
      name: pet.name,
      interested: interestedByPet[pet.id] ?? 0,
      likes: likesByPet[pet.id] ?? 0,
    }))
    .filter((row) => row.interested + row.likes > 0)
    .sort((a, b) => b.interested * 2 + b.likes - (a.interested * 2 + a.likes))
    .slice(0, 5);

  return (
    <BrutalCard className="gap-5">
      {showTotals ? (
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            icon={PawPrint}
            label="Pets ativos"
            value={pets.length}
            tone="bg-primary-faint"
            index={0}
          />
          <StatTile
            icon={Eye}
            label="Visualizações"
            value={totalViews}
            tone="bg-accent-yellow"
            index={1}
          />
          <StatTile
            icon={MessageCircle}
            label="Interessados"
            value={totalInterested}
            tone="bg-primary-soft"
            index={2}
          />
          <StatTile
            icon={Heart}
            label="Curtidas"
            value={totalLikes}
            tone="bg-accent-peach"
            index={3}
          />
        </div>
      ) : null}

      <div className={showTotals ? "border-t border-line pt-4" : undefined}>
        <h3 className="mb-3 text-xs font-bold tracking-wide text-neutral-600 uppercase">
          Status de adoção
        </h3>
        <StatusDonut counts={counts} total={pets.length} />
      </div>

      <div className="border-t border-line pt-4">
        <SpeciesPie pets={pets} />
      </div>

      <div className="border-t border-line pt-4">
        <ActivityWave data={activity} />
      </div>

      <div className="border-t border-line pt-4">
        {ranking.length > 0 ? (
          <PopularBars rows={ranking} />
        ) : (
          <p className="text-sm text-neutral-600">
            Quando adotantes curtirem ou demonstrarem interesse, os pets mais
            procurados aparecem aqui.
          </p>
        )}
      </div>
    </BrutalCard>
  );
}
