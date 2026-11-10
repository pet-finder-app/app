// Generated from the Go backend OpenAPI contract. Run pnpm api:generate.
export const BACKEND_ROUTES = [
  {
    method: "GET",
    path: "/v1/animals",
  },
  {
    method: "POST",
    path: "/v1/animals",
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
    path: "/v1/animals/{animalId}/images",
  },
  {
    method: "DELETE",
    path: "/v1/animals/{animalId}/images/{imageId}",
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
    method: "POST",
    path: "/v1/applications/{applicationId}/appointments",
  },
  {
    method: "POST",
    path: "/v1/applications/{applicationId}/decision",
  },
  {
    method: "PUT",
    path: "/v1/applications/{applicationId}/screening",
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
    path: "/v1/conversations/{conversationId}/messages",
  },
  {
    method: "POST",
    path: "/v1/conversations/{conversationId}/messages",
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
    method: "POST",
    path: "/v1/organizations/{organizationId}/verification",
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
] as const;
