# Petfinder App

The Petfinder Next.js interface uses React Query and the Go API in `../api`.
Account, animal, preference, organization, application, and conversation data
come from the API. There are no local prototype stores or demo accounts.

## Development

Requires Node.js 24 and pnpm.

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Start the API using its README. Set the server-only `API_BASE_URL` to its origin
(for example, `http://localhost:8080`). The browser uses the Next.js proxy, so it
needs no direct API connection or CORS configuration. Set
`NEXT_PUBLIC_TERMS_URL` and `NEXT_PUBLIC_PRIVACY_URL` to the published documents.

## Contract and authentication

Generate the committed TypeScript contract from `../api/build/openapi.yaml`:

```sh
pnpm api:generate
```

`openapi-fetch` provides typed requests; React Query handles caching, pagination,
loading, errors, and invalidation after mutations. Conversations poll every 15
seconds and messages every 5 seconds while visible. Mutations have no automatic
retry; authentication failures can share a session refresh and replay once.
Invalid delivery OTPs are never replayed.

Tokens stay in HTTP-only, SameSite=Lax cookies, with Secure enabled in production.
`/api/session/*` handles registration, login, refresh, and logout without exposing
tokens to JavaScript. `/api/backend/*` forwards the `/v1/*` contract with bearer
authentication. Login/logout clear personal caches. The selected organization ID
is a local interface preference; the API enforces membership and permissions.

## Routes and components

Routes follow the updated branch's English names: `/login`, `/register`,
`/forgot-password`, `/reset-password`, `/adopter/*`, `/ngo/*`, `/ngos/*`, and `/me`.
The `(auth)` route group preserves the shared photographic slideshow across
login and registration. Its bundled photographs are decorative assets, not
animal records. The root layout retains Nunito Sans, Montserrat, the application
icon, and the current UI styling, and wraps content with `QueryProvider`.

API screens live in `src/components/api`; shared controls remain in
`src/components/ui`. Reusable photo-viewer/carousel components and their gesture
tests are preserved. Server-side proxy helpers live in `src/lib/api/server.ts`.

## Available flows

- Registration with both consent flags and the API's password requirements;
  login, session refresh, and logout.
- Animal discovery with filters and browser coordinates, details, galleries,
  favorites, and dismissed animals.
- Animal creation/editing, moderated public image URLs, image removal, and
  availability changes with reasons. Individuals can submit private animals.
- Applications after liking an animal, introductions, screening, organization
  decisions, history, conversations, and messages with moderation warnings.
- Organization creation/editing, verification status, member management, and
  personal profiles.
- Appointment creation, updates, cancellation, organization-issued delivery
  codes, and delivery/receipt confirmations.
- Reports about animals, organizations, applications, and conversations.

## Current API limitations

Features without endpoints show unavailable states: posts/videos, donations,
following organizations, notifications/read receipts, account deletion, password
recovery, signed agreements/templates, post-adoption reports, and complete
surrender/return workflows. Private animal submission only covers the initial
animal registration step of the old surrender form.

The contract also does not expose:

- The user's organizations: select the ID received during registration or
  shared by the team. The public directory only lists verified organizations.
- A complete organization animal list: the NGO animal page filters the current
  discovery page by organization. Open unavailable/pending animals by ID;
  partial discovery results are never presented as organization totals.
- Appointment listing/detail: retain the returned appointment ID and share it
  in the conversation to update it, issue a code, or confirm delivery.
- Gallery images in animal lists: cards query the detail gallery separately,
  sharing its React Query cache and respecting API moderation permissions.
- Message history pagination: the chat shows the 100 latest messages.
- Preference removal: the available values are `liked` and `not_interested`.

## Validation

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Tests cover session refresh concurrency, replayed request bodies, refresh errors,
cancellation, API validation errors, empty responses, OTP retry protection,
server session and proxy handlers, secure cookie handling, cross-origin request
rejection, logout token rotation and recovery, malformed login JSON, client-safe
profile models, and photo-viewer gestures. Server-route tests exercise the actual
handlers and NextResponse; only the Next request context and upstream HTTP calls
are substituted. Full integration checks require the Go API and PostgreSQL
running with real test accounts.
