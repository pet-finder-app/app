import {
  getCurrentMembership,
  getCurrentOrganization,
  getCurrentUser,
  isPlatformAdmin,
} from "@/lib/backend/server";
import type { ViewerAccess } from "./access";

/** Server-only: the signed-in person's workflow permissions. */
export async function getViewerAccess(): Promise<{
  access: ViewerAccess;
  hasOrganization: boolean;
}> {
  const [user, organization, membership] = await Promise.all([
    getCurrentUser(),
    getCurrentOrganization(),
    getCurrentMembership(),
  ]);
  return {
    access: {
      userId: user.id,
      managedOrganizationId:
        organization && membership?.canManageApplications
          ? organization.id
          : null,
      isAdmin: isPlatformAdmin(user),
    },
    hasOrganization: Boolean(organization),
  };
}
