"use client";
import { Button } from "@/components/ui";
import type { PageMeta } from "@/lib/api/pagination";
import { pageSummary } from "./donation-pagination";

type DonationPagerProps = {
  meta: PageMeta;
  noun: { one: string; other: string };
  label: string;
  isFetching: boolean;
  onPageChange: (page: number) => void;
};

/** Total count plus previous/next controls driven by real totals. */
export function DonationPager({
  meta,
  noun,
  label,
  isFetching,
  onPageChange,
}: DonationPagerProps) {
  const summary = pageSummary(meta, noun);
  return (
    <nav aria-label={label} className="flex flex-col gap-2">
      <p className="text-sm text-neutral-600" aria-live="polite">
        {summary.totalLabel}
        {summary.isPaged ? ` · ${summary.pageLabel}` : null}
      </p>
      {summary.isPaged ? (
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={!summary.hasPrevious || isFetching}
            onClick={() => onPageChange(meta.page - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={!summary.hasNext || isFetching}
            onClick={() => onPageChange(meta.page + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}
    </nav>
  );
}
