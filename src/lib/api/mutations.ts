import {
  adoptionApplicationSchema,
  animalImageResponseSchema,
  animalPreferenceSchema,
  animalSchema,
  applicationCreatedResponseSchema,
  applicationScreeningSchema,
  appointmentConfirmationSchema,
  appointmentSchema,
  issuedOTPResponseSchema,
  messageResponseSchema,
  organizationMemberSchema,
  organizationResponseSchema,
  reportSchema,
  userResponseSchema,
} from "@/lib/backend/contracts";
import { toWire } from "@/lib/backend/wire";
import { mutationOptions } from "@tanstack/react-query";
import { z } from "zod";
import { jsonBody, requestData } from "./client";
import { mutationKeys, queryKeys } from "./keys";
import type { ApiMutationMeta } from "./meta";
import { backendPath } from "./queries";

const okSchema = z.object({ ok: z.literal(true) });
const accountResult = z.object({ user: userResponseSchema });
const identity: ApiMutationMeta = { isPublic: true, resetsSession: true };
const feedMeta: ApiMutationMeta = {
  invalidates: [queryKeys.animals, queryKeys.preferences],
};
const workflowMeta: ApiMutationMeta = {
  invalidates: [
    queryKeys.applications,
    queryKeys.conversations,
    queryKeys.animals,
  ],
};
const body = (input: unknown, method = "POST") => ({
  ...jsonBody(toWire(input)),
  method,
});
export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
};
export type LocationInput = {
  city: string;
  state: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
};
export type OrganizationInput = {
  name: string;
  legalName: string;
  registrationNumber: string;
  description: string;
  officialChannels: { email: string; phone?: string; website?: string };
  location: LocationInput;
};
export type AnimalInput = {
  name: string;
  species: "dog" | "cat" | "other";
  size: "small" | "medium" | "large" | "extra_large";
  sex: "female" | "male" | "unknown";
  description: string;
  breed?: string;
  approximateBirthDate?: string;
  healthNotes?: string;
  behaviorNotes?: string;
  organizationId?: string;
  location: LocationInput;
};
export type ScreeningInput = {
  housing: string;
  household: string;
  experience: string;
  carePlan: string;
  hasOtherAnimals: boolean;
  acceptsFollowUp: boolean;
};
export type AppointmentInput = {
  purpose:
    "interview" | "home_visit" | "meet_and_greet" | "delivery" | "follow_up";
  startsAt: string;
  endsAt: string;
  timezone: string;
  locationName: string;
  address: string;
  instructions?: string;
};

export const apiMutations = {
  login: () =>
    mutationOptions({
      mutationKey: mutationKeys.auth("login"),
      meta: identity,
      mutationFn: (input: { email: string; password: string }) =>
        requestData("/api/session/login", accountResult, jsonBody(input)),
    }),
  register: () =>
    mutationOptions({
      mutationKey: mutationKeys.auth("register"),
      meta: identity,
      mutationFn: (input: RegisterInput) =>
        requestData(
          "/api/session/register",
          accountResult,
          jsonBody({ ...input, acceptedPrivacyPolicy: input.acceptedTerms }),
        ),
    }),
  logout: () =>
    mutationOptions({
      mutationKey: mutationKeys.auth("logout"),
      meta: identity,
      mutationFn: () =>
        requestData("/api/session/logout", okSchema, { method: "POST" }),
    }),
  updateProfile: () =>
    mutationOptions({
      mutationKey: mutationKeys.profile,
      meta: { invalidates: [queryKeys.session, queryKeys.profile] },
      mutationFn: (input: {
        name: string;
        phone: string;
        location?: LocationInput;
      }) =>
        requestData(
          backendPath("/v1/me"),
          userResponseSchema,
          body(input, "PATCH"),
        ),
    }),
  createOrganization: () =>
    mutationOptions({
      mutationKey: mutationKeys.organization("create"),
      meta: { invalidates: [queryKeys.organizations, queryKeys.session] },
      mutationFn: (input: OrganizationInput) =>
        requestData(
          backendPath("/v1/organizations"),
          organizationResponseSchema,
          body(input),
        ),
    }),
  updateOrganization: () =>
    mutationOptions({
      mutationKey: mutationKeys.organization("update"),
      meta: { invalidates: [queryKeys.organizations, queryKeys.session] },
      mutationFn: (input: {
        id: string;
        changes: Pick<
          OrganizationInput,
          "name" | "description" | "officialChannels" | "location"
        >;
      }) =>
        requestData(
          backendPath(`/v1/organizations/${encodeURIComponent(input.id)}`),
          organizationResponseSchema,
          body(
            {
              name: input.changes.name,
              description: input.changes.description,
              officialChannels: input.changes.officialChannels,
              location: input.changes.location,
            },
            "PATCH",
          ),
        ),
    }),
  selectOrganization: () =>
    mutationOptions({
      mutationKey: mutationKeys.organization("select"),
      meta: { resetsSession: true },
      mutationFn: (organizationId: string) =>
        requestData(
          "/api/session/organization",
          okSchema,
          jsonBody({ organizationId }),
        ),
    }),
  inviteMember: () =>
    mutationOptions({
      mutationKey: mutationKeys.organization("invite"),
      meta: { invalidates: [queryKeys.organizations] },
      mutationFn: (input: {
        organizationId: string;
        email: string;
        role: "coordinator" | "representative" | "moderator";
      }) =>
        requestData(
          backendPath(
            `/v1/organizations/${encodeURIComponent(input.organizationId)}/members`,
          ),
          organizationMemberSchema,
          body({ email: input.email, role: input.role }),
        ),
    }),
  removeMember: () =>
    mutationOptions({
      mutationKey: mutationKeys.organization("remove-member"),
      meta: { invalidates: [queryKeys.organizations] },
      mutationFn: (input: { organizationId: string; userId: string }) =>
        requestData(
          backendPath(
            `/v1/organizations/${encodeURIComponent(input.organizationId)}/members/${encodeURIComponent(input.userId)}`,
          ),
          z.null(),
          { method: "DELETE" },
        ),
    }),
  saveAnimal: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("save"),
      meta: feedMeta,
      mutationFn: (input: { id?: string; animal: AnimalInput }) => {
        const changes = { ...input.animal };
        delete changes.organizationId;
        return requestData(
          backendPath(
            input.id
              ? `/v1/animals/${encodeURIComponent(input.id)}`
              : "/v1/animals",
          ),
          animalSchema,
          body(input.id ? changes : input.animal, input.id ? "PATCH" : "POST"),
        );
      },
    }),
  animalStatus: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("status"),
      meta: feedMeta,
      mutationFn: (input: {
        id: string;
        status:
          | "pending_organization"
          | "available"
          | "adoption_in_progress"
          | "unavailable"
          | "under_review";
        reason: string;
      }) =>
        requestData(
          backendPath(`/v1/animals/${encodeURIComponent(input.id)}/status`),
          animalSchema,
          body({ status: input.status, reason: input.reason }, "PATCH"),
        ),
    }),
  addImage: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("image"),
      meta: feedMeta,
      mutationFn: (input: {
        id: string;
        url: string;
        altText: string;
        position: number;
      }) =>
        requestData(
          backendPath(`/v1/animals/${encodeURIComponent(input.id)}/images`),
          animalImageResponseSchema,
          body({
            url: input.url,
            altText: input.altText,
            position: input.position,
          }),
        ),
    }),
  removeImage: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("remove-image"),
      meta: feedMeta,
      mutationFn: (input: { id: string; imageId: string }) =>
        requestData(
          backendPath(
            `/v1/animals/${encodeURIComponent(input.id)}/images/${encodeURIComponent(input.imageId)}`,
          ),
          z.null(),
          { method: "DELETE" },
        ),
    }),
  like: () =>
    mutationOptions({
      mutationKey: mutationKeys.preference,
      meta: feedMeta,
      mutationFn: async (input: {
        type: "pet" | "post";
        id: string;
        onlyLike?: boolean;
      }) => {
        if (input.type !== "pet")
          throw new Error(
            "Publicações independentes ainda não estão disponíveis.",
          );
        const preference = await requestData(
          backendPath(`/v1/animals/${encodeURIComponent(input.id)}/preference`),
          animalPreferenceSchema,
          body({ value: "liked" }, "PUT"),
        );
        return { liked: preference.preference === "liked" };
      },
    }),
  hidePet: () =>
    mutationOptions({
      mutationKey: mutationKeys.preference,
      meta: feedMeta,
      mutationFn: async (input: { id: string; hidden?: boolean }) => {
        if (input.hidden === false)
          throw new Error(
            "Para voltar a mostrar este animal, adicione-o aos favoritos. A remoção de preferências ainda não está disponível.",
          );
        const preference = await requestData(
          backendPath(`/v1/animals/${encodeURIComponent(input.id)}/preference`),
          animalPreferenceSchema,
          body({ value: "not_interested" }, "PUT"),
        );
        return { disliked: preference.preference === "not_interested" };
      },
    }),
  createApplication: () =>
    mutationOptions({
      mutationKey: mutationKeys.application("create"),
      meta: workflowMeta,
      mutationFn: (input: { animalId: string; introduction: string }) =>
        requestData(
          backendPath("/v1/applications"),
          applicationCreatedResponseSchema,
          body(input),
        ),
    }),
  screening: () =>
    mutationOptions({
      mutationKey: mutationKeys.application("screening"),
      meta: workflowMeta,
      mutationFn: (input: { id: string; answers: ScreeningInput }) =>
        requestData(
          backendPath(
            `/v1/applications/${encodeURIComponent(input.id)}/screening`,
          ),
          applicationScreeningSchema,
          body(input.answers, "PUT"),
        ),
    }),
  applicationDecision: () =>
    mutationOptions({
      mutationKey: mutationKeys.application("decision"),
      meta: workflowMeta,
      mutationFn: (input: {
        id: string;
        decision: "approved" | "rejected" | "needs_information";
        reason: string;
      }) =>
        requestData(
          backendPath(
            `/v1/applications/${encodeURIComponent(input.id)}/decision`,
          ),
          adoptionApplicationSchema,
          body({ decision: input.decision, reason: input.reason }),
        ),
    }),
  sendMessage: () =>
    mutationOptions({
      mutationKey: mutationKeys.message,
      meta: { invalidates: [queryKeys.conversations] },
      mutationFn: (input: { id: string; text: string }) =>
        requestData(
          backendPath(
            `/v1/conversations/${encodeURIComponent(input.id)}/messages`,
          ),
          messageResponseSchema,
          body({ body: input.text }),
        ),
    }),
  createAppointment: () =>
    mutationOptions({
      mutationKey: mutationKeys.appointment("create"),
      meta: workflowMeta,
      mutationFn: (input: {
        applicationId: string;
        appointment: AppointmentInput;
      }) =>
        requestData(
          backendPath(
            `/v1/applications/${encodeURIComponent(input.applicationId)}/appointments`,
          ),
          appointmentSchema,
          body(input.appointment),
        ),
    }),
  updateAppointment: () =>
    mutationOptions({
      mutationKey: mutationKeys.appointment("update"),
      meta: workflowMeta,
      mutationFn: (input: {
        id: string;
        changes: Partial<Omit<AppointmentInput, "purpose">> & {
          status?: "scheduled" | "cancelled";
          reason?: string;
        };
      }) =>
        requestData(
          backendPath(`/v1/appointments/${encodeURIComponent(input.id)}`),
          appointmentSchema,
          body(input.changes, "PATCH"),
        ),
    }),
  issueOtp: () =>
    mutationOptions({
      mutationKey: mutationKeys.appointment("otp"),
      mutationFn: (id: string) =>
        requestData(
          backendPath(`/v1/appointments/${encodeURIComponent(id)}/otp`),
          issuedOTPResponseSchema,
          { method: "POST" },
        ),
    }),
  confirmAppointment: () =>
    mutationOptions({
      mutationKey: mutationKeys.appointment("confirm"),
      meta: workflowMeta,
      mutationFn: (input: {
        id: string;
        type: "delivery" | "receipt";
        otpCode?: string;
      }) =>
        requestData(
          backendPath(
            `/v1/appointments/${encodeURIComponent(input.id)}/confirmations`,
          ),
          appointmentConfirmationSchema,
          body({ type: input.type, otpCode: input.otpCode }),
        ),
    }),
  report: () =>
    mutationOptions({
      mutationKey: mutationKeys.report("create"),
      meta: { invalidates: [queryKeys.reports] },
      mutationFn: (input: {
        targetType: "pet" | "post";
        targetId: string;
        reason: string;
      }) => {
        if (input.targetType !== "pet")
          throw new Error(
            "Denúncias de publicações independentes ainda não estão disponíveis.",
          );
        return requestData(
          backendPath("/v1/reports"),
          reportSchema,
          body({
            category: "other",
            description: input.reason,
            subjectType: "animal",
            subjectId: input.targetId,
          }),
        );
      },
    }),
  location: () =>
    mutationOptions({
      mutationKey: mutationKeys.location,
      meta: { invalidates: [queryKeys.location, queryKeys.animals] },
      mutationFn: (input: {
        coordinates: { lat: number; lon: number } | null;
        signal?: AbortSignal;
      }) =>
        requestData("/api/location", okSchema, {
          ...(input.coordinates
            ? jsonBody(input.coordinates)
            : { method: "DELETE" }),
          signal: input.signal,
        }),
    }),
};
