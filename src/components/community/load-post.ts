import { ApiError } from "@/lib/api/client";
import {
  organizationResponseSchema,
  postResponseSchema,
} from "@/lib/backend/contracts";
import { serverRequest } from "@/lib/backend/server";
import { notFound } from "next/navigation";

/** Server read of a public post; missing or hidden posts render a 404. */
export async function loadPost(id: string) {
  try {
    return await serverRequest(
      `/v1/posts/${encodeURIComponent(id)}`,
      postResponseSchema,
    );
  } catch (error: unknown) {
    if (error instanceof ApiError && [400, 404].includes(error.status))
      notFound();
    throw error;
  }
}

/** Server read of an organization's public profile, or a 404. */
export async function loadOrganization(id: string) {
  try {
    return await serverRequest(
      `/v1/organizations/${encodeURIComponent(id)}`,
      organizationResponseSchema,
    );
  } catch (error: unknown) {
    if (error instanceof ApiError && [400, 403, 404].includes(error.status))
      notFound();
    throw error;
  }
}
