import { cn, iconSize } from "@/components/ui";
import {
  PET_SPECIES_KEYS,
  PET_SPECIES_LABEL,
  type Pet,
  type PetSpecies,
} from "@/lib/pet";
import { Activity, PieChart } from "lucide-react";

export type ActivityPoint = {
  label: string;
  likes: number;
  interests: number;
};

const W = 300;
const H = 110;
const PAD_TOP = 8;

/** Curva suave (Catmull-Rom para Bézier) passando por todos os pontos. */
function smoothPath(points: [number, number][]) {
  return points.reduce((path, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [x0, y0] = points[i - 2] ?? points[i - 1];
    const [x1, y1] = points[i - 1];
    const [x3, y3] = points[i + 1] ?? [x, y];
    const c1x = x1 + (x - x0) / 6;
    // Limita os controles ao intervalo dos dois pontos: a onda não passa de
    // zero nem estoura o pico (sem "barriga" abaixo da linha de base).
    const lo = Math.min(y1, y);
    const hi = Math.max(y1, y);
    const c1y = Math.min(Math.max(y1 + (y - y0) / 6, lo), hi);
    const c2x = x - (x3 - x1) / 6;
    const c2y = Math.min(Math.max(y - (y3 - y1) / 6, lo), hi);
    return `${path} C${c1x} ${c1y} ${c2x} ${c2y} ${x} ${y}`;
  }, "");
}

const WAVE_SERIES = [
  { key: "likes", stroke: "stroke-rose-400", fill: "fill-rose-400/25" },
  { key: "interests", stroke: "stroke-lime-600", fill: "fill-lime-600/25" },
] as const;

/** Gráfico de onda: curtidas e interessados dos últimos dias, em áreas suaves. */
export function ActivityWave({ data }: { data: ActivityPoint[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.likes, d.interests)), 1);
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => H - (v / max) * (H - PAD_TOP);

  const series = WAVE_SERIES.map((s) => {
    const line = smoothPath(
      data.map((d, i) => [x(i), y(d[s.key])] as [number, number]),
    );
    return { ...s, d: line, area: `${line} L${W} ${H} L0 ${H} Z` };
  });

  const summary = data
    .map((d) => `${d.label}: ${d.interests} interessados, ${d.likes} curtidas`)
    .join("; ");

  return (
    <div>
      <div className="mb-3 flex flex-col gap-1.5">
        <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-neutral-600 uppercase">
          <Activity className={iconSize.sm} aria-hidden="true" />
          Atividade nos últimos {data.length} dias
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

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Atividade por dia. ${summary}`}
        className="h-28 w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1="0"
            x2={W}
            y1={H * t}
            y2={H * t}
            strokeWidth="1"
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
            className="stroke-stone-300"
          />
        ))}
        <g className="wave-reveal">
          {series.map((s) => (
            <g key={s.key}>
              <path d={s.area} className={s.fill} />
              <path
                d={s.d}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={s.stroke}
              />
            </g>
          ))}
        </g>
      </svg>

      <div className="mt-1 flex justify-between text-[11px] text-neutral-600 tabular-nums">
        <span>{data[0].label}</span>
        <span>{data[Math.floor(data.length / 2)].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}

const SPECIES_STYLE: Record<PetSpecies, { fill: string; dot: string }> = {
  cachorro: { fill: "fill-blue-600", dot: "bg-blue-600" },
  gato: { fill: "fill-violet-600", dot: "bg-violet-600" },
  passaro: { fill: "fill-amber-400", dot: "bg-amber-400" },
  outro: { fill: "fill-gray-400", dot: "bg-gray-400" },
};

const R = 46;
const point = (a: number) => `${50 + R * Math.cos(a)} ${50 + R * Math.sin(a)}`;

/** Gráfico de pizza: proporção de pets por espécie. */
export function SpeciesPie({ pets }: { pets: Pet[] }) {
  const rows = PET_SPECIES_KEYS.map((key) => ({
    key,
    count: pets.filter((p) => p.species === key).length,
  })).filter((r) => r.count > 0);
  const total = pets.length;

  const slices = rows.map((row, i) => {
    const before = rows.slice(0, i).reduce((sum, r) => sum + r.count, 0);
    const a0 = -Math.PI / 2 + (before / total) * Math.PI * 2;
    const sweep = (row.count / total) * Math.PI * 2;
    const d =
      rows.length === 1
        ? `M50 4 A${R} ${R} 0 1 1 49.99 4 Z`
        : `M50 50 L${point(a0)} A${R} ${R} 0 ${sweep > Math.PI ? 1 : 0} 1 ${point(a0 + sweep)} Z`;
    return { ...row, d };
  });

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wide text-neutral-600 uppercase">
        <PieChart className={iconSize.sm} aria-hidden="true" />
        Pets por espécie
      </h3>
      <div className="flex items-center gap-4">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Pets por espécie: ${rows
            .map((r) => `${r.count} ${PET_SPECIES_LABEL[r.key].toLowerCase()}`)
            .join(", ")}`}
          className="pie-pop size-28 shrink-0"
        >
          {slices.map((s) => (
            <path
              key={s.key}
              d={s.d}
              strokeWidth="2.5"
              strokeLinejoin="round"
              className={cn("stroke-white", SPECIES_STYLE[s.key].fill)}
            />
          ))}
        </svg>
        <ul className="flex min-w-0 flex-1 flex-col gap-2">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "size-3 shrink-0 rounded-full",
                  SPECIES_STYLE[r.key].dot,
                )}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 text-neutral-900">
                {PET_SPECIES_LABEL[r.key]}
              </span>
              <span className="font-bold text-neutral-900 tabular-nums">
                {r.count}
              </span>
              <span className="w-10 text-right text-xs text-neutral-600 tabular-nums">
                {Math.round((r.count / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
