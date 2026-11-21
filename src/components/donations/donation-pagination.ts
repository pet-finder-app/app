import { hasNextPage, pageCount, type PageMeta } from "@/lib/api/pagination";

type Noun = { one: string; other: string };

export type DonationPageSummary = {
  /** "45 doações", "1 ONG". */
  totalLabel: string;
  /** "Página 2 de 3". */
  pageLabel: string;
  hasPrevious: boolean;
  hasNext: boolean;
  /** Controls are only worth showing when there is more than one page. */
  isPaged: boolean;
};

/** Page controls from Go's `page.total`, which counts items across all pages. */
export function pageSummary(meta: PageMeta, noun: Noun): DonationPageSummary {
  const pages = pageCount(meta);
  return {
    totalLabel: `${meta.total} ${meta.total === 1 ? noun.one : noun.other}`,
    pageLabel: `Página ${meta.page} de ${pages}`,
    hasPrevious: meta.page > 1,
    hasNext: hasNextPage(meta),
    isPaged: pages > 1 || meta.page > 1,
  };
}
