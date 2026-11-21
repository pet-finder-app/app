// Generated from the Go backend OpenAPI contract. Run pnpm api:generate.
export const BACKEND_ROUTES = [
  {
    method: "GET",
    path: "/v1/agreements/{agreementId}",
  },
  {
    method: "GET",
    path: "/v1/agreements/{agreementId}/print",
  },
  {
    method: "POST",
    path: "/v1/agreements/{agreementId}/signatures",
  },
  {
    method: "POST",
    path: "/v1/agreements/{agreementId}/signing-code",
  },
  {
    method: "GET",
    path: "/v1/animals",
  },
  {
    method: "POST",
    path: "/v1/animals",
  },
  {
    method: "DELETE",
    path: "/v1/animals/{animalId}",
  },
  {
    method: "GET",
    path: "/v1/animals/{animalId}",
  },
  {
    method: "PATCH",
    path: "/v1/animals/{animalId}",
  },
  {
    method: "POST",
    path: "/v1/animals/{animalId}/archive",
  },
  {
    method: "POST",
    path: "/v1/animals/{animalId}/conversations",
  },
  {
    method: "GET",
    path: "/v1/animals/{animalId}/history",
  },
  {
    method: "POST",
    path: "/v1/animals/{animalId}/images",
  },
  {
    method: "DELETE",
    path: "/v1/animals/{animalId}/images/{imageId}",
  },
  {
    method: "POST",
    path: "/v1/animals/{animalId}/images/{imageId}/moderation",
  },
  {
    method: "GET",
    path: "/v1/animals/{animalId}/interest",
  },
  {
    method: "PUT",
    path: "/v1/animals/{animalId}/organization",
  },
  {
    method: "DELETE",
    path: "/v1/animals/{animalId}/preference",
  },
  {
    method: "PUT",
    path: "/v1/animals/{animalId}/preference",
  },
  {
    method: "PATCH",
    path: "/v1/animals/{animalId}/status",
  },
  {
    method: "GET",
    path: "/v1/applications",
  },
  {
    method: "POST",
    path: "/v1/applications",
  },
  {
    method: "GET",
    path: "/v1/applications/{applicationId}",
  },
  {
    method: "GET",
    path: "/v1/applications/{applicationId}/agreement",
  },
  {
    method: "POST",
    path: "/v1/applications/{applicationId}/agreement",
  },
  {
    method: "GET",
    path: "/v1/applications/{applicationId}/appointments",
  },
  {
    method: "POST",
    path: "/v1/applications/{applicationId}/appointments",
  },
  {
    method: "POST",
    path: "/v1/applications/{applicationId}/cancellation",
  },
  {
    method: "POST",
    path: "/v1/applications/{applicationId}/decision",
  },
  {
    method: "GET",
    path: "/v1/applications/{applicationId}/follow-ups",
  },
  {
    method: "POST",
    path: "/v1/applications/{applicationId}/follow-ups",
  },
  {
    method: "PUT",
    path: "/v1/applications/{applicationId}/screening",
  },
  {
    method: "POST",
    path: "/v1/applications/{applicationId}/withdrawal",
  },
  {
    method: "GET",
    path: "/v1/appointments/{appointmentId}",
  },
  {
    method: "PATCH",
    path: "/v1/appointments/{appointmentId}",
  },
  {
    method: "POST",
    path: "/v1/appointments/{appointmentId}/confirmations",
  },
  {
    method: "POST",
    path: "/v1/appointments/{appointmentId}/otp",
  },
  {
    method: "GET",
    path: "/v1/conversations",
  },
  {
    method: "GET",
    path: "/v1/conversations/unread",
  },
  {
    method: "GET",
    path: "/v1/conversations/{conversationId}/messages",
  },
  {
    method: "POST",
    path: "/v1/conversations/{conversationId}/messages",
  },
  {
    method: "GET",
    path: "/v1/conversations/{conversationId}/read-state",
  },
  {
    method: "PUT",
    path: "/v1/conversations/{conversationId}/read-state",
  },
  {
    method: "POST",
    path: "/v1/conversations/{conversationId}/ws-ticket",
  },
  {
    method: "GET",
    path: "/v1/donations",
  },
  {
    method: "GET",
    path: "/v1/donations/{donationId}",
  },
  {
    method: "POST",
    path: "/v1/donations/{donationId}/decision",
  },
  {
    method: "GET",
    path: "/v1/feed",
  },
  {
    method: "GET",
    path: "/v1/follow-ups/{followupId}",
  },
  {
    method: "PATCH",
    path: "/v1/follow-ups/{followupId}",
  },
  {
    method: "POST",
    path: "/v1/follow-ups/{followupId}/cancellation",
  },
  {
    method: "POST",
    path: "/v1/follow-ups/{followupId}/reports",
  },
  {
    method: "POST",
    path: "/v1/follow-ups/{followupId}/review",
  },
  {
    method: "POST",
    path: "/v1/legal/documents",
  },
  {
    method: "GET",
    path: "/v1/legal/documents/{documentId}",
  },
  {
    method: "GET",
    path: "/v1/legal/privacy",
  },
  {
    method: "GET",
    path: "/v1/legal/privacy/versions",
  },
  {
    method: "GET",
    path: "/v1/legal/terms",
  },
  {
    method: "GET",
    path: "/v1/legal/terms/versions",
  },
  {
    method: "DELETE",
    path: "/v1/me",
  },
  {
    method: "GET",
    path: "/v1/me",
  },
  {
    method: "PATCH",
    path: "/v1/me",
  },
  {
    method: "GET",
    path: "/v1/me/animals",
  },
  {
    method: "GET",
    path: "/v1/me/following",
  },
  {
    method: "GET",
    path: "/v1/me/legal-acceptances",
  },
  {
    method: "POST",
    path: "/v1/me/legal-acceptances",
  },
  {
    method: "GET",
    path: "/v1/me/organizations",
  },
  {
    method: "PUT",
    path: "/v1/me/organizations/{organizationId}/membership",
  },
  {
    method: "GET",
    path: "/v1/me/verification",
  },
  {
    method: "POST",
    path: "/v1/me/verification",
  },
  {
    method: "GET",
    path: "/v1/me/verification/requirements",
  },
  {
    method: "POST",
    path: "/v1/media",
  },
  {
    method: "GET",
    path: "/v1/media/{mediaId}",
  },
  {
    method: "PUT",
    path: "/v1/media/{mediaId}/content",
  },
  {
    method: "GET",
    path: "/v1/notifications",
  },
  {
    method: "PUT",
    path: "/v1/notifications/read",
  },
  {
    method: "GET",
    path: "/v1/notifications/unread",
  },
  {
    method: "PUT",
    path: "/v1/notifications/{notificationId}/read",
  },
  {
    method: "GET",
    path: "/v1/organizations",
  },
  {
    method: "POST",
    path: "/v1/organizations",
  },
  {
    method: "GET",
    path: "/v1/organizations/{organizationId}",
  },
  {
    method: "PATCH",
    path: "/v1/organizations/{organizationId}",
  },
  {
    method: "GET",
    path: "/v1/organizations/{organizationId}/agreement-templates",
  },
  {
    method: "POST",
    path: "/v1/organizations/{organizationId}/agreement-templates",
  },
  {
    method: "GET",
    path: "/v1/organizations/{organizationId}/analytics",
  },
  {
    method: "GET",
    path: "/v1/organizations/{organizationId}/animals",
  },
  {
    method: "GET",
    path: "/v1/organizations/{organizationId}/donation-totals",
  },
  {
    method: "POST",
    path: "/v1/organizations/{organizationId}/donations",
  },
  {
    method: "DELETE",
    path: "/v1/organizations/{organizationId}/follow",
  },
  {
    method: "PUT",
    path: "/v1/organizations/{organizationId}/follow",
  },
  {
    method: "GET",
    path: "/v1/organizations/{organizationId}/followers",
  },
  {
    method: "GET",
    path: "/v1/organizations/{organizationId}/members",
  },
  {
    method: "POST",
    path: "/v1/organizations/{organizationId}/members",
  },
  {
    method: "DELETE",
    path: "/v1/organizations/{organizationId}/members/{userId}",
  },
  {
    method: "GET",
    path: "/v1/organizations/{organizationId}/payment-details",
  },
  {
    method: "PUT",
    path: "/v1/organizations/{organizationId}/payment-details",
  },
  {
    method: "POST",
    path: "/v1/organizations/{organizationId}/posts",
  },
  {
    method: "POST",
    path: "/v1/organizations/{organizationId}/verification",
  },
  {
    method: "GET",
    path: "/v1/organizations/{organizationId}/verification-requirements",
  },
  {
    method: "GET",
    path: "/v1/organizations/{organizationId}/verification-submissions",
  },
  {
    method: "POST",
    path: "/v1/organizations/{organizationId}/verification-submissions",
  },
  {
    method: "GET",
    path: "/v1/posts",
  },
  {
    method: "DELETE",
    path: "/v1/posts/{postId}",
  },
  {
    method: "GET",
    path: "/v1/posts/{postId}",
  },
  {
    method: "PUT",
    path: "/v1/posts/{postId}",
  },
  {
    method: "DELETE",
    path: "/v1/posts/{postId}/like",
  },
  {
    method: "PUT",
    path: "/v1/posts/{postId}/like",
  },
  {
    method: "GET",
    path: "/v1/preferences",
  },
  {
    method: "GET",
    path: "/v1/reports",
  },
  {
    method: "POST",
    path: "/v1/reports",
  },
  {
    method: "GET",
    path: "/v1/reports/{reportId}",
  },
  {
    method: "PATCH",
    path: "/v1/reports/{reportId}",
  },
  {
    method: "GET",
    path: "/v1/surrenders",
  },
  {
    method: "POST",
    path: "/v1/surrenders",
  },
  {
    method: "GET",
    path: "/v1/surrenders/{surrenderId}",
  },
  {
    method: "PUT",
    path: "/v1/surrenders/{surrenderId}",
  },
  {
    method: "GET",
    path: "/v1/surrenders/{surrenderId}/agreement",
  },
  {
    method: "POST",
    path: "/v1/surrenders/{surrenderId}/agreement",
  },
  {
    method: "POST",
    path: "/v1/surrenders/{surrenderId}/cancellation",
  },
  {
    method: "POST",
    path: "/v1/surrenders/{surrenderId}/decision",
  },
  {
    method: "POST",
    path: "/v1/surrenders/{surrenderId}/handover",
  },
  {
    method: "POST",
    path: "/v1/surrenders/{surrenderId}/handover-code",
  },
  {
    method: "GET",
    path: "/v1/verifications",
  },
  {
    method: "GET",
    path: "/v1/verifications/{verificationId}",
  },
  {
    method: "POST",
    path: "/v1/verifications/{verificationId}/decision",
  },
] as const;
