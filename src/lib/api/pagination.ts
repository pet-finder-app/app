/** Go collection page metadata: `total` counts items across all pages. */
export type PageMeta = { page: number; pageSize: number; total: number };

/** Whether items exist after this page. */
export function hasNextPage(meta: PageMeta): boolean {
  return meta.page * meta.pageSize < meta.total;
}

/** TanStack `getNextPageParam` for page-numbered Go collections. */
export function nextPageParam(last: { page: PageMeta }): number | undefined {
  return hasNextPage(last.page) ? last.page.page + 1 : undefined;
}

/** Number of pages, at least one, for page controls. */
export function pageCount(meta: PageMeta): number {
  return Math.max(1, Math.ceil(meta.total / meta.pageSize));
}
