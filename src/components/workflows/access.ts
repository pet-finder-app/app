/**
 * What the signed-in person may manage, read from Go membership data on the
 * server. Used only to hide actions Go would refuse; Go still authorizes.
 */
export type ViewerAccess = {
  userId: string;
  /** Selected organization where the person can manage applications. */
  managedOrganizationId: string | null;
  isAdmin: boolean;
};

/** Mirrors Go's `can_manage_applications` (or administrator) checks. */
export function canManageOrganization(
  access: ViewerAccess,
  organizationId: string | null | undefined,
): boolean {
  return (
    access.isAdmin ||
    (Boolean(organizationId) && access.managedOrganizationId === organizationId)
  );
}
