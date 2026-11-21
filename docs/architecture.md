# Architecture

Next.js App Router, React 19 with the React Compiler, TanStack Query, Zod,
Tailwind CSS v4 and pnpm. Code, routes and identifiers are in English; everything
users read is in Brazilian Portuguese.

## Folders

| Location                        | Responsibility                                                    |
| ------------------------------- | ----------------------------------------------------------------- |
| `src/app`                       | Pages, layouts and metadata                                       |
| `src/app/api/backend/[...path]` | Allowlisted transport to the Go API                               |
| `src/app/api/session/[action]`  | Login, registration, password recovery and session cookies        |
| `src/app/api/location`          | Approximate location preference cookies                           |
| `src/app/**/_components`        | Components owned by one page                                      |
| `src/components/*`              | Shared components, grouped by feature (`ui`, `backend`, `ngo`, …) |
| `src/lib/api`                   | Query keys, queries, mutations, pagination and the chat socket    |
| `src/lib/backend`               | Generated contract, proxy allowlist, transport and server reads   |
| `tests`                         | Transport, cache and per-feature regression tests                 |

See [component placement](../src/components/README.md) and
[the UI system](../src/components/ui/README.md) before adding components.

## Rendering

Pages and layouts are Server Components. A component becomes a Client Component
(`"use client"`) only when it needs state, effects, event handlers or browser
APIs. Server pages load the session and the caller's permissions; client
components read and write through React Query.

## Permissions in the interface

Go authorizes every request. Pages only hide what Go would refuse, using the
caller's active membership (`getCurrentMembership()`): settings, verification,
donations and team management for `can_manage_members`; animals and posts for
`can_publish_animals`; adoptions, agreements, follow-ups and surrenders for
`can_manage_applications`. The selected NGO cookie is a navigation preference,
always re-checked against Go. Administrators (`platform_admin`) review
verification evidence at `/admin/verifications`. The full rules are in the API's
[authorization guide](../../api/docs/authorization.md).

## Where features live

| Area                          | Pages                                                                    |
| ----------------------------- | ------------------------------------------------------------------------ |
| Discovery and animals         | `/`, `/pets/[id]`, `/adopter/favorites`, `/adopter/animals`, `/ngo/pets` |
| Profile and verification      | `/me`, `/ngo/settings`, `/admin/verifications`                           |
| Adoptions                     | `/adopter/adoptions`, `/ngo/adoptions`, `/adoptions/[id]/…`              |
| Conversations                 | `/adopter/conversations`, `/ngo/messages`, `/ngo/conversations/[id]`     |
| Posts, follows, notifications | `/feed`, `/organizations/[id]`, `/ngo/posts`, `*/notifications`          |
| Donations                     | `/adopter/donate`, `/ngo/donations`                                      |
| Surrender and return          | `/adopter/surrenders`, `/ngo/surrenders`, `/surrenders/[id]/agreement`   |
| NGO administration            | `/ngo/dashboard`, `/ngo/team`, `/ngo/organizations`, `/ngo/register`     |
