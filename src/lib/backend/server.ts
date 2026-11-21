import { ApiError } from "@/lib/api/client";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  legalDocumentSchema,
  memberListResponseSchema,
  organizationResponseSchema,
  userResponseSchema,
} from "./contracts";
import { selectedOrganization } from "./session-cookies";
import { fetchBackend } from "./transport";

export async function serverRequest<T>(
  path: string,
  schema: { parse(value: unknown): T },
): Promise<T> {
  const store = await cookies();
  const response = await fetchBackend(
    path,
    {},
    store.get(ACCESS_COOKIE)?.value,
  );
  if (response.status === 401) redirect("/login");
  if (!response.ok)
    throw new ApiError(
      response.status,
      "Não foi possível carregar os dados do serviço.",
    );
  const data: unknown = await response.json();
  return schema.parse(data);
}

export const getCurrentUser = cache(async () => {
  const store = await cookies();
  if (!store.get(ACCESS_COOKIE) && !store.get(REFRESH_COOKIE))
    redirect("/login");
  return serverRequest("/v1/me", userResponseSchema);
});

export const getCurrentOrganization = cache(async () => {
  const user = await getCurrentUser();
  const id = selectedOrganization(await cookies(), user.id);
  if (!id) return null;
  try {
    const organization = await serverRequest(
      `/v1/organizations/${encodeURIComponent(id)}`,
      organizationResponseSchema,
    );
    return organization.legalName === undefined ? null : organization;
  } catch (error: unknown) {
    if (error instanceof ApiError && [403, 404].includes(error.status))
      return null;
    throw error;
  }
});

export const PLATFORM_ADMIN_ROLE = "platform_admin";
/** Navigation hint only; Go authorizes every administrative request. */
export function isPlatformAdmin(user: { roles: readonly string[] }) {
  return user.roles.includes(PLATFORM_ADMIN_ROLE);
}

export type MembershipPermissions = {
  role: string;
  canManageMembers: boolean;
  canPublishAnimals: boolean;
  canManageApplications: boolean;
};
/**
 * The signed-in person's active permissions in the selected organization, read
 * from Go. Used to hide actions the API would refuse; Go still enforces them.
 */
export const getCurrentMembership = cache(
  async (): Promise<MembershipPermissions | null> => {
    const [user, organization] = await Promise.all([
      getCurrentUser(),
      getCurrentOrganization(),
    ]);
    if (!organization) return null;
    try {
      const members = await serverRequest(
        `/v1/organizations/${encodeURIComponent(organization.id)}/members`,
        memberListResponseSchema,
      );
      const own = members.items.find(
        (member) => member.userId === user.id && member.status === "active",
      );
      return own
        ? {
            role: own.memberRole,
            canManageMembers: own.canManageMembers,
            canPublishAnimals: own.canPublishAnimals,
            canManageApplications: own.canManageApplications,
          }
        : null;
    } catch (error: unknown) {
      if (error instanceof ApiError && [403, 404].includes(error.status))
        return null;
      throw error;
    }
  },
);

/** Public legal documents; no session is required to read them. */
export async function getLegalDocument(kind: "terms" | "privacy") {
  try {
    const response = await fetchBackend(`/v1/legal/${kind}`);
    if (!response.ok) return null;
    const parsed = legalDocumentSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
