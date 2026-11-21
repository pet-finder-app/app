"use client";
import { QueryStatus } from "@/components/backend/query-status";
import { Button, Input, LinkButton } from "@/components/ui";
import {
  donationOrganizationsOptions,
  type DonationOrganizationFilter,
} from "@/lib/api/donations";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { DonationPager } from "./donation-pager";

const EMPTY_FILTER: DonationOrganizationFilter = { city: "", state: "" };

/** Verified organizations, filtered by city/state, each linking to donate. */
export function DonationOrganizationList() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(EMPTY_FILTER);
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const query = useQuery({
    ...donationOrganizationsOptions(page, filter),
    placeholderData: keepPreviousData,
  });
  const items = query.data?.items ?? [];
  const meta = query.data?.page;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilter(draft);
    setPage(1);
  }

  function handleClear() {
    setDraft(EMPTY_FILTER);
    setFilter(EMPTY_FILTER);
    setPage(1);
  }

  return (
    <section
      aria-labelledby="donate-organizations"
      className="flex flex-col gap-3"
    >
      <h2 id="donate-organizations" className="text-lg font-bold">
        ONGs verificadas
      </h2>
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Filtrar ONGs"
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <Input
            id="donate-city"
            label="Cidade"
            maxLength={120}
            value={draft.city}
            onChange={(event) =>
              setDraft({ ...draft, city: event.target.value })
            }
          />
          <Input
            id="donate-state"
            label="UF"
            maxLength={2}
            autoCapitalize="characters"
            value={draft.state}
            onChange={(event) =>
              setDraft({ ...draft, state: event.target.value })
            }
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" variant="outline" className="flex-1">
            Filtrar
          </Button>
          {filter.city || filter.state ? (
            <Button variant="outline" className="flex-1" onClick={handleClear}>
              Limpar filtros
            </Button>
          ) : null}
        </div>
      </form>
      <QueryStatus query={query} />
      {meta?.total === 0 ? (
        <p>Nenhuma ONG verificada encontrada com esses filtros.</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((organization) => {
          const place = [
            organization.location?.city,
            organization.location?.state,
          ]
            .filter(Boolean)
            .join(" - ");
          return (
            <li
              key={organization.id}
              className="flex items-center justify-between gap-3 border-b border-border-light pb-3"
            >
              <div className="min-w-0">
                <h3 className="truncate font-bold">{organization.name}</h3>
                {place ? (
                  <p className="text-sm text-neutral-600">{place}</p>
                ) : null}
              </div>
              <LinkButton
                href={`/adopter/donate/${encodeURIComponent(organization.id)}`}
                size="sm"
                className="shrink-0"
                aria-label={`Doar para ${organization.name}`}
              >
                Doar
              </LinkButton>
            </li>
          );
        })}
      </ul>
      {meta && meta.total > 0 ? (
        <DonationPager
          meta={meta}
          noun={{ one: "ONG verificada", other: "ONGs verificadas" }}
          label="Páginas de ONGs"
          isFetching={query.isFetching}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  );
}
