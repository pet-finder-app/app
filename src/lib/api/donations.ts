import {
  collectionResponseDonationResponseSchema,
  collectionResponseOrganizationResponseSchema,
  donationDetailSchema,
  donationResponseSchema,
  donationTotalsSchema,
} from "@/lib/backend/contracts";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { requestData } from "./client";
import { queryKeys } from "./keys";
import { body } from "./mutations";
import { backendPath } from "./queries";

export const DONATION_PAGE_SIZE = 20;
export const ORGANIZATION_PAGE_SIZE = 20;

/** Donation caches share one prefix so reports and decisions refresh them all. */
export const donationKeys = {
  all: ["donations"] as const,
  list: (organizationId: string | undefined, page: number) =>
    ["donations", "list", organizationId ?? "me", page] as const,
  detail: (id: string) => ["donations", "detail", id] as const,
  totals: (organizationId: string) =>
    ["donations", "totals", organizationId] as const,
  organizations: (page: number, city: string, state: string) =>
    [...queryKeys.organizations, "donate", page, city, state] as const,
};

export type DonationOrganizationFilter = { city: string; state: string };

/** Verified organizations people can donate to (`GET /v1/organizations`). */
export function donationOrganizationsOptions(
  page: number,
  filter: DonationOrganizationFilter,
) {
  const city = filter.city.trim();
  const state = filter.state.trim().toUpperCase();
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(ORGANIZATION_PAGE_SIZE),
  });
  if (city) params.set("city", city);
  if (state) params.set("state", state);
  return queryOptions({
    queryKey: donationKeys.organizations(page, city, state),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/organizations?${params.toString()}`),
        collectionResponseOrganizationResponseSchema,
        { signal },
      ),
  });
}

/** The donor's own reports, or an organization's when `organizationId` is set. */
export function donationsOptions(organizationId: string | undefined, page = 1) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(DONATION_PAGE_SIZE),
  });
  if (organizationId) params.set("organization_id", organizationId);
  return queryOptions({
    queryKey: donationKeys.list(organizationId, page),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/donations?${params.toString()}`),
        collectionResponseDonationResponseSchema,
        { signal },
      ),
  });
}

export function donationOptions(id: string) {
  return queryOptions({
    queryKey: donationKeys.detail(id),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(`/v1/donations/${encodeURIComponent(id)}`),
        donationDetailSchema,
        { signal },
      ),
  });
}

export function donationTotalsOptions(organizationId: string) {
  return queryOptions({
    queryKey: donationKeys.totals(organizationId),
    queryFn: ({ signal }) =>
      requestData(
        backendPath(
          `/v1/organizations/${encodeURIComponent(organizationId)}/donation-totals`,
        ),
        donationTotalsSchema,
        { signal },
      ),
  });
}

export type ReportDonationInput = {
  organizationId: string;
  amountCents: number;
  transferredAt: string;
  receiptMediaId?: string;
  anonymous: boolean;
  note?: string;
};
export type DonationDecisionInput = {
  donationId: string;
  status: "confirmed" | "not_found";
  reason: string;
};

export const donationMutations = {
  report: () =>
    mutationOptions({
      mutationKey: ["donations", "report"],
      meta: { invalidates: [donationKeys.all] },
      mutationFn: ({ organizationId, ...donation }: ReportDonationInput) =>
        requestData(
          backendPath(
            `/v1/organizations/${encodeURIComponent(organizationId)}/donations`,
          ),
          donationResponseSchema,
          body(donation),
        ),
    }),
  decide: () =>
    mutationOptions({
      mutationKey: ["donations", "decision"],
      meta: { invalidates: [donationKeys.all] },
      mutationFn: ({ donationId, ...decision }: DonationDecisionInput) =>
        requestData(
          backendPath(
            `/v1/donations/${encodeURIComponent(donationId)}/decision`,
          ),
          donationDetailSchema,
          body(decision),
        ),
    }),
};
