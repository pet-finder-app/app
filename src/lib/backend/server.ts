import { ApiError } from "@/lib/api/client";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { organizationResponseSchema, userResponseSchema } from "./contracts";
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
