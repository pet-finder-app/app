# Known gaps

Every capability the Go API exposes has an interface, and the limitations
recorded in the previous review are fixed: collections return real totals,
responses carry the display names screens show, agreements can be recorded
after completion, follow-ups can be rescheduled and cancelled, notifications
link to their case and follow the conversation read cursor, and discovery
filters by species.

| Area       | Limitation                                                                                                                        | Possible follow-up                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Moderation | Reports are created from animals, posts and conversations, but only verification review has an admin screen. Deferred on purpose. | Add an admin report queue (`GET/PATCH /v1/reports`). |

## Adding a backend capability

1. Register new operations and request/response validation in the Go route
   registry; generate OpenAPI from the same definitions.
2. Enforce authentication, membership permissions, ownership, and workflow
   transitions in Go; persist changes in PostgreSQL transactions as needed.
3. Add isolated backend integration coverage, including access denial and state
   conflicts; do not seed frontend data or test against production accounts.
4. Regenerate frontend contracts with `pnpm api:generate`; add query/mutation
   keys, request/response validation, invalidation, and user-facing error states.
5. Update or remove the corresponding entry in this file.
