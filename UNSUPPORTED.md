# Backend coverage gaps

This file is an issue backlog for the frontend integration with `../api`.
The source of truth is `../api/internal/api/routes.go` and the OpenAPI generated
from it. Database tables alone do not imply an available HTTP endpoint.

The frontend now uses the existing Go routes. It does not provide local JSON
persistence, pretend-success endpoints, sample records, or substitute workflow
engines for missing backend functionality. Unsupported public pages display an
unavailable message; unsupported actions are not offered as working controls.

## Routes still needed

The operations below describe missing capabilities. Proposed `/v1/...` paths are
suggestions for a future backend issue, not routes currently called by the app.

| Capability                              | Existing frontend route / former Next operation                                                                 | Backend work needed                                                                                                                                                                                                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password recovery                       | `/forgot-password`, `/reset-password`; former `/api/auth/forgot-password`, `/api/auth/reset-password`           | Request and consume reset tokens; deliver links through a real email channel. No reset link is generated in Next.                                                                                                                                                                                                      |
| Account deletion                        | Former `DELETE /api/account`                                                                                    | Authenticated account deletion/deactivation with retention rules and session revocation.                                                                                                                                                                                                                               |
| Full personal profile                   | Former `PUT /api/adopter/profile`                                                                               | Extend `PATCH /v1/me` and `GET /v1/me` for CPF, birth date, occupation, biography, social links, postal/street address, housing, preferences, documents, avatar, and profile verification. Current UI saves only name, phone, and city/state/country.                                                                  |
| Personal verification                   | Former personal verification checklist and review submission                                                    | Submit and read verification status, required documents, review progress, and decisions. No local checklist pretends to verify backend accounts.                                                                                                                                                                       |
| Extended organization profile           | Former `PUT /api/ngo/profile`                                                                                   | Organization type, chosen nickname/slug, logo/gallery, representative identity/contact verification, documents, shelter capacity, service areas, adoption policy, payment details, and granular profile-consent fields. Existing name, description, channels, location, and server verification status are integrated. |
| Organization verification submission    | Former review-submission profile action                                                                         | The backend supports initial organization registration and **admin** verification decisions. Add submission/resubmission of verification evidence and the corresponding member-facing status/history. Registration never verifies an organization locally.                                                             |
| Owner organization reassignment         | Private animal submissions                                                                                      | Assign/reassign a responsible organization after creation. Current advertiser inventory uses `GET /v1/me/animals`; `POST /v1/animals` submission to an organization is integrated.                                                                                                                                     |
| Animal archival / deletion              | Former `DELETE /api/ngo/pets/{id}` and archive patch                                                            | Add archive/delete semantics with ownership, active-application checks, history, and retention rules. Existing lifecycle-status changes use `PATCH /v1/animals/{id}/status`.                                                                                                                                           |
| Additional animal attributes            | Former pet form fields                                                                                          | Species such as `bird`, size in centimeters, structured temperament and health fields where absent from write contracts. The frontend does not send fields unsupported by the request schemas.                                                                                                                         |
| Binary media uploads                    | Former multipart post upload and inline profile/pet media                                                       | Add authenticated upload initiation/storage and validated file limits. Existing `POST /v1/animals/{id}/images` accepts an HTTP(S) URL only; no multipart upload is emulated in Next.                                                                                                                                   |
| Standalone posts                        | `/ngo/posts/new`, `/ngo/posts/{id}`, `/ngo/posts/{id}/edit`; former `/api/ngo/posts...`, `/api/posts/{id}/like` | Create/list/read/edit/delete posts, ordered media and tags, standalone-post likes, permissions, and report subjects. Existing animal discovery is not treated as a posts API.                                                                                                                                          |
| Following organizations                 | Former `/api/ngos/{id}/follow`                                                                                  | Follow/unfollow, paginated followed organizations, follower counts, and following feed.                                                                                                                                                                                                                                |
| Donations                               | `/adopter/donate`, `/adopter/donate/{ngoId}`, `/ngo/donations`; former `/api/donations...`                      | Organization payment details, reported direct transfers, donor/NGO views, confirmation/not-found actions, totals, and privacy rules. No payment receipt or donation is recorded locally.                                                                                                                               |
| Notifications and unread counts         | `/adopter/notifications`, `/ngo/notifications`; former `/api/alerts`, `/api/ngo/notifications`                  | Notification collection, unread counts, mark-read actions, and profile/avatar projections if desired. Navigation does not invent badge counts.                                                                                                                                                                         |
| Conversation read state                 | Chat and conversation list                                                                                      | Mark/read state and unread counters. `GET /v1/conversations/{id}/messages` is a message listing, not a read receipt.                                                                                                                                                                                                   |
| Organization-initiated chat             | Former `/api/ngo/pets/{id}/conversation`                                                                        | Start a mediated conversation from an interested person's identity, with proper consent/access checks. Currently `POST /v1/applications` creates the adopter conversation.                                                                                                                                             |
| Likes / interest analytics for NGOs     | Former pet-interest list and dashboard charts                                                                   | Authorized per-animal likes, interested-person projections, time-series aggregates, and totals. Current interest lists use real applications only.                                                                                                                                                                     |
| Administrative application cancellation | Former workflow cancellation actions                                                                            | Authorized administrative cancellation with history. Adopter withdrawal before approval uses `POST /v1/applications/{id}/withdrawal`; the backend records history and closes the conversation. Existing decisions accept `approved`, `rejected`, or `needs_information`.                                               |
| Adoption agreements and signing         | `/adoptions/{id}/agreement`, `/ngo/settings/agreement`; former `/api/ngo/agreement`, signing actions            | Versioned templates, immutable populated agreements, signatures/evidence, signing-code delivery, and authorized printable projections. No agreement or signing code is generated by Next.                                                                                                                              |
| Post-adoption follow-ups                | Former `/api/adoptions/{id}/follow-up`                                                                          | Schedule/list/submit follow-up reports and media, notifications, and closure rules. An appointment with purpose `follow_up` is not a follow-up-report API.                                                                                                                                                             |
| Surrender / return workflow             | `/adopter/surrenders/...`, `/ngo/surrenders/...`, `/surrenders/{id}/agreement`; former `/api/surrenders...`     | Intake/return request fields, participants, review/resubmission, agreements, signing, handover, related animal transitions, and histories. A private animal submission is offered separately and is not presented as the former surrender workflow.                                                                    |
| Published legal documents               | `/terms` and signup links                                                                                       | Final reviewed terms/privacy content and version policy. The frontend displays an unavailable state; the old placeholder prose has been deleted.                                                                                                                                                                       |

## Existing backend capabilities used

- `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/refresh`, `/v1/auth/logout`:
  the Go API owns credentials, access/refresh tokens, rotation, and revocation.
- `/v1/me`: current profile and supported profile updates.
- `/v1/organizations...` and `/v1/me/organizations`: public discovery, registration,
  supported updates, membership management, and access-checked selection of active
  memberships, including pending organizations. Invitations display without
  granting administration access.
- `/v1/animals...`: discovery, details, submission/editing, lifecycle statuses,
  URL-based images, image removal, and authorized image approval/rejection.
  `/v1/me/animals` and `/v1/organizations/{id}/animals` provide paginated private
  inventories; the organization inventory supports status filters.
- `/v1/preferences` and `/v1/animals/{id}/preference`: real liked/dismissed state,
  idempotent likes, and DELETE to unlike or restore discovery visibility.
- `/v1/applications...`: application creation/list/detail, screening, decisions,
  adopter withdrawal, and accessible conversation references after reload.
- `/v1/conversations...`: paginated conversation lists, message polling, and
  older message pages using the exclusive `before` cursor.
- `/v1/applications/{id}/appointments`, `/v1/appointments...`: appointment lists,
  details and confirmation history after reload, scheduling/cancellation, OTP,
  and delivery/receipt confirmations. OTP rejections do not log the user out.
- `/v1/reports`: content reports use actual backend subjects and categories.

The Go API also supports administration/moderation operations and a chat
WebSocket. This app has not added a new admin console. Chat currently uses the
existing REST message endpoint with polling; a WebSocket deployment must route
upgrades to the Go service, not through a Next route handler.

## Next handlers retained

- `/api/backend/[...path]`: an allowlisted authenticated HTTP transport. It
  forwards the Go request/response and never performs domain persistence or
  transitions. Browser requests retain HTTP-only JWT cookies; raw tokens are
  not returned to client JavaScript.
- `/api/session/[action]`: login/register forwarding, refresh/logout, safe
  current-user projection, and an access-checked organization cookie. This
  handler does not create users, verify passwords, or invent account roles.
- `/api/location`: approximate browser coordinates and a display-preference
  cookie. Discovery coordinates are sent to `/v1/animals` as query parameters.

## Acceptance criteria for follow-up backend work

1. Register new operations and request/response validation in the Go route
   registry; generate OpenAPI from the same definitions.
2. Enforce authentication, membership permissions, ownership, and workflow
   transitions in Go; persist changes in PostgreSQL transactions as needed.
3. Add isolated backend integration coverage, including access denial and state
   conflicts; do not seed frontend data or test against production accounts.
4. Regenerate frontend contracts with `pnpm api:generate`; add query/mutation
   keys, request/response validation, invalidation, and user-facing error states.
5. Replace the relevant unavailable UI only when the real backend route works;
   remove the corresponding entry from this issue backlog.
