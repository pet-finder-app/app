"use client";
import { QueryStatus } from "@/components/backend/query-status";
import { animalQueries } from "@/lib/api/animals";
import type { MetricDay } from "@/lib/backend/contracts";
import { useQuery } from "@tanstack/react-query";
import { LIFECYCLE_STATUS_LABELS } from "./animal-labels";

const numberFormat = new Intl.NumberFormat("pt-BR");
const dayFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});
const formatDay = (date: string) =>
  dayFormat.format(new Date(`${date}T00:00:00Z`));

type DailyBarsProps = {
  id: string;
  title: string;
  days: MetricDay[];
  metric: "likes" | "applications";
  barClass: string;
};

/** One measure per chart: 90 thin bars on a shared zero baseline. */
function DailyBars({ id, title, days, metric, barClass }: DailyBarsProps) {
  const values = days.map((day) => day[metric]);
  const max = Math.max(1, ...values);
  const total = values.reduce((sum, value) => sum + value, 0);
  const peak = days.reduce<MetricDay | null>(
    (best, day) => (!best || day[metric] > best[metric] ? day : best),
    null,
  );
  const summary =
    peak && peak[metric] > 0
      ? `${title}: ${numberFormat.format(total)} nos últimos ${days.length} dias; maior valor ${numberFormat.format(peak[metric])} em ${formatDay(peak.date)}.`
      : `${title}: nenhum registro nos últimos ${days.length} dias.`;
  return (
    <figure className="flex flex-col gap-2">
      <figcaption id={`${id}-caption`} className="flex justify-between gap-2">
        <span className="font-bold">{title}</span>
        <span className="text-sm text-neutral-600">
          Total: {numberFormat.format(total)}
        </span>
      </figcaption>
      <div
        role="img"
        aria-label={summary}
        className="flex h-24 items-end gap-px border-b border-neutral-400"
      >
        {days.map((day) => (
          <div
            key={day.date}
            title={`${formatDay(day.date)}: ${numberFormat.format(day[metric])}`}
            className="group relative flex h-full min-w-0 flex-1 items-end hover:bg-neutral-100"
          >
            <div
              className={`w-full rounded-t-sm ${barClass}`}
              style={{
                height: day[metric] ? `${(day[metric] / max) * 100}%` : 0,
              }}
            />
          </div>
        ))}
      </div>
      {days.length ? (
        <div className="flex justify-between text-xs text-neutral-600">
          <span>{formatDay(days[0].date)}</span>
          <span>Máximo diário: {numberFormat.format(max)}</span>
          <span>{formatDay(days[days.length - 1].date)}</span>
        </div>
      ) : null}
    </figure>
  );
}

type OrganizationAnalyticsPanelProps = { organizationId: string };

export function OrganizationAnalyticsPanel({
  organizationId,
}: OrganizationAnalyticsPanelProps) {
  const analytics = useQuery(animalQueries.analytics(organizationId));
  const data = analytics.data;
  const statuses = data
    ? Object.entries(data.animalStatuses).flatMap(([status, count]) =>
        typeof count === "number" ? [{ status, count }] : [],
      )
    : [];
  const activeDays = data?.days.filter(
    (day) => day.likes > 0 || day.applications > 0,
  );
  return (
    <section
      aria-labelledby="organization-analytics-title"
      className="flex flex-col gap-4 border-t border-border-light pt-4"
    >
      <h2 id="organization-analytics-title" className="text-lg font-bold">
        Resultados da ONG
      </h2>
      <QueryStatus query={analytics} />
      {data ? (
        <>
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border-light p-3">
              <dt className="text-sm text-neutral-600">Curtidas</dt>
              <dd className="text-2xl font-bold">
                {numberFormat.format(data.likes)}
              </dd>
            </div>
            <div className="rounded-2xl border border-border-light p-3">
              <dt className="text-sm text-neutral-600">Pedidos de adoção</dt>
              <dd className="text-2xl font-bold">
                {numberFormat.format(data.applications)}
              </dd>
            </div>
          </dl>
          <div>
            <h3 className="mb-2 font-bold">Animais por situação</h3>
            {statuses.length ? (
              <ul className="flex flex-wrap gap-2">
                {statuses.map((item) => (
                  <li
                    key={item.status}
                    className="rounded-full border border-border-light px-3 py-1 text-sm"
                  >
                    {LIFECYCLE_STATUS_LABELS[item.status] ?? item.status}:{" "}
                    <span className="font-bold">
                      {numberFormat.format(item.count)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum animal cadastrado.</p>
            )}
          </div>
          <DailyBars
            id="analytics-likes"
            title="Curtidas por dia"
            days={data.days}
            metric="likes"
            barClass="bg-accent-tertiary"
          />
          <DailyBars
            id="analytics-applications"
            title="Pedidos por dia"
            days={data.days}
            metric="applications"
            barClass="bg-neutral-800"
          />
          <details>
            <summary className="cursor-pointer font-medium">
              Ver dias com atividade em tabela
            </summary>
            {activeDays?.length ? (
              <table className="mt-2 w-full text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col">Dia</th>
                    <th scope="col">Curtidas</th>
                    <th scope="col">Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDays.map((day) => (
                    <tr key={day.date}>
                      <th scope="row" className="font-normal">
                        {formatDay(day.date)}
                      </th>
                      <td>{numberFormat.format(day.likes)}</td>
                      <td>{numberFormat.format(day.applications)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-2">Nenhuma atividade nos últimos 90 dias.</p>
            )}
          </details>
        </>
      ) : null}
    </section>
  );
}
