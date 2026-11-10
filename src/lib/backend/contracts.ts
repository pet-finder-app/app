// Generated from the Go backend OpenAPI contract. Run pnpm api:generate.
import { z } from "zod";

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

export const userResponseSchema = z
  .object({
    created_at: z.string().nullable(),
    email: z.string(),
    id: z.string(),
    location: locationResponseSchema,
    name: z.string(),
    phone: z.string().nullable(),
    roles: z
      .array(z.string())
      .nullish()
      .transform((value) => value ?? []),
    updated_at: z.string().nullable(),
  })
  .transform((value) => ({
    createdAt: value["created_at"],
    email: value["email"],
    id: value["id"],
    location: value["location"],
    name: value["name"],
    phone: value["phone"],
    roles: value["roles"],
    updatedAt: value["updated_at"],
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

export const officialChannelsResponseSchema = z.object({
  email: z.string(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
});
export type OfficialChannelsResponse = z.output<
  typeof officialChannelsResponseSchema
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
    registration_number: z.string().optional(),
    updated_at: z.string().nullable(),
    verification_notes: z.string().optional(),
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
    registrationNumber: value["registration_number"],
    updatedAt: value["updated_at"],
    verificationNotes: value["verification_notes"],
    verificationStatus: value["verification_status"],
    verifiedAt: value["verified_at"],
  }));
export type OrganizationResponse = z.output<typeof organizationResponseSchema>;

export const pageResponseSchema = z
  .object({ page: z.number(), page_size: z.number(), total: z.number() })
  .transform((value) => ({
    page: value["page"],
    pageSize: value["page_size"],
    total: value["total"],
  }));
export type PageResponse = z.output<typeof pageResponseSchema>;

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

export const animalSchema = z
  .object({
    adopted_at: z.string().nullable(),
    approximate_age_months: z.number().nullable(),
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

export const listAvailableAnimalsRowSchema = z
  .object({
    adopted_at: z.string().nullable(),
    approximate_age_months: z.number().nullable(),
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

export const listPreferredAnimalsRowSchema = z
  .object({
    adopted_at: z.string().nullable(),
    approximate_age_months: z.number().nullable(),
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

export const listOrganizationApplicationsRowSchema = z
  .object({
    adopter_id: z.string().nullable(),
    adopter_name: z.string(),
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

export const getAdoptionApplicationByIDRowSchema = z
  .object({
    adopter_email: z.string(),
    adopter_id: z.string().nullable(),
    adopter_name: z.string(),
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
    answers: z.string(),
    application_id: z.string().nullable(),
    created_at: z.string().nullable(),
    id: z.string(),
    outcome: z.string().nullable(),
    private_notes: z.string().nullable(),
    questions: z.string(),
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
  history: z
    .array(applicationStatusHistorySchema)
    .nullish()
    .transform((value) => value ?? []),
  screening: applicationScreeningSchema.optional(),
});
export type ApplicationDetailResponse = z.output<
  typeof applicationDetailResponseSchema
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

export const messageResponseSchema = z.object({
  message: messageSchema,
  warning: z.string().optional(),
});
export type MessageResponse = z.output<typeof messageResponseSchema>;

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

export const issuedOTPResponseSchema = z
  .object({ code: z.string(), expires_at: z.string() })
  .transform((value) => ({
    code: value["code"],
    expiresAt: value["expires_at"],
  }));
export type IssuedOTPResponse = z.output<typeof issuedOTPResponseSchema>;

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
    priority: value["priority"],
    reporterId: value["reporter_id"],
    resolution: value["resolution"],
    resolvedAt: value["resolved_at"],
    resolvedBy: value["resolved_by"],
    status: value["status"],
    updatedAt: value["updated_at"],
  }));
export type Report = z.output<typeof reportSchema>;

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

export const memberListResponseSchema = z.object({
  items: z
    .array(listOrganizationMembersRowSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type MemberListResponse = z.output<typeof memberListResponseSchema>;

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
