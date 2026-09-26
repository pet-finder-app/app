import { BrutalCard } from "@/components/brutal-card";
import { CardTitle, cn } from "@/components/ui";
import type { ReceivedDonation } from "@/lib/donation";
import type { Notification } from "@/lib/notification";
import {
  PET_SPECIES_LABEL,
  PET_STATUS_LABEL,
  type Pet,
  type PetSpecies,
  type PetStatus,
} from "@/lib/pet";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

/**
 * Cores de gráfico — validadas para contraste e distinção sob daltonismo
 * (ver skill de dataviz). Só usadas aqui, não são tokens de UI: cor de
 * gráfico tem um trabalho diferente de cor de interface.
 */
const STATUS_COLOR: Record<PetStatus, string> = {
  disponivel: "#0ca30c",
  em_processo: "#fab219",
  adotado: "#898781",
};

/** Ordem fixa por espécie — nunca reatribuída conforme os valores mudam. */
const SPECIES_COLOR: Record<PetSpecies, string> = {
  cachorro: "#2a78d6",
  gato: "#eb6834",
  outro: "#1baf7a",
};

/** Série única (mesma métrica comparada entre itens): sempre um hue só. */
const BRAND = "#16a34a";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "long" });

type ChartDatum = { label: string; value: number; color: string };

/** Parte-todo: uma barra só, segmentada — para poucas categorias fixas. */
function StackedBar({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full border border-neutral-900 bg-white">
        {total > 0
          ? data.map((d) =>
              d.value > 0 ? (
                <div
                  key={d.label}
                  style={{
                    width: `${(d.value / total) * 100}%`,
                    backgroundColor: d.color,
                  }}
                  className="h-full border border-neutral-900"
                />
              ) : null,
            )
          : null}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-1.5 text-sm">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full border border-neutral-900"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-neutral-700">{d.label}</span>
            <span className="font-bold text-neutral-900">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Comparação de magnitude entre categorias — uma barra por item. */
function BarList({
  data,
  formatValue = (value: number) => String(value),
}: {
  data: ChartDatum[];
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((d) => (
        <li key={d.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-semibold text-neutral-700">
              {d.label}
            </span>
            <span className="shrink-0 font-bold text-neutral-900">
              {formatValue(d.value)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full border border-neutral-900 bg-white">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(d.value / max) * 100}%`,
                backgroundColor: d.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

type Trend = { direction: "up" | "down"; label: string };

/**
 * Card de KPI pastel (percentual + tendência + barrinha de progresso) —
 * a tendência é ilustrativa até existir histórico de verdade no backend
 * para comparar com o período anterior.
 */
function StatCard({
  label,
  percent,
  trend,
  bg,
}: {
  label: string;
  percent: number;
  trend: Trend;
  bg: string;
}) {
  const TrendIcon = trend.direction === "up" ? ArrowUpRight : ArrowDownRight;
  const trendColor =
    trend.direction === "up" ? "text-green-700" : "text-red-600";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-neutral-900 p-3",
        bg,
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-base font-bold text-neutral-900">{percent}%</span>
        <TrendIcon
          className={cn("size-4 shrink-0", trendColor)}
          aria-hidden="true"
        />
      </div>
      <div className="h-1.5 overflow-hidden rounded-full border border-neutral-900 bg-white">
        <div
          className="h-full rounded-full bg-neutral-900"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <p className="text-[11px] leading-tight text-neutral-700">
        {label}
        <span className="sr-only">
          {" "}
          ({trend.direction === "up" ? "subindo" : "caindo"}, {trend.label})
        </span>
      </p>
    </div>
  );
}

/** Mini gráfico de barras sem eixos/rótulos — só a silhueta da tendência. */
function MiniSparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div
      className="flex h-10 items-end gap-1"
      role="img"
      aria-label="Histórico recente de doações"
    >
      {values.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-sm border border-neutral-900 bg-primary"
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

type OngDashboardProps = {
  pets: Pet[];
  notifications: Notification[];
  donations: ReceivedDonation[];
};

/** Dashboard da ONG: KPIs, ganhos, status dos pets, espécies e engajamento. */
export function OngDashboard({
  pets,
  notifications,
  donations,
}: OngDashboardProps) {
  const totalPets = pets.length;
  const adoptedCount = pets.filter((p) => p.status === "adotado").length;
  const availableCount = pets.filter((p) => p.status === "disponivel").length;
  const petsWithInterest = new Set(notifications.map((n) => n.petId)).size;

  const adoptionRate =
    totalPets > 0 ? Math.round((adoptedCount / totalPets) * 100) : 0;
  const availabilityRate =
    totalPets > 0 ? Math.round((availableCount / totalPets) * 100) : 0;
  const interestRate =
    totalPets > 0 ? Math.round((petsWithInterest / totalPets) * 100) : 0;

  const statusData: ChartDatum[] = (
    Object.keys(PET_STATUS_LABEL) as PetStatus[]
  ).map((status) => ({
    label: PET_STATUS_LABEL[status],
    value: pets.filter((p) => p.status === status).length,
    color: STATUS_COLOR[status],
  }));

  const speciesData: ChartDatum[] = (
    Object.keys(PET_SPECIES_LABEL) as PetSpecies[]
  )
    .map((species) => ({
      label: PET_SPECIES_LABEL[species],
      value: pets.filter((p) => p.species === species).length,
      color: SPECIES_COLOR[species],
    }))
    .filter((d) => d.value > 0);

  const likesByPet = notifications.reduce<Record<string, number>>((acc, n) => {
    acc[n.petId] = (acc[n.petId] ?? 0) + 1;
    return acc;
  }, {});
  const engagementData: ChartDatum[] = pets
    .map((pet) => ({
      label: pet.name,
      value: likesByPet[pet.id] ?? 0,
      color: BRAND,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const donationsByDate = [...donations].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const donationsTotal = donations.reduce((sum, d) => sum + d.amount, 0);
  const latestMonth = donationsByDate.at(-1)
    ? monthFormat.format(new Date(donationsByDate.at(-1)!.createdAt))
    : monthFormat.format(new Date());

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-bold tracking-wide text-neutral-500 uppercase">
          Análises
        </p>
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label="Taxa de adoção"
            percent={adoptionRate}
            trend={{ direction: "up", label: "vs. mês passado" }}
            bg="bg-primary-soft"
          />
          <StatCard
            label="Pets com interesse"
            percent={interestRate}
            trend={{ direction: "up", label: "vs. mês passado" }}
            bg="bg-accent-yellow"
          />
          <StatCard
            label="Disponíveis agora"
            percent={availabilityRate}
            trend={{ direction: "down", label: "vs. mês passado" }}
            bg="bg-accent-peach"
          />
        </div>
      </div>

      <BrutalCard className="gap-3">
        <p className="text-xs text-neutral-500">Total em doações</p>
        <p className="text-2xl font-bold text-neutral-900">
          {currency.format(donationsTotal)}
        </p>

        {donationsByDate.length > 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-900 bg-primary-faint p-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-neutral-600">
                Recebido em <span className="capitalize">{latestMonth}</span>
              </p>
              <p className="text-base font-bold text-neutral-900">
                {currency.format(donationsTotal)}{" "}
                <span className="text-xs font-semibold text-green-700">
                  +{donationsByDate.length} doações
                </span>
              </p>
            </div>
            <MiniSparkline values={donationsByDate.map((d) => d.amount)} />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Nenhuma doação registrada ainda.
          </p>
        )}
      </BrutalCard>

      <BrutalCard>
        <CardTitle>Pets por status</CardTitle>
        {pets.length > 0 ? (
          <StackedBar data={statusData} />
        ) : (
          <p className="text-sm text-neutral-500">
            Cadastre pets para ver o gráfico.
          </p>
        )}
      </BrutalCard>

      <BrutalCard>
        <CardTitle>Pets por espécie</CardTitle>
        {speciesData.length > 0 ? (
          <BarList data={speciesData} />
        ) : (
          <p className="text-sm text-neutral-500">
            Cadastre pets para ver o gráfico.
          </p>
        )}
      </BrutalCard>

      <BrutalCard>
        <CardTitle>Mais curtidos e procurados</CardTitle>
        {engagementData.some((d) => d.value > 0) ? (
          <BarList data={engagementData} />
        ) : (
          <p className="text-sm text-neutral-500">
            Ainda sem curtidas ou interesses registrados.
          </p>
        )}
      </BrutalCard>
    </div>
  );
}
