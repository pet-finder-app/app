import {
  organizationResponseSchema,
  userResponseSchema,
} from "@/lib/backend/contracts";
import { z } from "zod";

export const ACCESS_COOKIE = "petfinder_access";
export const REFRESH_COOKIE = "petfinder_refresh";
export const ORGANIZATION_COOKIE = "petfinder_organization";

export const sessionSchema = z.object({
  id: z.string(),
  role: z.enum(["adopter", "ngo"]),
  user: userResponseSchema,
  organization: organizationResponseSchema.nullable(),
});
export type Session = z.output<typeof sessionSchema>;

export type AccountRole = Session["role"];
