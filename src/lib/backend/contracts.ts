// Generated from the Go backend OpenAPI contract. Run pnpm api:generate.
import { z } from "zod";

export const addOrganizationMemberRequestSchema = z.object({
  email: z.string(),
  role: z.enum(["coordinator", "representative", "moderator"]),
});
export type AddOrganizationMemberRequest = z.output<
  typeof addOrganizationMemberRequestSchema
>;

export const adoptionApplicationSchema = z
  .object({
    adopter_id: z.string().nullable(),
    animal_id: z.string().nullable(),
    applicant_message: z.string(),
    completed_at: z.string().nullable(),
    created_at: z.string().nullable(),
    decided_at: z.string().nullable(),
    decided_by: z.string().nullable(),
    decision_reason: z.string().nullable(),
    id: z.string(),
    organization_id: z.string().nullable(),
    status: z.string(),
    updated_at: z.string().nullable(),
    withdrawn_at: z.string().nullable(),
  })
  .transform((value) => ({
    adopterId: value["adopter_id"],
    animalId: value["animal_id"],
    applicantMessage: value["applicant_message"],
    completedAt: value["completed_at"],
    createdAt: value["created_at"],
    decidedAt: value["decided_at"],
    decidedBy: value["decided_by"],
    decisionReason: value["decision_reason"],
    id: value["id"],
    organizationId: value["organization_id"],
    status: value["status"],
    updatedAt: value["updated_at"],
    withdrawnAt: value["withdrawn_at"],
  }));
export type AdoptionApplication = z.output<typeof adoptionApplicationSchema>;

export const agreementSignatureSchema = z
  .object({ sha256: z.string(), signed_at: z.string(), signer_id: z.string() })
  .transform((value) => ({
    sha256: value["sha256"],
    signedAt: value["signed_at"],
    signerId: value["signer_id"],
  }));
export type AgreementSignature = z.output<typeof agreementSignatureSchema>;

export const agreementResponseSchema = z
  .object({
    body: z.string(),
    created_at: z.string(),
    id: z.string(),
    representative_id: z.string(),
    sha256: z.string(),
    signatures: z
      .array(agreementSignatureSchema)
      .nullish()
      .transform((value) => value ?? []),
    template_id: z.string(),
    user_id: z.string(),
  })
  .transform((value) => ({
    body: value["body"],
    createdAt: value["created_at"],
    id: value["id"],
    representativeId: value["representative_id"],
    sha256: value["sha256"],
    signatures: value["signatures"],
    templateId: value["template_id"],
    userId: value["user_id"],
  }));
export type AgreementResponse = z.output<typeof agreementResponseSchema>;

export const agreementTemplateSchema = z
  .object({
    body: z.string(),
    created_at: z.string(),
    id: z.string(),
    kind: z.string(),
    version: z.number(),
  })
  .transform((value) => ({
    body: value["body"],
    createdAt: value["created_at"],
    id: value["id"],
    kind: value["kind"],
    version: value["version"],
  }));
export type AgreementTemplate = z.output<typeof agreementTemplateSchema>;

export const agreementTemplateRequestSchema = z.object({
  body: z.string(),
  kind: z.enum(["adoption", "surrender"]),
});
export type AgreementTemplateRequest = z.output<
  typeof agreementTemplateRequestSchema
>;

export const animalSchema = z
  .object({
    adopted_at: z.string().nullable(),
    approximate_age_months: z.number().nullable(),
    attributes: z.unknown(),
    behavior_notes: z.string(),
    birth_date: z.string().nullable(),
    breed: z.string().nullable(),
    city: z.string(),
    country_code: z.string(),
    created_at: z.string().nullable(),
    deleted_at: z.string().nullable(),
    description: z.string(),
    health_notes: z.string(),
    id: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    name: z.string(),
    neutered: z.boolean().nullable(),
    organization_review_notes: z.string().nullable(),
    organization_review_status: z.string(),
    published_at: z.string().nullable(),
    responsible_organization_id: z.string().nullable(),
    reviewed_at: z.string().nullable(),
    reviewed_by: z.string().nullable(),
    sex: z.string(),
    size: z.string(),
    source: z.string(),
    special_needs: z.boolean(),
    species: z.string(),
    state_code: z.string(),
    status: z.string(),
    submitted_by: z.string().nullable(),
    unavailable_reason: z.string().nullable(),
    updated_at: z.string().nullable(),
    vaccinated: z.boolean().nullable(),
  })
  .transform((value) => ({
    adoptedAt: value["adopted_at"],
    approximateAgeMonths: value["approximate_age_months"],
    attributes: value["attributes"],
    behaviorNotes: value["behavior_notes"],
    birthDate: value["birth_date"],
    breed: value["breed"],
    city: value["city"],
    countryCode: value["country_code"],
    createdAt: value["created_at"],
    deletedAt: value["deleted_at"],
    description: value["description"],
    healthNotes: value["health_notes"],
    id: value["id"],
    latitude: value["latitude"],
    longitude: value["longitude"],
    name: value["name"],
    neutered: value["neutered"],
    organizationReviewNotes: value["organization_review_notes"],
    organizationReviewStatus: value["organization_review_status"],
    publishedAt: value["published_at"],
    responsibleOrganizationId: value["responsible_organization_id"],
    reviewedAt: value["reviewed_at"],
    reviewedBy: value["reviewed_by"],
    sex: value["sex"],
    size: value["size"],
    source: value["source"],
    specialNeeds: value["special_needs"],
    species: value["species"],
    stateCode: value["state_code"],
    status: value["status"],
    submittedBy: value["submitted_by"],
    unavailableReason: value["unavailable_reason"],
    updatedAt: value["updated_at"],
    vaccinated: value["vaccinated"],
  }));
export type Animal = z.output<typeof animalSchema>;

export const animalAssignmentSchema = z
  .object({ organization_id: z.string(), reason: z.string() })
  .transform((value) => ({
    organizationId: value["organization_id"],
    reason: value["reason"],
  }));
export type AnimalAssignment = z.output<typeof animalAssignmentSchema>;

export const animalAttributesSchema = z
  .object({
    energy_level: z.enum(["low", "medium", "high"]).optional(),
    height_cm: z.number().optional(),
    medical_conditions: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
    neutered: z.boolean().optional(),
    special_needs: z.boolean().optional(),
    temperament: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
    vaccinated: z.boolean().optional(),
    weight_kg: z.number().optional(),
  })
  .transform((value) => ({
    energyLevel: value["energy_level"],
    heightCm: value["height_cm"],
    medicalConditions: value["medical_conditions"],
    neutered: value["neutered"],
    specialNeeds: value["special_needs"],
    temperament: value["temperament"],
    vaccinated: value["vaccinated"],
    weightKg: value["weight_kg"],
  }));
export type AnimalAttributes = z.output<typeof animalAttributesSchema>;

export const animalImageSchema = z
  .object({
    alt_text: z.string(),
    animal_id: z.string().nullable(),
    created_at: z.string().nullable(),
    id: z.string(),
    moderated_at: z.string().nullable(),
    moderated_by: z.string().nullable(),
    moderation_status: z.string(),
    position: z.number(),
    removed_at: z.string().nullable(),
    storage_key: z.string(),
  })
  .transform((value) => ({
    altText: value["alt_text"],
    animalId: value["animal_id"],
    createdAt: value["created_at"],
    id: value["id"],
    moderatedAt: value["moderated_at"],
    moderatedBy: value["moderated_by"],
    moderationStatus: value["moderation_status"],
    position: value["position"],
    removedAt: value["removed_at"],
    storageKey: value["storage_key"],
  }));
export type AnimalImage = z.output<typeof animalImageSchema>;

export const animalDetailResponseSchema = z.object({
  animal: animalSchema,
  images: z
    .array(animalImageSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type AnimalDetailResponse = z.output<typeof animalDetailResponseSchema>;

export const animalHistoryRecordSchema = z
  .object({
    action: z.string(),
    actor_id: z.string(),
    created_at: z.string(),
    from_status: z.string(),
    id: z.number(),
    organization_id: z.string().nullable(),
    previous_organization_id: z.string().nullable(),
    reason: z.string(),
    to_status: z.string(),
  })
  .transform((value) => ({
    action: value["action"],
    actorId: value["actor_id"],
    createdAt: value["created_at"],
    fromStatus: value["from_status"],
    id: value["id"],
    organizationId: value["organization_id"],
    previousOrganizationId: value["previous_organization_id"],
    reason: value["reason"],
    toStatus: value["to_status"],
  }));
export type AnimalHistoryRecord = z.output<typeof animalHistoryRecordSchema>;

export const animalHistoryResponseSchema = z.object({
  items: z
    .array(animalHistoryRecordSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type AnimalHistoryResponse = z.output<
  typeof animalHistoryResponseSchema
>;

export const animalImageRequestSchema = z
  .object({
    alt_text: z.string().optional(),
    position: z.number().optional(),
    url: z.string(),
  })
  .transform((value) => ({
    altText: value["alt_text"],
    position: value["position"],
    url: value["url"],
  }));
export type AnimalImageRequest = z.output<typeof animalImageRequestSchema>;

export const animalImageResponseSchema = z
  .object({
    alt_text: z.string(),
    created_at: z.string().nullable(),
    id: z.string(),
    moderation_status: z.enum(["pending", "approved", "rejected"]),
    position: z.number(),
    url: z.string(),
  })
  .transform((value) => ({
    altText: value["alt_text"],
    createdAt: value["created_at"],
    id: value["id"],
    moderationStatus: value["moderation_status"],
    position: value["position"],
    url: value["url"],
  }));
export type AnimalImageResponse = z.output<typeof animalImageResponseSchema>;

export const animalPreferenceSchema = z
  .object({
    animal_id: z.string().nullable(),
    created_at: z.string().nullable(),
    preference: z.string(),
    updated_at: z.string().nullable(),
    user_id: z.string().nullable(),
  })
  .transform((value) => ({
    animalId: value["animal_id"],
    createdAt: value["created_at"],
    preference: value["preference"],
    updatedAt: value["updated_at"],
    userId: value["user_id"],
  }));
export type AnimalPreference = z.output<typeof animalPreferenceSchema>;

export const locationInputSchema = z
  .object({
    city: z.string(),
    country_code: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    state: z.string(),
  })
  .transform((value) => ({
    city: value["city"],
    countryCode: value["country_code"],
    latitude: value["latitude"],
    longitude: value["longitude"],
    state: value["state"],
  }));
export type LocationInput = z.output<typeof locationInputSchema>;

export const animalRequestSchema = z
  .object({
    approximate_birth_date: z.string().optional(),
    attributes: animalAttributesSchema.optional(),
    behavior_notes: z.string().optional(),
    breed: z.string().optional(),
    description: z.string(),
    health_notes: z.string().optional(),
    location: locationInputSchema,
    name: z.string(),
    organization_id: z.string().optional(),
    sex: z.enum(["female", "male", "unknown"]),
    size: z.enum(["small", "medium", "large", "extra_large"]),
    species: z.enum([
      "dog",
      "cat",
      "bird",
      "rabbit",
      "reptile",
      "small_mammal",
      "other",
    ]),
  })
  .transform((value) => ({
    approximateBirthDate: value["approximate_birth_date"],
    attributes: value["attributes"],
    behaviorNotes: value["behavior_notes"],
    breed: value["breed"],
    description: value["description"],
    healthNotes: value["health_notes"],
    location: value["location"],
    name: value["name"],
    organizationId: value["organization_id"],
    sex: value["sex"],
    size: value["size"],
    species: value["species"],
  }));
export type AnimalRequest = z.output<typeof animalRequestSchema>;

export const animalStatusRequestSchema = z.object({
  reason: z.string(),
  status: z.enum([
    "pending_organization",
    "available",
    "adoption_in_progress",
    "unavailable",
    "under_review",
  ]),
});
export type AnimalStatusRequest = z.output<typeof animalStatusRequestSchema>;

export const applicationCreatedResponseSchema = z
  .object({
    application: adoptionApplicationSchema,
    conversation_id: z.string(),
  })
  .transform((value) => ({
    application: value["application"],
    conversationId: value["conversation_id"],
  }));
export type ApplicationCreatedResponse = z.output<
  typeof applicationCreatedResponseSchema
>;

export const applicationDecisionRequestSchema = z.object({
  decision: z.enum(["approved", "rejected", "needs_information"]),
  reason: z.string(),
});
export type ApplicationDecisionRequest = z.output<
  typeof applicationDecisionRequestSchema
>;

export const getAdoptionApplicationByIDRowSchema = z
  .object({
    adopter_email: z.string(),
    adopter_id: z.string().nullable(),
    adopter_name: z.string(),
    adopter_verification_status: z.string(),
    animal_id: z.string().nullable(),
    animal_name: z.string(),
    animal_status: z.string(),
    applicant_message: z.string(),
    completed_at: z.string().nullable(),
    created_at: z.string().nullable(),
    decided_at: z.string().nullable(),
    decided_by: z.string().nullable(),
    decision_reason: z.string().nullable(),
    id: z.string(),
    organization_id: z.string().nullable(),
    organization_name: z.string(),
    status: z.string(),
    updated_at: z.string().nullable(),
    withdrawn_at: z.string().nullable(),
  })
  .transform((value) => ({
    adopterEmail: value["adopter_email"],
    adopterId: value["adopter_id"],
    adopterName: value["adopter_name"],
    adopterVerificationStatus: value["adopter_verification_status"],
    animalId: value["animal_id"],
    animalName: value["animal_name"],
    animalStatus: value["animal_status"],
    applicantMessage: value["applicant_message"],
    completedAt: value["completed_at"],
    createdAt: value["created_at"],
    decidedAt: value["decided_at"],
    decidedBy: value["decided_by"],
    decisionReason: value["decision_reason"],
    id: value["id"],
    organizationId: value["organization_id"],
    organizationName: value["organization_name"],
    status: value["status"],
    updatedAt: value["updated_at"],
    withdrawnAt: value["withdrawn_at"],
  }));
export type GetAdoptionApplicationByIDRow = z.output<
  typeof getAdoptionApplicationByIDRowSchema
>;

export const conversationSchema = z
  .object({
    animal_id: z.string().nullable(),
    application_id: z.string().nullable(),
    closed_at: z.string().nullable(),
    closed_by: z.string().nullable(),
    counterparty_user_id: z.string().nullable(),
    created_at: z.string().nullable(),
    id: z.string(),
    kind: z.string(),
    organization_id: z.string().nullable(),
    status: z.string(),
    updated_at: z.string().nullable(),
  })
  .transform((value) => ({
    animalId: value["animal_id"],
    applicationId: value["application_id"],
    closedAt: value["closed_at"],
    closedBy: value["closed_by"],
    counterpartyUserId: value["counterparty_user_id"],
    createdAt: value["created_at"],
    id: value["id"],
    kind: value["kind"],
    organizationId: value["organization_id"],
    status: value["status"],
    updatedAt: value["updated_at"],
  }));
export type Conversation = z.output<typeof conversationSchema>;

export const applicationStatusHistorySchema = z
  .object({
    application_id: z.string().nullable(),
    changed_by: z.string().nullable(),
    created_at: z.string().nullable(),
    from_status: z.string().nullable(),
    id: z.number(),
    reason: z.string().nullable(),
    to_status: z.string(),
  })
  .transform((value) => ({
    applicationId: value["application_id"],
    changedBy: value["changed_by"],
    createdAt: value["created_at"],
    fromStatus: value["from_status"],
    id: value["id"],
    reason: value["reason"],
    toStatus: value["to_status"],
  }));
export type ApplicationStatusHistory = z.output<
  typeof applicationStatusHistorySchema
>;

export const applicationScreeningSchema = z
  .object({
    answers: z.unknown(),
    application_id: z.string().nullable(),
    created_at: z.string().nullable(),
    id: z.string(),
    outcome: z.string().nullable(),
    private_notes: z.string().nullable(),
    questions: z.unknown(),
    requested_by: z.string().nullable(),
    reviewed_at: z.string().nullable(),
    reviewed_by: z.string().nullable(),
    status: z.string(),
    submitted_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    version: z.number(),
  })
  .transform((value) => ({
    answers: value["answers"],
    applicationId: value["application_id"],
    createdAt: value["created_at"],
    id: value["id"],
    outcome: value["outcome"],
    privateNotes: value["private_notes"],
    questions: value["questions"],
    requestedBy: value["requested_by"],
    reviewedAt: value["reviewed_at"],
    reviewedBy: value["reviewed_by"],
    status: value["status"],
    submittedAt: value["submitted_at"],
    updatedAt: value["updated_at"],
    version: value["version"],
  }));
export type ApplicationScreening = z.output<typeof applicationScreeningSchema>;

export const applicationDetailResponseSchema = z.object({
  application: getAdoptionApplicationByIDRowSchema,
  conversations: z
    .array(conversationSchema)
    .nullish()
    .transform((value) => value ?? []),
  history: z
    .array(applicationStatusHistorySchema)
    .nullish()
    .transform((value) => value ?? []),
  screening: applicationScreeningSchema.optional(),
});
export type ApplicationDetailResponse = z.output<
  typeof applicationDetailResponseSchema
>;

export const applicationRequestSchema = z
  .object({ animal_id: z.string(), introduction: z.string() })
  .transform((value) => ({
    animalId: value["animal_id"],
    introduction: value["introduction"],
  }));
export type ApplicationRequest = z.output<typeof applicationRequestSchema>;

export const appointmentSchema = z
  .object({
    address: z.string(),
    application_id: z.string().nullable(),
    cancellation_reason: z.string().nullable(),
    cancelled_at: z.string().nullable(),
    cancelled_by: z.string().nullable(),
    created_at: z.string().nullable(),
    created_by: z.string().nullable(),
    ends_at: z.string().nullable(),
    id: z.string(),
    instructions: z.string(),
    kind: z.string(),
    latitude: z.number().nullable(),
    location_name: z.string(),
    longitude: z.number().nullable(),
    organization_id: z.string().nullable(),
    otp_required: z.boolean(),
    starts_at: z.string().nullable(),
    status: z.string(),
    timezone: z.string(),
    updated_at: z.string().nullable(),
  })
  .transform((value) => ({
    address: value["address"],
    applicationId: value["application_id"],
    cancellationReason: value["cancellation_reason"],
    cancelledAt: value["cancelled_at"],
    cancelledBy: value["cancelled_by"],
    createdAt: value["created_at"],
    createdBy: value["created_by"],
    endsAt: value["ends_at"],
    id: value["id"],
    instructions: value["instructions"],
    kind: value["kind"],
    latitude: value["latitude"],
    locationName: value["location_name"],
    longitude: value["longitude"],
    organizationId: value["organization_id"],
    otpRequired: value["otp_required"],
    startsAt: value["starts_at"],
    status: value["status"],
    timezone: value["timezone"],
    updatedAt: value["updated_at"],
  }));
export type Appointment = z.output<typeof appointmentSchema>;

export const appointmentConfirmationSchema = z
  .object({
    appointment_id: z.string().nullable(),
    confirmation: z.string(),
    confirmed_at: z.string().nullable(),
    confirmed_by: z.string().nullable(),
    id: z.string(),
    notes: z.string().nullable(),
    party: z.string(),
  })
  .transform((value) => ({
    appointmentId: value["appointment_id"],
    confirmation: value["confirmation"],
    confirmedAt: value["confirmed_at"],
    confirmedBy: value["confirmed_by"],
    id: value["id"],
    notes: value["notes"],
    party: value["party"],
  }));
export type AppointmentConfirmation = z.output<
  typeof appointmentConfirmationSchema
>;

export const appointmentConfirmationRequestSchema = z
  .object({
    otp_code: z.string().optional(),
    type: z.enum(["delivery", "receipt"]),
  })
  .transform((value) => ({ otpCode: value["otp_code"], type: value["type"] }));
export type AppointmentConfirmationRequest = z.output<
  typeof appointmentConfirmationRequestSchema
>;

export const appointmentDetailResponseSchema = z.object({
  appointment: appointmentSchema,
  confirmations: z
    .array(appointmentConfirmationSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type AppointmentDetailResponse = z.output<
  typeof appointmentDetailResponseSchema
>;

export const appointmentListResponseSchema = z.object({
  items: z
    .array(appointmentSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type AppointmentListResponse = z.output<
  typeof appointmentListResponseSchema
>;

export const appointmentRequestSchema = z
  .object({
    address: z.string(),
    ends_at: z.string(),
    instructions: z.string().optional(),
    location_name: z.string(),
    purpose: z.enum([
      "interview",
      "home_visit",
      "meet_and_greet",
      "delivery",
      "follow_up",
    ]),
    starts_at: z.string(),
    timezone: z.string(),
  })
  .transform((value) => ({
    address: value["address"],
    endsAt: value["ends_at"],
    instructions: value["instructions"],
    locationName: value["location_name"],
    purpose: value["purpose"],
    startsAt: value["starts_at"],
    timezone: value["timezone"],
  }));
export type AppointmentRequest = z.output<typeof appointmentRequestSchema>;

export const authErrorResponseSchema = z.object({ error: z.string() });
export type AuthErrorResponse = z.output<typeof authErrorResponseSchema>;

export const locationResponseSchema = z
  .object({
    city: z.string().nullable(),
    country_code: z.string(),
    state: z.string().nullable(),
  })
  .transform((value) => ({
    city: value["city"],
    countryCode: value["country_code"],
    state: value["state"],
  }))
  .nullable();
export type LocationResponse = z.output<typeof locationResponseSchema>;

export const postalAddressSchema = z
  .object({
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    number: z.string().optional(),
    postal_code: z.string().optional(),
    street: z.string().optional(),
  })
  .transform((value) => ({
    complement: value["complement"],
    neighborhood: value["neighborhood"],
    number: value["number"],
    postalCode: value["postal_code"],
    street: value["street"],
  }));
export type PostalAddress = z.output<typeof postalAddressSchema>;

export const personalProfileSchema = z
  .object({
    address: postalAddressSchema.optional(),
    allow_organization_contact: z.boolean().optional(),
    avatar_url: z.string().optional(),
    biography: z.string().optional(),
    birth_date: z.string().optional(),
    cpf: z.string().optional(),
    documents: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
    housing: z.string().optional(),
    occupation: z.string().optional(),
    preferences: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
    social_links: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
  })
  .transform((value) => ({
    address: value["address"],
    allowOrganizationContact: value["allow_organization_contact"],
    avatarUrl: value["avatar_url"],
    biography: value["biography"],
    birthDate: value["birth_date"],
    cpf: value["cpf"],
    documents: value["documents"],
    housing: value["housing"],
    occupation: value["occupation"],
    preferences: value["preferences"],
    socialLinks: value["social_links"],
  }));
export type PersonalProfile = z.output<typeof personalProfileSchema>;

export const userResponseSchema = z
  .object({
    created_at: z.string().nullable(),
    email: z.string(),
    id: z.string(),
    location: locationResponseSchema,
    name: z.string(),
    phone: z.string().nullable(),
    profile: personalProfileSchema,
    roles: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? []),
    updated_at: z.string().nullable(),
    verification_status: z.string(),
  })
  .transform((value) => ({
    createdAt: value["created_at"],
    email: value["email"],
    id: value["id"],
    location: value["location"],
    name: value["name"],
    phone: value["phone"],
    profile: value["profile"],
    roles: value["roles"],
    updatedAt: value["updated_at"],
    verificationStatus: value["verification_status"],
  }));
export type UserResponse = z.output<typeof userResponseSchema>;

export const authSessionResponseSchema = z
  .object({
    access_token: z.string(),
    expires_in: z.number(),
    refresh_token: z.string(),
    token_type: z.enum(["Bearer"]),
    user: userResponseSchema,
  })
  .transform((value) => ({
    accessToken: value["access_token"],
    expiresIn: value["expires_in"],
    refreshToken: value["refresh_token"],
    tokenType: value["token_type"],
    user: value["user"],
  }));
export type AuthSessionResponse = z.output<typeof authSessionResponseSchema>;

export const chatCommandSchema = z
  .object({
    body: z.string(),
    client_id: z.string().optional(),
    type: z.enum(["message.send"]),
  })
  .transform((value) => ({
    body: value["body"],
    clientId: value["client_id"],
    type: value["type"],
  }));
export type ChatCommand = z.output<typeof chatCommandSchema>;

export const problemSchema = z.object({
  detail: z.string().optional(),
  errors: z.record(z.string(), z.unknown()).optional(),
  status: z.number(),
  title: z.string(),
  type: z.string(),
});
export type Problem = z.output<typeof problemSchema>;

export const messageSchema = z
  .object({
    body: z.string(),
    conversation_id: z.string().nullable(),
    created_at: z.string().nullable(),
    deleted_at: z.string().nullable(),
    edited_at: z.string().nullable(),
    id: z.string(),
    moderated_at: z.string().nullable(),
    moderated_by: z.string().nullable(),
    moderation_reason: z.string().nullable(),
    moderation_status: z.string(),
    sender_id: z.string().nullable(),
  })
  .transform((value) => ({
    body: value["body"],
    conversationId: value["conversation_id"],
    createdAt: value["created_at"],
    deletedAt: value["deleted_at"],
    editedAt: value["edited_at"],
    id: value["id"],
    moderatedAt: value["moderated_at"],
    moderatedBy: value["moderated_by"],
    moderationReason: value["moderation_reason"],
    moderationStatus: value["moderation_status"],
    senderId: value["sender_id"],
  }));
export type Message = z.output<typeof messageSchema>;

export const chatEventSchema = z
  .object({
    client_id: z.string().optional(),
    error: problemSchema.optional(),
    message: messageSchema.optional(),
    type: z.enum(["message.created", "message.ack", "error"]),
    warning: z.string().optional(),
  })
  .transform((value) => ({
    clientId: value["client_id"],
    error: value["error"],
    message: value["message"],
    type: value["type"],
    warning: value["warning"],
  }));
export type ChatEvent = z.output<typeof chatEventSchema>;

export const chatTicketResponseSchema = z
  .object({
    expires_at: z.string(),
    subprotocol: z.string(),
    ticket: z.string(),
    url: z.string(),
  })
  .transform((value) => ({
    expiresAt: value["expires_at"],
    subprotocol: value["subprotocol"],
    ticket: value["ticket"],
    url: value["url"],
  }));
export type ChatTicketResponse = z.output<typeof chatTicketResponseSchema>;

export const pageResponseSchema = z
  .object({ page: z.number(), page_size: z.number(), total: z.number() })
  .transform((value) => ({
    page: value["page"],
    pageSize: value["page_size"],
    total: value["total"],
  }));
export type PageResponse = z.output<typeof pageResponseSchema>;

export const collectionResponseAnimalSchema = z.object({
  items: z
    .array(animalSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseAnimal = z.output<
  typeof collectionResponseAnimalSchema
>;

export const donationResponseSchema = z
  .object({
    amount_cents: z.number(),
    anonymous: z.boolean(),
    created_at: z.string(),
    currency: z.string(),
    decision_reason: z.string().nullable(),
    donor_id: z.string().nullable(),
    donor_name: z.string().nullable(),
    id: z.string(),
    note: z.string(),
    organization_id: z.string(),
    organization_name: z.string(),
    receipt_media_id: z.string().nullable(),
    status: z.string(),
    transferred_at: z.string(),
  })
  .transform((value) => ({
    amountCents: value["amount_cents"],
    anonymous: value["anonymous"],
    createdAt: value["created_at"],
    currency: value["currency"],
    decisionReason: value["decision_reason"],
    donorId: value["donor_id"],
    donorName: value["donor_name"],
    id: value["id"],
    note: value["note"],
    organizationId: value["organization_id"],
    organizationName: value["organization_name"],
    receiptMediaId: value["receipt_media_id"],
    status: value["status"],
    transferredAt: value["transferred_at"],
  }));
export type DonationResponse = z.output<typeof donationResponseSchema>;

export const collectionResponseDonationResponseSchema = z.object({
  items: z
    .array(donationResponseSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseDonationResponse = z.output<
  typeof collectionResponseDonationResponseSchema
>;

export const listAdopterApplicationsRowSchema = z
  .object({
    adopter_id: z.string().nullable(),
    animal_id: z.string().nullable(),
    animal_name: z.string(),
    applicant_message: z.string(),
    completed_at: z.string().nullable(),
    created_at: z.string().nullable(),
    decided_at: z.string().nullable(),
    decided_by: z.string().nullable(),
    decision_reason: z.string().nullable(),
    id: z.string(),
    organization_id: z.string().nullable(),
    organization_name: z.string(),
    status: z.string(),
    updated_at: z.string().nullable(),
    withdrawn_at: z.string().nullable(),
  })
  .transform((value) => ({
    adopterId: value["adopter_id"],
    animalId: value["animal_id"],
    animalName: value["animal_name"],
    applicantMessage: value["applicant_message"],
    completedAt: value["completed_at"],
    createdAt: value["created_at"],
    decidedAt: value["decided_at"],
    decidedBy: value["decided_by"],
    decisionReason: value["decision_reason"],
    id: value["id"],
    organizationId: value["organization_id"],
    organizationName: value["organization_name"],
    status: value["status"],
    updatedAt: value["updated_at"],
    withdrawnAt: value["withdrawn_at"],
  }));
export type ListAdopterApplicationsRow = z.output<
  typeof listAdopterApplicationsRowSchema
>;

export const collectionResponseListAdopterApplicationsRowSchema = z.object({
  items: z
    .array(listAdopterApplicationsRowSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseListAdopterApplicationsRow = z.output<
  typeof collectionResponseListAdopterApplicationsRowSchema
>;

export const listAvailableAnimalsRowSchema = z
  .object({
    adopted_at: z.string().nullable(),
    approximate_age_months: z.number().nullable(),
    attributes: z.unknown(),
    behavior_notes: z.string(),
    birth_date: z.string().nullable(),
    breed: z.string().nullable(),
    city: z.string(),
    country_code: z.string(),
    created_at: z.string().nullable(),
    deleted_at: z.string().nullable(),
    description: z.string(),
    distance_score: z.unknown(),
    health_notes: z.string(),
    id: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    name: z.string(),
    neutered: z.boolean().nullable(),
    organization_name: z.string(),
    organization_review_notes: z.string().nullable(),
    organization_review_status: z.string(),
    organization_slug: z.string(),
    published_at: z.string().nullable(),
    responsible_organization_id: z.string().nullable(),
    reviewed_at: z.string().nullable(),
    reviewed_by: z.string().nullable(),
    sex: z.string(),
    size: z.string(),
    source: z.string(),
    special_needs: z.boolean(),
    species: z.string(),
    state_code: z.string(),
    status: z.string(),
    submitted_by: z.string().nullable(),
    unavailable_reason: z.string().nullable(),
    updated_at: z.string().nullable(),
    vaccinated: z.boolean().nullable(),
  })
  .transform((value) => ({
    adoptedAt: value["adopted_at"],
    approximateAgeMonths: value["approximate_age_months"],
    attributes: value["attributes"],
    behaviorNotes: value["behavior_notes"],
    birthDate: value["birth_date"],
    breed: value["breed"],
    city: value["city"],
    countryCode: value["country_code"],
    createdAt: value["created_at"],
    deletedAt: value["deleted_at"],
    description: value["description"],
    distanceScore: value["distance_score"],
    healthNotes: value["health_notes"],
    id: value["id"],
    latitude: value["latitude"],
    longitude: value["longitude"],
    name: value["name"],
    neutered: value["neutered"],
    organizationName: value["organization_name"],
    organizationReviewNotes: value["organization_review_notes"],
    organizationReviewStatus: value["organization_review_status"],
    organizationSlug: value["organization_slug"],
    publishedAt: value["published_at"],
    responsibleOrganizationId: value["responsible_organization_id"],
    reviewedAt: value["reviewed_at"],
    reviewedBy: value["reviewed_by"],
    sex: value["sex"],
    size: value["size"],
    source: value["source"],
    specialNeeds: value["special_needs"],
    species: value["species"],
    stateCode: value["state_code"],
    status: value["status"],
    submittedBy: value["submitted_by"],
    unavailableReason: value["unavailable_reason"],
    updatedAt: value["updated_at"],
    vaccinated: value["vaccinated"],
  }));
export type ListAvailableAnimalsRow = z.output<
  typeof listAvailableAnimalsRowSchema
>;

export const collectionResponseListAvailableAnimalsRowSchema = z.object({
  items: z
    .array(listAvailableAnimalsRowSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseListAvailableAnimalsRow = z.output<
  typeof collectionResponseListAvailableAnimalsRowSchema
>;

export const listOpenReportsRowSchema = z
  .object({
    animal_id: z.string().nullable(),
    application_id: z.string().nullable(),
    assigned_to: z.string().nullable(),
    category: z.string(),
    conversation_id: z.string().nullable(),
    created_at: z.string().nullable(),
    description: z.string(),
    id: z.string(),
    message_id: z.string().nullable(),
    organization_id: z.string().nullable(),
    post_id: z.string().nullable(),
    priority: z.string(),
    reporter_id: z.string().nullable(),
    reporter_name: z.string(),
    resolution: z.string().nullable(),
    resolved_at: z.string().nullable(),
    resolved_by: z.string().nullable(),
    status: z.string(),
    updated_at: z.string().nullable(),
  })
  .transform((value) => ({
    animalId: value["animal_id"],
    applicationId: value["application_id"],
    assignedTo: value["assigned_to"],
    category: value["category"],
    conversationId: value["conversation_id"],
    createdAt: value["created_at"],
    description: value["description"],
    id: value["id"],
    messageId: value["message_id"],
    organizationId: value["organization_id"],
    postId: value["post_id"],
    priority: value["priority"],
    reporterId: value["reporter_id"],
    reporterName: value["reporter_name"],
    resolution: value["resolution"],
    resolvedAt: value["resolved_at"],
    resolvedBy: value["resolved_by"],
    status: value["status"],
    updatedAt: value["updated_at"],
  }));
export type ListOpenReportsRow = z.output<typeof listOpenReportsRowSchema>;

export const collectionResponseListOpenReportsRowSchema = z.object({
  items: z
    .array(listOpenReportsRowSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseListOpenReportsRow = z.output<
  typeof collectionResponseListOpenReportsRowSchema
>;

export const listOrganizationApplicationsRowSchema = z
  .object({
    adopter_id: z.string().nullable(),
    adopter_name: z.string(),
    adopter_verification_status: z.string(),
    animal_id: z.string().nullable(),
    animal_name: z.string(),
    applicant_message: z.string(),
    completed_at: z.string().nullable(),
    created_at: z.string().nullable(),
    decided_at: z.string().nullable(),
    decided_by: z.string().nullable(),
    decision_reason: z.string().nullable(),
    id: z.string(),
    organization_id: z.string().nullable(),
    status: z.string(),
    updated_at: z.string().nullable(),
    withdrawn_at: z.string().nullable(),
  })
  .transform((value) => ({
    adopterId: value["adopter_id"],
    adopterName: value["adopter_name"],
    adopterVerificationStatus: value["adopter_verification_status"],
    animalId: value["animal_id"],
    animalName: value["animal_name"],
    applicantMessage: value["applicant_message"],
    completedAt: value["completed_at"],
    createdAt: value["created_at"],
    decidedAt: value["decided_at"],
    decidedBy: value["decided_by"],
    decisionReason: value["decision_reason"],
    id: value["id"],
    organizationId: value["organization_id"],
    status: value["status"],
    updatedAt: value["updated_at"],
    withdrawnAt: value["withdrawn_at"],
  }));
export type ListOrganizationApplicationsRow = z.output<
  typeof listOrganizationApplicationsRowSchema
>;

export const collectionResponseListOrganizationApplicationsRowSchema = z.object(
  {
    items: z
      .array(listOrganizationApplicationsRowSchema)
      .nullish()
      .transform((value) => value ?? []),
    page: pageResponseSchema,
  },
);
export type CollectionResponseListOrganizationApplicationsRow = z.output<
  typeof collectionResponseListOrganizationApplicationsRowSchema
>;

export const listOrganizationConversationsRowSchema = z
  .object({
    animal_id: z.string().nullable(),
    animal_name: z.string(),
    application_id: z.string().nullable(),
    closed_at: z.string().nullable(),
    closed_by: z.string().nullable(),
    counterparty_name: z.string(),
    counterparty_user_id: z.string().nullable(),
    created_at: z.string().nullable(),
    id: z.string(),
    kind: z.string(),
    last_message_at: z.string().nullable(),
    last_message_body: z.string(),
    organization_id: z.string().nullable(),
    status: z.string(),
    updated_at: z.string().nullable(),
  })
  .transform((value) => ({
    animalId: value["animal_id"],
    animalName: value["animal_name"],
    applicationId: value["application_id"],
    closedAt: value["closed_at"],
    closedBy: value["closed_by"],
    counterpartyName: value["counterparty_name"],
    counterpartyUserId: value["counterparty_user_id"],
    createdAt: value["created_at"],
    id: value["id"],
    kind: value["kind"],
    lastMessageAt: value["last_message_at"],
    lastMessageBody: value["last_message_body"],
    organizationId: value["organization_id"],
    status: value["status"],
    updatedAt: value["updated_at"],
  }));
export type ListOrganizationConversationsRow = z.output<
  typeof listOrganizationConversationsRowSchema
>;

export const collectionResponseListOrganizationConversationsRowSchema =
  z.object({
    items: z
      .array(listOrganizationConversationsRowSchema)
      .nullish()
      .transform((value) => value ?? []),
    page: pageResponseSchema,
  });
export type CollectionResponseListOrganizationConversationsRow = z.output<
  typeof collectionResponseListOrganizationConversationsRowSchema
>;

export const listPreferredAnimalsRowSchema = z
  .object({
    adopted_at: z.string().nullable(),
    approximate_age_months: z.number().nullable(),
    attributes: z.unknown(),
    behavior_notes: z.string(),
    birth_date: z.string().nullable(),
    breed: z.string().nullable(),
    city: z.string(),
    country_code: z.string(),
    created_at: z.string().nullable(),
    deleted_at: z.string().nullable(),
    description: z.string(),
    health_notes: z.string(),
    id: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    name: z.string(),
    neutered: z.boolean().nullable(),
    organization_name: z.string().nullable(),
    organization_review_notes: z.string().nullable(),
    organization_review_status: z.string(),
    organization_slug: z.string().nullable(),
    preference: z.string(),
    preference_updated_at: z.string().nullable(),
    published_at: z.string().nullable(),
    responsible_organization_id: z.string().nullable(),
    reviewed_at: z.string().nullable(),
    reviewed_by: z.string().nullable(),
    sex: z.string(),
    size: z.string(),
    source: z.string(),
    special_needs: z.boolean(),
    species: z.string(),
    state_code: z.string(),
    status: z.string(),
    submitted_by: z.string().nullable(),
    unavailable_reason: z.string().nullable(),
    updated_at: z.string().nullable(),
    vaccinated: z.boolean().nullable(),
  })
  .transform((value) => ({
    adoptedAt: value["adopted_at"],
    approximateAgeMonths: value["approximate_age_months"],
    attributes: value["attributes"],
    behaviorNotes: value["behavior_notes"],
    birthDate: value["birth_date"],
    breed: value["breed"],
    city: value["city"],
    countryCode: value["country_code"],
    createdAt: value["created_at"],
    deletedAt: value["deleted_at"],
    description: value["description"],
    healthNotes: value["health_notes"],
    id: value["id"],
    latitude: value["latitude"],
    longitude: value["longitude"],
    name: value["name"],
    neutered: value["neutered"],
    organizationName: value["organization_name"],
    organizationReviewNotes: value["organization_review_notes"],
    organizationReviewStatus: value["organization_review_status"],
    organizationSlug: value["organization_slug"],
    preference: value["preference"],
    preferenceUpdatedAt: value["preference_updated_at"],
    publishedAt: value["published_at"],
    responsibleOrganizationId: value["responsible_organization_id"],
    reviewedAt: value["reviewed_at"],
    reviewedBy: value["reviewed_by"],
    sex: value["sex"],
    size: value["size"],
    source: value["source"],
    specialNeeds: value["special_needs"],
    species: value["species"],
    stateCode: value["state_code"],
    status: value["status"],
    submittedBy: value["submitted_by"],
    unavailableReason: value["unavailable_reason"],
    updatedAt: value["updated_at"],
    vaccinated: value["vaccinated"],
  }));
export type ListPreferredAnimalsRow = z.output<
  typeof listPreferredAnimalsRowSchema
>;

export const collectionResponseListPreferredAnimalsRowSchema = z.object({
  items: z
    .array(listPreferredAnimalsRowSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseListPreferredAnimalsRow = z.output<
  typeof collectionResponseListPreferredAnimalsRowSchema
>;

export const listUserConversationsRowSchema = z
  .object({
    animal_id: z.string().nullable(),
    animal_name: z.string(),
    application_id: z.string().nullable(),
    closed_at: z.string().nullable(),
    closed_by: z.string().nullable(),
    counterparty_user_id: z.string().nullable(),
    created_at: z.string().nullable(),
    id: z.string(),
    kind: z.string(),
    last_message_at: z.string().nullable(),
    last_message_body: z.string(),
    organization_id: z.string().nullable(),
    organization_name: z.string(),
    status: z.string(),
    updated_at: z.string().nullable(),
  })
  .transform((value) => ({
    animalId: value["animal_id"],
    animalName: value["animal_name"],
    applicationId: value["application_id"],
    closedAt: value["closed_at"],
    closedBy: value["closed_by"],
    counterpartyUserId: value["counterparty_user_id"],
    createdAt: value["created_at"],
    id: value["id"],
    kind: value["kind"],
    lastMessageAt: value["last_message_at"],
    lastMessageBody: value["last_message_body"],
    organizationId: value["organization_id"],
    organizationName: value["organization_name"],
    status: value["status"],
    updatedAt: value["updated_at"],
  }));
export type ListUserConversationsRow = z.output<
  typeof listUserConversationsRowSchema
>;

export const collectionResponseListUserConversationsRowSchema = z.object({
  items: z
    .array(listUserConversationsRowSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseListUserConversationsRow = z.output<
  typeof collectionResponseListUserConversationsRowSchema
>;

export const officialChannelsResponseSchema = z.object({
  email: z.string(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
});
export type OfficialChannelsResponse = z.output<
  typeof officialChannelsResponseSchema
>;

export const organizationPrivateProfileSchema = z
  .object({
    consent_document_review: z.boolean().optional(),
    consent_public_contact: z.boolean().optional(),
    documents: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
    representative_cpf: z.string().optional(),
    representative_email: z.string().optional(),
    representative_name: z.string().optional(),
    representative_phone: z.string().optional(),
  })
  .transform((value) => ({
    consentDocumentReview: value["consent_document_review"],
    consentPublicContact: value["consent_public_contact"],
    documents: value["documents"],
    representativeCpf: value["representative_cpf"],
    representativeEmail: value["representative_email"],
    representativeName: value["representative_name"],
    representativePhone: value["representative_phone"],
  }));
export type OrganizationPrivateProfile = z.output<
  typeof organizationPrivateProfileSchema
>;

export const organizationPublicProfileSchema = z
  .object({
    adoption_policy: z.string().optional(),
    capacity: z.number().optional(),
    gallery: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
    logo_url: z.string().optional(),
    service_areas: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
    type: z.enum(["ngo", "shelter", "rescue_group", "independent"]).optional(),
  })
  .transform((value) => ({
    adoptionPolicy: value["adoption_policy"],
    capacity: value["capacity"],
    gallery: value["gallery"],
    logoUrl: value["logo_url"],
    serviceAreas: value["service_areas"],
    type: value["type"],
  }));
export type OrganizationPublicProfile = z.output<
  typeof organizationPublicProfileSchema
>;

export const organizationResponseSchema = z
  .object({
    created_at: z.string().nullable(),
    description: z.string(),
    id: z.string(),
    legal_name: z.string().optional(),
    location: locationResponseSchema,
    name: z.string(),
    official_channels: officialChannelsResponseSchema,
    private_profile: organizationPrivateProfileSchema.optional(),
    profile: organizationPublicProfileSchema,
    registration_number: z.string().optional(),
    slug: z.string(),
    updated_at: z.string().nullable(),
    verification_notes: z.string().nullable().optional(),
    verification_status: z.enum([
      "pending",
      "verified",
      "rejected",
      "suspended",
    ]),
    verified_at: z.string().nullable(),
  })
  .transform((value) => ({
    createdAt: value["created_at"],
    description: value["description"],
    id: value["id"],
    legalName: value["legal_name"],
    location: value["location"],
    name: value["name"],
    officialChannels: value["official_channels"],
    privateProfile: value["private_profile"],
    profile: value["profile"],
    registrationNumber: value["registration_number"],
    slug: value["slug"],
    updatedAt: value["updated_at"],
    verificationNotes: value["verification_notes"],
    verificationStatus: value["verification_status"],
    verifiedAt: value["verified_at"],
  }));
export type OrganizationResponse = z.output<typeof organizationResponseSchema>;

export const memberOrganizationResponseSchema = z
  .object({
    member_role: z.string(),
    membership_status: z.enum(["active", "invited"]),
    organization: organizationResponseSchema,
  })
  .transform((value) => ({
    memberRole: value["member_role"],
    membershipStatus: value["membership_status"],
    organization: value["organization"],
  }));
export type MemberOrganizationResponse = z.output<
  typeof memberOrganizationResponseSchema
>;

export const collectionResponseMemberOrganizationResponseSchema = z.object({
  items: z
    .array(memberOrganizationResponseSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseMemberOrganizationResponse = z.output<
  typeof collectionResponseMemberOrganizationResponseSchema
>;

export const collectionResponseMessageSchema = z.object({
  items: z
    .array(messageSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseMessage = z.output<
  typeof collectionResponseMessageSchema
>;

export const notificationResponseSchema = z
  .object({
    application_id: z.string().nullable(),
    audience: z.enum(["requester", "organization"]),
    created_at: z.string(),
    id: z.string(),
    kind: z.string(),
    read_at: z.string().nullable(),
    subject_id: z.string(),
  })
  .transform((value) => ({
    applicationId: value["application_id"],
    audience: value["audience"],
    createdAt: value["created_at"],
    id: value["id"],
    kind: value["kind"],
    readAt: value["read_at"],
    subjectId: value["subject_id"],
  }));
export type NotificationResponse = z.output<typeof notificationResponseSchema>;

export const collectionResponseNotificationResponseSchema = z.object({
  items: z
    .array(notificationResponseSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseNotificationResponse = z.output<
  typeof collectionResponseNotificationResponseSchema
>;

export const collectionResponseOrganizationResponseSchema = z.object({
  items: z
    .array(organizationResponseSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseOrganizationResponse = z.output<
  typeof collectionResponseOrganizationResponseSchema
>;

export const postResponseSchema = z
  .object({
    author_id: z.string(),
    body: z.string(),
    created_at: z.string(),
    id: z.string(),
    like_count: z.number(),
    liked: z.boolean(),
    media_ids: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? []),
    organization_id: z.string(),
    organization_logo_url: z.string().nullable(),
    organization_name: z.string(),
    organization_slug: z.string(),
    tags: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? []),
    updated_at: z.string(),
  })
  .transform((value) => ({
    authorId: value["author_id"],
    body: value["body"],
    createdAt: value["created_at"],
    id: value["id"],
    likeCount: value["like_count"],
    liked: value["liked"],
    mediaIds: value["media_ids"],
    organizationId: value["organization_id"],
    organizationLogoUrl: value["organization_logo_url"],
    organizationName: value["organization_name"],
    organizationSlug: value["organization_slug"],
    tags: value["tags"],
    updatedAt: value["updated_at"],
  }));
export type PostResponse = z.output<typeof postResponseSchema>;

export const collectionResponsePostResponseSchema = z.object({
  items: z
    .array(postResponseSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponsePostResponse = z.output<
  typeof collectionResponsePostResponseSchema
>;

export const surrenderHistoryRecordSchema = z
  .object({
    action: z.string(),
    actor_id: z.string(),
    actor_name: z.string(),
    created_at: z.string(),
    notes: z.string(),
    snapshot: animalRequestSchema.optional(),
  })
  .transform((value) => ({
    action: value["action"],
    actorId: value["actor_id"],
    actorName: value["actor_name"],
    createdAt: value["created_at"],
    notes: value["notes"],
    snapshot: value["snapshot"],
  }));
export type SurrenderHistoryRecord = z.output<
  typeof surrenderHistoryRecordSchema
>;

export const surrenderResponseSchema = z
  .object({
    agreement_id: z.string().nullable(),
    animal: animalRequestSchema,
    animal_id: z.string().nullable(),
    application_id: z.string().nullable(),
    completed_at: z.string().nullable(),
    created_at: z.string(),
    delivered_at: z.string().nullable(),
    documents: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? []),
    history: z
      .array(surrenderHistoryRecordSchema)
      .nullish()
      .transform((value) => value ?? []),
    id: z.string(),
    kind: z.string(),
    organization_id: z.string(),
    organization_name: z.string(),
    reason: z.string(),
    received_at: z.string().nullable(),
    requester_id: z.string(),
    requester_name: z.string(),
    review_reason: z.string().nullable(),
    status: z.string(),
    updated_at: z.string(),
  })
  .transform((value) => ({
    agreementId: value["agreement_id"],
    animal: value["animal"],
    animalId: value["animal_id"],
    applicationId: value["application_id"],
    completedAt: value["completed_at"],
    createdAt: value["created_at"],
    deliveredAt: value["delivered_at"],
    documents: value["documents"],
    history: value["history"],
    id: value["id"],
    kind: value["kind"],
    organizationId: value["organization_id"],
    organizationName: value["organization_name"],
    reason: value["reason"],
    receivedAt: value["received_at"],
    requesterId: value["requester_id"],
    requesterName: value["requester_name"],
    reviewReason: value["review_reason"],
    status: value["status"],
    updatedAt: value["updated_at"],
  }));
export type SurrenderResponse = z.output<typeof surrenderResponseSchema>;

export const collectionResponseSurrenderResponseSchema = z.object({
  items: z
    .array(surrenderResponseSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseSurrenderResponse = z.output<
  typeof collectionResponseSurrenderResponseSchema
>;

export const verificationEvidenceSchema = z.object({
  documents: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  notes: z.string().optional(),
});
export type VerificationEvidence = z.output<typeof verificationEvidenceSchema>;

export const verificationRecordSchema = z
  .object({
    created_at: z.string(),
    evidence: verificationEvidenceSchema,
    id: z.string(),
    reason: z.string().nullable(),
    reviewed_at: z.string().nullable(),
    reviewed_by: z.string().nullable(),
    status: z.string(),
    submitted_by: z.string(),
  })
  .transform((value) => ({
    createdAt: value["created_at"],
    evidence: value["evidence"],
    id: value["id"],
    reason: value["reason"],
    reviewedAt: value["reviewed_at"],
    reviewedBy: value["reviewed_by"],
    status: value["status"],
    submittedBy: value["submitted_by"],
  }));
export type VerificationRecord = z.output<typeof verificationRecordSchema>;

export const verificationReviewItemSchema = z
  .object({
    organization_id: z.string().nullable(),
    profile: z.unknown(),
    user_id: z.string().nullable(),
    verification: verificationRecordSchema,
  })
  .transform((value) => ({
    organizationId: value["organization_id"],
    profile: value["profile"],
    userId: value["user_id"],
    verification: value["verification"],
  }));
export type VerificationReviewItem = z.output<
  typeof verificationReviewItemSchema
>;

export const collectionResponseVerificationReviewItemSchema = z.object({
  items: z
    .array(verificationReviewItemSchema)
    .nullish()
    .transform((value) => value ?? []),
  page: pageResponseSchema,
});
export type CollectionResponseVerificationReviewItem = z.output<
  typeof collectionResponseVerificationReviewItemSchema
>;

export const conversationReadStateSchema = z
  .object({
    conversation_id: z.string(),
    last_read_message_id: z.string().nullable(),
    unread_count: z.number(),
  })
  .transform((value) => ({
    conversationId: value["conversation_id"],
    lastReadMessageId: value["last_read_message_id"],
    unreadCount: value["unread_count"],
  }));
export type ConversationReadState = z.output<
  typeof conversationReadStateSchema
>;

export const countResponseSchema = z.object({ count: z.number() });
export type CountResponse = z.output<typeof countResponseSchema>;

export const createAgreementRequestSchema = z
  .object({ representative_id: z.string(), template_id: z.string() })
  .transform((value) => ({
    representativeId: value["representative_id"],
    templateId: value["template_id"],
  }));
export type CreateAgreementRequest = z.output<
  typeof createAgreementRequestSchema
>;

export const officialChannelsSchema = z.object({
  email: z.string(),
  phone: z.string().optional(),
  website: z.string().optional(),
});
export type OfficialChannels = z.output<typeof officialChannelsSchema>;

export const createOrganizationRequestSchema = z
  .object({
    description: z.string(),
    legal_name: z.string(),
    location: locationInputSchema,
    name: z.string(),
    official_channels: officialChannelsSchema,
    registration_number: z.string(),
  })
  .transform((value) => ({
    description: value["description"],
    legalName: value["legal_name"],
    location: value["location"],
    name: value["name"],
    officialChannels: value["official_channels"],
    registrationNumber: value["registration_number"],
  }));
export type CreateOrganizationRequest = z.output<
  typeof createOrganizationRequestSchema
>;

export const deleteAccountRequestSchema = z.object({ password: z.string() });
export type DeleteAccountRequest = z.output<typeof deleteAccountRequestSchema>;

export const donationDecisionSchema = z.object({
  reason: z.string(),
  status: z.enum(["confirmed", "not_found"]),
});
export type DonationDecision = z.output<typeof donationDecisionSchema>;

export const donationHistoryRecordSchema = z
  .object({ created_at: z.string(), reason: z.string(), status: z.string() })
  .transform((value) => ({
    createdAt: value["created_at"],
    reason: value["reason"],
    status: value["status"],
  }));
export type DonationHistoryRecord = z.output<
  typeof donationHistoryRecordSchema
>;

export const donationDetailSchema = z.object({
  donation: donationResponseSchema,
  history: z
    .array(donationHistoryRecordSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type DonationDetail = z.output<typeof donationDetailSchema>;

export const donationRequestSchema = z
  .object({
    amount_cents: z.number(),
    anonymous: z.boolean(),
    note: z.string().optional(),
    receipt_media_id: z.string().optional(),
    transferred_at: z.string(),
  })
  .transform((value) => ({
    amountCents: value["amount_cents"],
    anonymous: value["anonymous"],
    note: value["note"],
    receiptMediaId: value["receipt_media_id"],
    transferredAt: value["transferred_at"],
  }));
export type DonationRequest = z.output<typeof donationRequestSchema>;

export const donationTotalsSchema = z
  .object({
    confirmed_cents: z.number(),
    currency: z.string(),
    not_found_cents: z.number(),
    reported_cents: z.number(),
  })
  .transform((value) => ({
    confirmedCents: value["confirmed_cents"],
    currency: value["currency"],
    notFoundCents: value["not_found_cents"],
    reportedCents: value["reported_cents"],
  }));
export type DonationTotals = z.output<typeof donationTotalsSchema>;

export const followupCancellationRequestSchema = z.object({
  reason: z.string(),
});
export type FollowupCancellationRequest = z.output<
  typeof followupCancellationRequestSchema
>;

export const followupReportSchema = z
  .object({
    id: z.string(),
    media_ids: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? []),
    notes: z.string(),
    submitted_at: z.string(),
    submitted_by: z.string(),
    welfare_status: z.string(),
  })
  .transform((value) => ({
    id: value["id"],
    mediaIds: value["media_ids"],
    notes: value["notes"],
    submittedAt: value["submitted_at"],
    submittedBy: value["submitted_by"],
    welfareStatus: value["welfare_status"],
  }));
export type FollowupReport = z.output<typeof followupReportSchema>;

export const followupReviewSchema = z
  .object({
    decision: z.string(),
    reason: z.string(),
    reviewed_at: z.string(),
    reviewed_by: z.string(),
  })
  .transform((value) => ({
    decision: value["decision"],
    reason: value["reason"],
    reviewedAt: value["reviewed_at"],
    reviewedBy: value["reviewed_by"],
  }));
export type FollowupReview = z.output<typeof followupReviewSchema>;

export const followupResponseSchema = z
  .object({
    application_id: z.string(),
    cancellation_reason: z.string().nullable(),
    closed_at: z.string().nullable(),
    due_at: z.string(),
    id: z.string(),
    instructions: z.string(),
    reports: z
      .array(followupReportSchema)
      .nullish()
      .transform((value) => value ?? []),
    reviews: z
      .array(followupReviewSchema)
      .nullish()
      .transform((value) => value ?? []),
    status: z.enum([
      "scheduled",
      "submitted",
      "changes_requested",
      "closed",
      "cancelled",
    ]),
  })
  .transform((value) => ({
    applicationId: value["application_id"],
    cancellationReason: value["cancellation_reason"],
    closedAt: value["closed_at"],
    dueAt: value["due_at"],
    id: value["id"],
    instructions: value["instructions"],
    reports: value["reports"],
    reviews: value["reviews"],
    status: value["status"],
  }));
export type FollowupResponse = z.output<typeof followupResponseSchema>;

export const followupListSchema = z.object({
  items: z
    .array(followupResponseSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type FollowupList = z.output<typeof followupListSchema>;

export const followupReportRequestSchema = z
  .object({
    media_ids: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
    notes: z.string(),
    welfare_status: z.enum(["good", "needs_attention", "urgent"]),
  })
  .transform((value) => ({
    mediaIds: value["media_ids"],
    notes: value["notes"],
    welfareStatus: value["welfare_status"],
  }));
export type FollowupReportRequest = z.output<
  typeof followupReportRequestSchema
>;

export const followupReviewRequestSchema = z.object({
  decision: z.enum(["closed", "changes_requested"]),
  reason: z.string(),
});
export type FollowupReviewRequest = z.output<
  typeof followupReviewRequestSchema
>;

export const followupScheduleRequestSchema = z
  .object({ due_at: z.string(), instructions: z.string() })
  .transform((value) => ({
    dueAt: value["due_at"],
    instructions: value["instructions"],
  }));
export type FollowupScheduleRequest = z.output<
  typeof followupScheduleRequestSchema
>;

export const followupUpdateRequestSchema = z
  .object({
    due_at: z.string().optional(),
    instructions: z.string().optional(),
  })
  .transform((value) => ({
    dueAt: value["due_at"],
    instructions: value["instructions"],
  }));
export type FollowupUpdateRequest = z.output<
  typeof followupUpdateRequestSchema
>;

export const forgotPasswordRequestSchema = z.object({ email: z.string() });
export type ForgotPasswordRequest = z.output<
  typeof forgotPasswordRequestSchema
>;

export const healthResponseSchema = z.object({ status: z.enum(["ok"]) });
export type HealthResponse = z.output<typeof healthResponseSchema>;

export const imageModerationRequestSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
});
export type ImageModerationRequest = z.output<
  typeof imageModerationRequestSchema
>;

export const interestedPersonSchema = z
  .object({ name: z.string(), user_id: z.string() })
  .transform((value) => ({ name: value["name"], userId: value["user_id"] }));
export type InterestedPerson = z.output<typeof interestedPersonSchema>;

export const interestResponseSchema = z
  .object({
    applicants: z.number(),
    like_count: z.number(),
    page: pageResponseSchema,
    people: z
      .array(interestedPersonSchema)
      .nullish()
      .transform((value) => value ?? []),
  })
  .transform((value) => ({
    applicants: value["applicants"],
    likeCount: value["like_count"],
    page: value["page"],
    people: value["people"],
  }));
export type InterestResponse = z.output<typeof interestResponseSchema>;

export const issuedOTPResponseSchema = z
  .object({ code: z.string(), expires_at: z.string() })
  .transform((value) => ({
    code: value["code"],
    expiresAt: value["expires_at"],
  }));
export type IssuedOTPResponse = z.output<typeof issuedOTPResponseSchema>;

export const legalAcceptanceSchema = z
  .object({
    accepted_at: z.string(),
    document_id: z.string(),
    kind: z.string(),
    version: z.string(),
  })
  .transform((value) => ({
    acceptedAt: value["accepted_at"],
    documentId: value["document_id"],
    kind: value["kind"],
    version: value["version"],
  }));
export type LegalAcceptance = z.output<typeof legalAcceptanceSchema>;

export const legalAcceptanceListSchema = z.object({
  items: z
    .array(legalAcceptanceSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type LegalAcceptanceList = z.output<typeof legalAcceptanceListSchema>;

export const legalAcceptanceRequestSchema = z
  .object({ document_id: z.string() })
  .transform((value) => ({ documentId: value["document_id"] }));
export type LegalAcceptanceRequest = z.output<
  typeof legalAcceptanceRequestSchema
>;

export const legalDocumentSchema = z
  .object({
    content: z.string(),
    effective_at: z.string(),
    id: z.string(),
    kind: z.string(),
    placeholder: z.boolean(),
    published_at: z.string(),
    reviewed_by: z.string(),
    title: z.string(),
    version: z.string(),
  })
  .transform((value) => ({
    content: value["content"],
    effectiveAt: value["effective_at"],
    id: value["id"],
    kind: value["kind"],
    placeholder: value["placeholder"],
    publishedAt: value["published_at"],
    reviewedBy: value["reviewed_by"],
    title: value["title"],
    version: value["version"],
  }));
export type LegalDocument = z.output<typeof legalDocumentSchema>;

export const legalDocumentRequestSchema = z
  .object({
    content: z.string(),
    effective_at: z.string(),
    kind: z.enum(["terms", "privacy"]),
    placeholder: z.boolean().optional(),
    reviewed_by: z.string(),
    title: z.string(),
    version: z.string(),
  })
  .transform((value) => ({
    content: value["content"],
    effectiveAt: value["effective_at"],
    kind: value["kind"],
    placeholder: value["placeholder"],
    reviewedBy: value["reviewed_by"],
    title: value["title"],
    version: value["version"],
  }));
export type LegalDocumentRequest = z.output<typeof legalDocumentRequestSchema>;

export const legalVersionsSchema = z.object({
  items: z
    .array(legalDocumentSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type LegalVersions = z.output<typeof legalVersionsSchema>;

export const lifecycleReasonSchema = z.object({ reason: z.string() });
export type LifecycleReason = z.output<typeof lifecycleReasonSchema>;

export const listOrganizationMembersRowSchema = z
  .object({
    can_manage_applications: z.boolean(),
    can_manage_members: z.boolean(),
    can_publish_animals: z.boolean(),
    created_at: z.string().nullable(),
    deactivated_at: z.string().nullable(),
    display_name: z.string(),
    email: z.string(),
    id: z.string(),
    invited_by: z.string().nullable(),
    joined_at: z.string().nullable(),
    member_role: z.string(),
    organization_id: z.string().nullable(),
    status: z.string(),
    updated_at: z.string().nullable(),
    user_id: z.string().nullable(),
  })
  .transform((value) => ({
    canManageApplications: value["can_manage_applications"],
    canManageMembers: value["can_manage_members"],
    canPublishAnimals: value["can_publish_animals"],
    createdAt: value["created_at"],
    deactivatedAt: value["deactivated_at"],
    displayName: value["display_name"],
    email: value["email"],
    id: value["id"],
    invitedBy: value["invited_by"],
    joinedAt: value["joined_at"],
    memberRole: value["member_role"],
    organizationId: value["organization_id"],
    status: value["status"],
    updatedAt: value["updated_at"],
    userId: value["user_id"],
  }));
export type ListOrganizationMembersRow = z.output<
  typeof listOrganizationMembersRowSchema
>;

export const loginRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
});
export type LoginRequest = z.output<typeof loginRequestSchema>;

export const memberListResponseSchema = z.object({
  items: z
    .array(listOrganizationMembersRowSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type MemberListResponse = z.output<typeof memberListResponseSchema>;

export const membershipResponseRequestSchema = z.object({
  decision: z.enum(["accepted", "declined"]),
});
export type MembershipResponseRequest = z.output<
  typeof membershipResponseRequestSchema
>;

export const messageRequestSchema = z.object({ body: z.string() });
export type MessageRequest = z.output<typeof messageRequestSchema>;

export const messageResponseSchema = z.object({
  message: messageSchema,
  warning: z.string().optional(),
});
export type MessageResponse = z.output<typeof messageResponseSchema>;

export const metricDaySchema = z.object({
  applications: z.number(),
  date: z.string(),
  likes: z.number(),
});
export type MetricDay = z.output<typeof metricDaySchema>;

export const organizationAnalyticsSchema = z
  .object({
    animal_statuses: z.record(z.string(), z.unknown()),
    applications: z.number(),
    days: z
      .array(metricDaySchema)
      .nullish()
      .transform((value) => value ?? []),
    likes: z.number(),
  })
  .transform((value) => ({
    animalStatuses: value["animal_statuses"],
    applications: value["applications"],
    days: value["days"],
    likes: value["likes"],
  }));
export type OrganizationAnalytics = z.output<
  typeof organizationAnalyticsSchema
>;

export const organizationFollowersResponseSchema = z
  .object({ follower_count: z.number(), following: z.boolean() })
  .transform((value) => ({
    followerCount: value["follower_count"],
    following: value["following"],
  }));
export type OrganizationFollowersResponse = z.output<
  typeof organizationFollowersResponseSchema
>;

export const organizationMemberSchema = z
  .object({
    can_manage_applications: z.boolean(),
    can_manage_members: z.boolean(),
    can_publish_animals: z.boolean(),
    created_at: z.string().nullable(),
    deactivated_at: z.string().nullable(),
    id: z.string(),
    invited_by: z.string().nullable(),
    joined_at: z.string().nullable(),
    member_role: z.string(),
    organization_id: z.string().nullable(),
    status: z.string(),
    updated_at: z.string().nullable(),
    user_id: z.string().nullable(),
  })
  .transform((value) => ({
    canManageApplications: value["can_manage_applications"],
    canManageMembers: value["can_manage_members"],
    canPublishAnimals: value["can_publish_animals"],
    createdAt: value["created_at"],
    deactivatedAt: value["deactivated_at"],
    id: value["id"],
    invitedBy: value["invited_by"],
    joinedAt: value["joined_at"],
    memberRole: value["member_role"],
    organizationId: value["organization_id"],
    status: value["status"],
    updatedAt: value["updated_at"],
    userId: value["user_id"],
  }));
export type OrganizationMember = z.output<typeof organizationMemberSchema>;

export const organizationVerificationRequestSchema = z.object({
  decision: z.enum(["verified", "rejected", "suspended"]),
  reason: z.string(),
});
export type OrganizationVerificationRequest = z.output<
  typeof organizationVerificationRequestSchema
>;

export const paymentDetailsSchema = z
  .object({
    account_holder: z.string(),
    bank_account: z.string().optional(),
    bank_branch: z.string().optional(),
    bank_name: z.string().optional(),
    instructions: z.string(),
    method: z.enum(["pix", "bank_transfer"]),
    pix_key: z.string().optional(),
    published: z.boolean(),
  })
  .transform((value) => ({
    accountHolder: value["account_holder"],
    bankAccount: value["bank_account"],
    bankBranch: value["bank_branch"],
    bankName: value["bank_name"],
    instructions: value["instructions"],
    method: value["method"],
    pixKey: value["pix_key"],
    published: value["published"],
  }));
export type PaymentDetails = z.output<typeof paymentDetailsSchema>;

export const postRequestSchema = z
  .object({
    body: z.string(),
    media_ids: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
    tags: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
  })
  .transform((value) => ({
    body: value["body"],
    mediaIds: value["media_ids"],
    tags: value["tags"],
  }));
export type PostRequest = z.output<typeof postRequestSchema>;

export const preferenceRequestSchema = z.object({
  value: z.enum(["liked", "not_interested"]),
});
export type PreferenceRequest = z.output<typeof preferenceRequestSchema>;

export const readMessageRequestSchema = z
  .object({ message_id: z.string() })
  .transform((value) => ({ messageId: value["message_id"] }));
export type ReadMessageRequest = z.output<typeof readMessageRequestSchema>;

export const refreshRequestSchema = z
  .object({ refresh_token: z.string() })
  .transform((value) => ({ refreshToken: value["refresh_token"] }));
export type RefreshRequest = z.output<typeof refreshRequestSchema>;

export const registerRequestSchema = z
  .object({
    accepted_privacy_policy: z.literal(true),
    accepted_terms: z.literal(true),
    email: z.string(),
    name: z.string(),
    password: z.string(),
    privacy_document_id: z.string().optional(),
    terms_document_id: z.string().optional(),
  })
  .transform((value) => ({
    acceptedPrivacyPolicy: value["accepted_privacy_policy"],
    acceptedTerms: value["accepted_terms"],
    email: value["email"],
    name: value["name"],
    password: value["password"],
    privacyDocumentId: value["privacy_document_id"],
    termsDocumentId: value["terms_document_id"],
  }));
export type RegisterRequest = z.output<typeof registerRequestSchema>;

export const reportSchema = z
  .object({
    animal_id: z.string().nullable(),
    application_id: z.string().nullable(),
    assigned_to: z.string().nullable(),
    category: z.string(),
    conversation_id: z.string().nullable(),
    created_at: z.string().nullable(),
    description: z.string(),
    id: z.string(),
    message_id: z.string().nullable(),
    organization_id: z.string().nullable(),
    post_id: z.string().nullable(),
    priority: z.string(),
    reporter_id: z.string().nullable(),
    resolution: z.string().nullable(),
    resolved_at: z.string().nullable(),
    resolved_by: z.string().nullable(),
    status: z.string(),
    updated_at: z.string().nullable(),
  })
  .transform((value) => ({
    animalId: value["animal_id"],
    applicationId: value["application_id"],
    assignedTo: value["assigned_to"],
    category: value["category"],
    conversationId: value["conversation_id"],
    createdAt: value["created_at"],
    description: value["description"],
    id: value["id"],
    messageId: value["message_id"],
    organizationId: value["organization_id"],
    postId: value["post_id"],
    priority: value["priority"],
    reporterId: value["reporter_id"],
    resolution: value["resolution"],
    resolvedAt: value["resolved_at"],
    resolvedBy: value["resolved_by"],
    status: value["status"],
    updatedAt: value["updated_at"],
  }));
export type Report = z.output<typeof reportSchema>;

export const reportRequestSchema = z
  .object({
    category: z.enum([
      "payment_request",
      "fraud",
      "harassment",
      "inappropriate_content",
      "off_platform_contact",
      "animal_welfare",
      "other",
    ]),
    description: z.string(),
    subject_id: z.string(),
    subject_type: z.enum([
      "animal",
      "organization",
      "application",
      "conversation",
      "message",
      "post",
    ]),
  })
  .transform((value) => ({
    category: value["category"],
    description: value["description"],
    subjectId: value["subject_id"],
    subjectType: value["subject_type"],
  }));
export type ReportRequest = z.output<typeof reportRequestSchema>;

export const resetPasswordRequestSchema = z.object({
  password: z.string(),
  token: z.string(),
});
export type ResetPasswordRequest = z.output<typeof resetPasswordRequestSchema>;

export const screeningRequestSchema = z
  .object({
    accepts_follow_up: z.boolean().optional(),
    care_plan: z.string(),
    experience: z.string(),
    has_other_animals: z.boolean().optional(),
    household: z.string(),
    housing: z.string(),
  })
  .transform((value) => ({
    acceptsFollowUp: value["accepts_follow_up"],
    carePlan: value["care_plan"],
    experience: value["experience"],
    hasOtherAnimals: value["has_other_animals"],
    household: value["household"],
    housing: value["housing"],
  }));
export type ScreeningRequest = z.output<typeof screeningRequestSchema>;

export const signAgreementRequestSchema = z.object({
  accept: z.literal(true),
  code: z.string(),
  sha256: z.string(),
});
export type SignAgreementRequest = z.output<typeof signAgreementRequestSchema>;

export const startConversationRequestSchema = z
  .object({ user_id: z.string() })
  .transform((value) => ({ userId: value["user_id"] }));
export type StartConversationRequest = z.output<
  typeof startConversationRequestSchema
>;

export const surrenderDecisionSchema = z.object({
  decision: z.enum(["accepted", "rejected", "needs_information"]),
  reason: z.string(),
});
export type SurrenderDecision = z.output<typeof surrenderDecisionSchema>;

export const surrenderHandoverSchema = z.object({
  code: z.string().optional(),
  type: z.enum(["delivery", "receipt"]),
});
export type SurrenderHandover = z.output<typeof surrenderHandoverSchema>;

export const surrenderRequestSchema = z
  .object({
    animal: animalRequestSchema.optional(),
    animal_id: z.string().optional(),
    application_id: z.string().optional(),
    documents: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? [])
      .optional(),
    kind: z.enum(["intake", "return"]),
    organization_id: z.string(),
    reason: z.string(),
  })
  .transform((value) => ({
    animal: value["animal"],
    animalId: value["animal_id"],
    applicationId: value["application_id"],
    documents: value["documents"],
    kind: value["kind"],
    organizationId: value["organization_id"],
    reason: value["reason"],
  }));
export type SurrenderRequest = z.output<typeof surrenderRequestSchema>;

export const surrenderResubmissionSchema = z.object({
  animal: animalRequestSchema.optional(),
  documents: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? [])
    .optional(),
  reason: z.string(),
});
export type SurrenderResubmission = z.output<
  typeof surrenderResubmissionSchema
>;

export const templateListSchema = z.object({
  items: z
    .array(agreementTemplateSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type TemplateList = z.output<typeof templateListSchema>;

export const unreadConversationsSchema = z
  .object({
    items: z
      .array(conversationReadStateSchema)
      .nullish()
      .transform((value) => value ?? []),
    unread_count: z.number(),
  })
  .transform((value) => ({
    items: value["items"],
    unreadCount: value["unread_count"],
  }));
export type UnreadConversations = z.output<typeof unreadConversationsSchema>;

export const updateAnimalRequestSchema = z
  .object({
    approximate_birth_date: z.string().optional(),
    attributes: animalAttributesSchema.optional(),
    behavior_notes: z.string().optional(),
    breed: z.string().optional(),
    description: z.string().optional(),
    health_notes: z.string().optional(),
    location: locationInputSchema.optional(),
    name: z.string().optional(),
    sex: z.enum(["female", "male", "unknown"]).optional(),
    size: z.enum(["small", "medium", "large", "extra_large"]).optional(),
    species: z
      .enum([
        "dog",
        "cat",
        "bird",
        "rabbit",
        "reptile",
        "small_mammal",
        "other",
      ])
      .optional(),
  })
  .transform((value) => ({
    approximateBirthDate: value["approximate_birth_date"],
    attributes: value["attributes"],
    behaviorNotes: value["behavior_notes"],
    breed: value["breed"],
    description: value["description"],
    healthNotes: value["health_notes"],
    location: value["location"],
    name: value["name"],
    sex: value["sex"],
    size: value["size"],
    species: value["species"],
  }));
export type UpdateAnimalRequest = z.output<typeof updateAnimalRequestSchema>;

export const updateAppointmentRequestSchema = z
  .object({
    address: z.string().optional(),
    ends_at: z.string().optional(),
    instructions: z.string().optional(),
    location_name: z.string().optional(),
    reason: z.string().optional(),
    starts_at: z.string().optional(),
    status: z.enum(["scheduled", "cancelled"]).optional(),
    timezone: z.string().optional(),
  })
  .transform((value) => ({
    address: value["address"],
    endsAt: value["ends_at"],
    instructions: value["instructions"],
    locationName: value["location_name"],
    reason: value["reason"],
    startsAt: value["starts_at"],
    status: value["status"],
    timezone: value["timezone"],
  }));
export type UpdateAppointmentRequest = z.output<
  typeof updateAppointmentRequestSchema
>;

export const updateOfficialChannelsSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
});
export type UpdateOfficialChannels = z.output<
  typeof updateOfficialChannelsSchema
>;

export const updateOrganizationRequestSchema = z
  .object({
    description: z.string().optional(),
    location: locationInputSchema.optional(),
    name: z.string().optional(),
    official_channels: updateOfficialChannelsSchema.optional(),
    private_profile: organizationPrivateProfileSchema.optional(),
    profile: organizationPublicProfileSchema.optional(),
    slug: z.string().optional(),
  })
  .transform((value) => ({
    description: value["description"],
    location: value["location"],
    name: value["name"],
    officialChannels: value["official_channels"],
    privateProfile: value["private_profile"],
    profile: value["profile"],
    slug: value["slug"],
  }));
export type UpdateOrganizationRequest = z.output<
  typeof updateOrganizationRequestSchema
>;

export const updateProfileRequestSchema = z.object({
  location: locationInputSchema.optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  profile: personalProfileSchema.optional(),
});
export type UpdateProfileRequest = z.output<typeof updateProfileRequestSchema>;

export const updateReportRequestSchema = z.object({
  resolution: z.string().optional(),
  status: z.enum(["investigating", "resolved", "dismissed"]),
});
export type UpdateReportRequest = z.output<typeof updateReportRequestSchema>;

export const uploadRequestSchema = z
  .object({
    byte_size: z.number(),
    content_type: z.enum([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]),
    filename: z.string(),
    purpose: z.enum([
      "avatar",
      "animal",
      "post",
      "document",
      "followup",
      "surrender",
    ]),
  })
  .transform((value) => ({
    byteSize: value["byte_size"],
    contentType: value["content_type"],
    filename: value["filename"],
    purpose: value["purpose"],
  }));
export type UploadRequest = z.output<typeof uploadRequestSchema>;

export const uploadResponseSchema = z
  .object({
    expires_at: z.string(),
    id: z.string(),
    upload_url: z.string(),
    url: z.string(),
  })
  .transform((value) => ({
    expiresAt: value["expires_at"],
    id: value["id"],
    uploadUrl: value["upload_url"],
    url: value["url"],
  }));
export type UploadResponse = z.output<typeof uploadResponseSchema>;

export const verificationDecisionSchema = z.object({
  decision: z.enum(["under_review", "approved", "rejected"]),
  reason: z.string(),
});
export type VerificationDecision = z.output<typeof verificationDecisionSchema>;

export const verificationHistorySchema = z.object({
  items: z
    .array(verificationRecordSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type VerificationHistory = z.output<typeof verificationHistorySchema>;

export const verificationRequirementsSchema = z
  .object({
    maximum_documents: z.number(),
    required_documents: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? []),
  })
  .transform((value) => ({
    maximumDocuments: value["maximum_documents"],
    requiredDocuments: value["required_documents"],
  }));
export type VerificationRequirements = z.output<
  typeof verificationRequirementsSchema
>;

export const withdrawalRequestSchema = z.object({ reason: z.string() });
export type WithdrawalRequest = z.output<typeof withdrawalRequestSchema>;
