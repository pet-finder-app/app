import { mediaHref } from "@/components/backend/labels";
import type {
  OrganizationResponse,
  PostResponse,
} from "@/lib/backend/contracts";

type Identity = { name: string; slug: string; logoUrl: string | null };

/**
 * Header identity for an organization. Only logos served by Go (through the
 * authenticated proxy) are shown; other hosts are not configured for images.
 */
export function organizationIdentity({ name, slug, logoUrl }: Identity) {
  const href = logoUrl ? mediaHref(logoUrl) : null;
  return {
    name: name || "ONG",
    nickname: slug,
    logoUrl: href?.startsWith("/") ? href : null,
  };
}

/** Identity from a full organization profile. */
export const profileIdentity = (
  organization: Pick<OrganizationResponse, "name" | "slug" | "profile">,
) =>
  organizationIdentity({
    name: organization.name,
    slug: organization.slug,
    logoUrl: organization.profile.logoUrl ?? null,
  });

/** Identity from the organization fields Go embeds in each post. */
export const postIdentity = (
  post: Pick<
    PostResponse,
    "organizationName" | "organizationSlug" | "organizationLogoUrl"
  >,
) =>
  organizationIdentity({
    name: post.organizationName,
    slug: post.organizationSlug,
    logoUrl: post.organizationLogoUrl,
  });
