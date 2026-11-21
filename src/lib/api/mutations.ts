import {
  adoptionApplicationSchema,
  animalImageResponseSchema,
  animalImageSchema,
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
  paymentDetailsSchema,
  reportSchema,
  uploadResponseSchema,
  userResponseSchema,
  verificationRecordSchema,
} from "@/lib/backend/contracts";
import { toWire } from "@/lib/backend/wire";
import { mutationOptions } from "@tanstack/react-query";
import { z } from "zod";
import { jsonBody, requestData, requestJson } from "./client";
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
    queryKeys.appointments,
  ],
};
/** JSON request init with camelCase keys converted to Go's snake_case. */
export const body = (input: unknown, method = "POST") => ({
  ...jsonBody(toWire(input)),
  method,
});
export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
};
export type PaymentDetailsInput = {
  method: "pix" | "bank_transfer";
  instructions: string;
  pixKey?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccount?: string;
  accountHolder: string;
  published: boolean;
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

/** REST message delivery, also the fallback while the chat socket reconnects. */
export function sendMessageRequest(input: { id: string; text: string }) {
  return requestData(
    backendPath(`/v1/conversations/${encodeURIComponent(input.id)}/messages`),
    messageResponseSchema,
    body({ body: input.text }),
  );
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DOCUMENT_TYPES = ["application/pdf", ...IMAGE_TYPES] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Go media purposes; PDF is accepted only for documents and surrenders. */
export type MediaPurpose =
  "avatar" | "animal" | "post" | "document" | "followup" | "surrender";
type MediaType = (typeof DOCUMENT_TYPES)[number];
const isMediaType = (value: string): value is MediaType =>
  DOCUMENT_TYPES.some((type) => type === value);

/**
 * Store a file through the Go media API (initiate, then upload exact bytes)
 * and return its id and URL. Go validates size, detected type and quota.
 */
export async function uploadMedia(file: File, purpose: MediaPurpose) {
  const allowsPdf = purpose === "document" || purpose === "surrender";
  if (
    !isMediaType(file.type) ||
    (file.type === "application/pdf" && !allowsPdf)
  )
    throw new Error(
      allowsPdf
        ? "Envie um arquivo PDF, JPEG, PNG ou WebP."
        : "Envie uma imagem JPEG, PNG ou WebP.",
    );
  if (file.size < 1 || file.size > MAX_UPLOAD_BYTES)
    throw new Error("Cada arquivo deve ter no máximo 10 MB.");
  const upload = await requestData(
    backendPath("/v1/media"),
    uploadResponseSchema,
    body({
      filename: file.name,
      contentType: file.type,
      byteSize: file.size,
      purpose,
    }),
  );
  await requestJson(
    backendPath(`/v1/media/${encodeURIComponent(upload.id)}/content`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: file,
    },
  );
  return upload;
}

/** Store a private verification document. */
export function uploadDocument(file: File) {
  return uploadMedia(file, "document");
}

export const apiMutations = {
  login: () =>
    mutationOptions({
      mutationKey: mutationKeys.auth("login"),
      meta: identity,
      mutationFn: (input: { email: string; password: string }) =>
        requestData("/api/session/login", accountResult, jsonBody(input)),
    }),
  forgotPassword: () =>
    mutationOptions({
      mutationKey: mutationKeys.auth("forgot-password"),
      meta: { isPublic: true },
      mutationFn: (input: { email: string }) =>
        requestData("/api/session/forgot-password", okSchema, jsonBody(input)),
    }),
  resetPassword: () =>
    mutationOptions({
      mutationKey: mutationKeys.auth("reset-password"),
      meta: identity,
      mutationFn: (input: { token: string; password: string }) =>
        requestData("/api/session/reset-password", okSchema, jsonBody(input)),
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
  updatePaymentDetails: () =>
    mutationOptions({
      mutationKey: mutationKeys.organization("payment-details"),
      // A changed PIX key can return the organization to verification.
      meta: { invalidates: [queryKeys.organizations, queryKeys.session] },
      mutationFn: (input: {
        organizationId: string;
        details: PaymentDetailsInput;
      }) =>
        requestData(
          backendPath(
            `/v1/organizations/${encodeURIComponent(input.organizationId)}/payment-details`,
          ),
          paymentDetailsSchema,
          body(input.details, "PUT"),
        ),
    }),
  respondToInvitation: () =>
    mutationOptions({
      mutationKey: mutationKeys.organization("respond-invitation"),
      meta: { invalidates: [queryKeys.organizations] },
      mutationFn: (input: {
        organizationId: string;
        decision: "accepted" | "declined";
      }) =>
        requestData(
          backendPath(
            `/v1/me/organizations/${encodeURIComponent(input.organizationId)}/membership`,
          ),
          organizationMemberSchema,
          body({ decision: input.decision }, "PUT"),
        ),
    }),
  submitVerification: () =>
    mutationOptions({
      mutationKey: mutationKeys.verification("submit"),
      meta: {
        invalidates: [
          ["verification"],
          queryKeys.profile,
          queryKeys.organizations,
          queryKeys.session,
        ],
      },
      mutationFn: async (input: {
        organizationId?: string;
        files: File[];
        notes: string;
      }) => {
        const documents: string[] = [];
        for (const file of input.files)
          documents.push((await uploadDocument(file)).url);
        const path = input.organizationId
          ? `/v1/organizations/${encodeURIComponent(input.organizationId)}/verification-submissions`
          : "/v1/me/verification";
        return requestData(
          backendPath(path),
          verificationRecordSchema,
          body({ documents, notes: input.notes.trim() || undefined }),
        );
      },
    }),
  reviewVerification: () =>
    mutationOptions({
      mutationKey: mutationKeys.verification("review"),
      meta: { invalidates: [["verification"]] },
      mutationFn: (input: {
        id: string;
        decision: "under_review" | "approved" | "rejected";
        reason: string;
      }) =>
        requestData(
          backendPath(
            `/v1/verifications/${encodeURIComponent(input.id)}/decision`,
          ),
          verificationRecordSchema,
          body({ decision: input.decision, reason: input.reason }),
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
  moderateImage: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("moderate-image"),
      meta: feedMeta,
      mutationFn: (input: {
        id: string;
        imageId: string;
        decision: "approved" | "rejected";
      }) =>
        requestData(
          backendPath(
            `/v1/animals/${encodeURIComponent(input.id)}/images/${encodeURIComponent(input.imageId)}/moderation`,
          ),
          animalImageSchema,
          body({ decision: input.decision }),
        ),
    }),
  clearPreference: () =>
    mutationOptions({
      mutationKey: mutationKeys.animal("clear-preference"),
      meta: feedMeta,
      mutationFn: (id: string) =>
        requestData(
          backendPath(`/v1/animals/${encodeURIComponent(id)}/preference`),
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
        liked?: boolean;
      }) => {
        if (input.type !== "pet")
          throw new Error(
            "Publicações independentes ainda não estão disponíveis.",
          );
        if (input.liked && !input.onlyLike) {
          await requestData(
            backendPath(
              `/v1/animals/${encodeURIComponent(input.id)}/preference`,
            ),
            z.null(),
            { method: "DELETE" },
          );
          return { liked: false };
        }
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
        if (input.hidden === false) {
          await requestData(
            backendPath(
              `/v1/animals/${encodeURIComponent(input.id)}/preference`,
            ),
            z.null(),
            { method: "DELETE" },
          );
          return { disliked: false };
        }
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
  withdrawApplication: () =>
    mutationOptions({
      mutationKey: mutationKeys.application("withdraw"),
      meta: workflowMeta,
      mutationFn: (input: { id: string; reason: string }) =>
        requestData(
          backendPath(
            `/v1/applications/${encodeURIComponent(input.id)}/withdrawal`,
          ),
          adoptionApplicationSchema,
          body({ reason: input.reason }),
        ),
    }),
  sendMessage: () =>
    mutationOptions({
      mutationKey: mutationKeys.message,
      meta: { invalidates: [queryKeys.conversations] },
      mutationFn: sendMessageRequest,
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
      }) =>
        requestData(
          backendPath("/v1/reports"),
          reportSchema,
          body({
            category: "other",
            description: input.reason,
            subjectType: input.targetType === "pet" ? "animal" : "post",
            subjectId: input.targetId,
          }),
        ),
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
