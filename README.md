# Petfinder App

The Petfinder interface uses Next.js, React, React Query, Tailwind CSS, and pnpm.
The Go service in `../api` owns authentication, domain routes, and PostgreSQL data.
Code and routes use English; product text uses Brazilian Portuguese.

## Development

Use Node.js 24 and pnpm. Start the Go service using its README, then:

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Set the server-only `API_BASE_URL` to the Go service URL. Open
`http://localhost:3000`. There is no runtime mock fallback or local JSON storage.
Auth slideshow images in `public/auth` are decorative artwork.

## API integration

Browser reads and writes use `src/lib/api` query options and mutations. Responses
are validated against generated Zod schemas. Next.js retains three thin handlers:
an allowlisted Go transport, HttpOnly JWT/session cookies, and location preference
cookies. Go validates permissions and workflow transitions. Refresh tokens rotate;
tokens are never returned to browser JavaScript.

After regenerating OpenAPI in the sibling backend, run:

```sh
pnpm api:generate
```

This updates `src/lib/backend/contracts.ts` and `routes.ts` from
`../api/build/openapi.yaml`. Do not hand-edit generated files.

Supported workflows include profiles, organizations and members, published animal
discovery, preferences, adoption applications and screening, conversations, and
appointment creation/confirmation. Available fields and operations follow Go's
current contract. [UNSUPPORTED.md](UNSUPPORTED.md) lists missing routes and UI
limitations for a follow-up backend issue. These features display an unavailable
state; they do not write prototype records.

## Validation

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm format:check
pnpm build
```

Tests isolate transport fixtures and never mutate configured backend data.
See [component placement](src/components/README.md),
[the UI system](src/components/ui/README.md), and
[the adoption design plan](docs/adoption-workflow-plan.md). Design documents may
include planned behavior that the current backend does not implement.
