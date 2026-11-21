# API integration

The Go service in `../api` owns authentication, validation, permissions,
workflow transitions and PostgreSQL data. This app never stores domain data or
falls back to mocks.

## Generated contract

After regenerating OpenAPI in the API (`make docs-generate`), run:

```sh
pnpm api:generate
```

This rewrites `src/lib/backend/contracts.ts` (a Zod schema for every Go type,
mapped from snake_case to camelCase) and `src/lib/backend/routes.ts` (the proxy
allowlist) from `../api/build/openapi.yaml`. Never edit them by hand. Responses
are validated against these schemas before they reach the React Query cache.

## Requests

- **Browser:** React Query options and mutations in `src/lib/api` call
  `/api/backend/v1/...`. Each feature has its own module (`account`, `animals`,
  `community`, `donations`, `workflows`); shared reads live in `queries.ts` and
  `mutations.ts`. Mutations never retry and declare which caches they invalidate.
- **Server Components:** `src/lib/backend/server.ts` (`getCurrentUser`,
  `getCurrentOrganization`, `getCurrentMembership`, `serverRequest`).
- **Pagination:** Go returns `page.total` across all pages; use
  `src/lib/api/pagination.ts` instead of guessing from page length.
- **Media:** upload with `uploadMedia(file, purpose)` (initiate, then send the
  bytes) and display any Go media URL through `mediaHref(url)`, which goes
  through the authenticated proxy. Files are cached by the browser for a day.

## Sessions

Access and rotating refresh tokens live only in HttpOnly cookies; JavaScript
never sees them. The Next `proxy.ts` checks `/v1/me`, refreshes expired access
tokens and passes rotated cookies to server rendering. Requests without a
session are forwarded anonymously, so Go decides which routes are public.

## Real-time chat

Next route handlers cannot proxy WebSocket upgrades, so the browser connects to
Go directly. The proxy first exchanges the cookie session for a one-minute,
conversation-scoped ticket (`POST /v1/conversations/{id}/ws-ticket`); the
browser offers it as a `ticket.<ticket>` subprotocol to the URL Go returns
(built from Go's `PUBLIC_API_URL`). `useChatSocket` reconnects with a new ticket
on close code 4001; while the socket is down, history polls and sends fall back
to REST. Deployments must expose the API's `/v1/conversations/{id}/ws` with
upgrade support.

## Next handlers

- `/api/backend/[...path]`: an allowlisted authenticated HTTP transport. It
  forwards the Go request/response and never performs domain persistence or
  transitions. Browser requests retain HTTP-only JWT cookies; raw tokens are
  not returned to client JavaScript.
- `/api/session/[action]`: login/register and password-recovery forwarding, refresh/logout, safe
  current-user projection, and an access-checked organization cookie. This
  handler does not create users, verify passwords, or invent account roles.
- `/api/location`: approximate browser coordinates and a display-preference
  cookie. Discovery coordinates are sent to `/v1/animals` as query parameters.

## Capabilities in use

- `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/refresh`, `/v1/auth/logout`:
  the Go API owns credentials, access/refresh tokens, rotation, and revocation.
- `/v1/me`: current profile and supported profile updates.
- `/v1/organizations...` and `/v1/me/organizations`: public discovery, registration,
  supported updates, membership management, and access-checked selection of active
  memberships, including pending organizations. Invitations grant nothing until
  accepted or declined with `PUT /v1/me/organizations/{id}/membership`.
- `/v1/me/verification`, `/v1/organizations/{id}/verification-submissions`,
  their requirement routes and `/v1/verifications...`: personal and organization
  evidence, history, and the administrator review queue at `/admin/verifications`.
  Documents upload privately through `POST /v1/media` and
  `PUT /v1/media/{id}/content` (the proxy allows 10 MiB for that route only).
- `/v1/auth/forgot-password` and `/v1/auth/reset-password` through
  `/api/session/...`; `503` from Go (no SMTP configured) is shown as unavailable.
- `/v1/legal/terms` and `/v1/legal/privacy`: rendered on `/terms`, marking
  placeholder versions.
- `/v1/animals...`: discovery, details, submission/editing, lifecycle statuses,
  URL-based images, image removal, and authorized image approval/rejection.
  `/v1/me/animals` and `/v1/organizations/{id}/animals` provide paginated private
  inventories; the organization inventory supports status filters.
- `/v1/preferences` and `/v1/animals/{id}/preference`: real liked/dismissed state,
  idempotent likes, and DELETE to unlike or restore discovery visibility.
- `/v1/applications...`: application creation/list/detail (filters: `status`,
  and `animal_id` for organizations), screening, decisions, adopter withdrawal,
  and accessible conversation references after reload.
- Collections return `page.total` across all pages; use `src/lib/api/pagination.ts`.
- `/v1/conversations...`: paginated conversation lists, real-time messages over
  the Go WebSocket with `ws-ticket`, and older message pages using the exclusive
  `before` cursor. Polling/REST sending is only the reconnect fallback.
- `/v1/applications/{id}/appointments`, `/v1/appointments...`: appointment lists,
  details and confirmation history after reload, scheduling/cancellation, OTP,
  and delivery/receipt confirmations. OTP rejections do not log the user out.
- `/v1/reports`: animal and post reports use actual backend subjects and categories.
- Account deletion and full personal/organization profiles (`DELETE|PATCH /v1/me`,
  `PATCH /v1/organizations/{id}`) with avatar, logo, gallery and document uploads.
- Animal archive/delete, history, extended species/attributes, organization
  reassignment, binary photo uploads, interest lists, organization-started
  conversations and organization analytics.
- Posts, post likes, follows, the following feed, notifications, unread counts
  and conversation read cursors.
- Direct-transfer donations: payment details, donor reports with receipts,
  organization decisions and totals.
- Agreement templates and signing, post-adoption follow-ups, surrender/return
  cases with handover codes, and administrative application cancellation.

Browsers connect the chat WebSocket straight to Go at the URL returned in the
ticket (built from Go's `PUBLIC_API_URL`), so deployments must expose the API's
`/v1/conversations/{id}/ws` publicly with upgrade support.
