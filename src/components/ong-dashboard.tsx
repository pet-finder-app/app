import { BrutalCard } from "@/components/brutal-card";
import { OngPetsOverview } from "@/components/ong-pets-overview";
import { cn, LinkButton } from "@/components/ui";
import type { ReceivedDonation } from "@/lib/donation";
import type { Notification } from "@/lib/notification";
import { countNotificationsByPet } from "@/lib/notifications";
import type { Pet } from "@/lib/pet";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "long" });

const ACTIVITY_DAYS = 14;

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
    trend.direction === "up" ? "text-lime-800" : "text-red-700";

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
      <p className="text-[11px] leading-tight text-neutral-900">
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

/** Curtidas e interesses por dia nos últimos dias, do mais antigo ao mais recente. */
function buildActivity(notifications: Notification[]) {
  return Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (ACTIVITY_DAYS - 1 - i));
    const onDay = notifications.filter(
      (n) => new Date(n.createdAt).toDateString() === day.toDateString(),
    );
    return {
      label: day.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      likes: onDay.filter((n) => n.type === "curtida").length,
      interests: onDay.filter((n) => n.type === "interesse").length,
    };
  });
}

/** Dashboard da ONG: KPIs, ganhos e gráficos de status, espécie, atividade e engajamento. */
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
        <p className="mb-2 text-xs font-bold tracking-wide text-neutral-600 uppercase">
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
        <p className="text-xs text-neutral-600">Total em doações confirmadas</p>
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
                <span className="text-xs font-semibold text-lime-800">
                  +{donationsByDate.length} doações
                </span>
              </p>
            </div>
            <MiniSparkline values={donationsByDate.map((d) => d.amount)} />
          </div>
        ) : (
          <p className="text-sm text-neutral-600">
            Nenhuma doação confirmada ainda.
          </p>
        )}
        <LinkButton
          href="/ong/doacoes"
          variant="pill"
          size="sm"
          className="self-start"
        >
          Ver e confirmar doações
        </LinkButton>
      </BrutalCard>

      {pets.length > 0 ? (
        <OngPetsOverview
          showTotals={false}
          pets={pets}
          likesByPet={countNotificationsByPet(notifications, "curtida")}
          interestedByPet={countNotificationsByPet(notifications, "interesse")}
          activity={buildActivity(notifications)}
        />
      ) : (
        <BrutalCard>
          <p className="text-sm text-neutral-600">
            Cadastre pets para ver os gráficos.
          </p>
        </BrutalCard>
      )}
    </div>
  );
}
