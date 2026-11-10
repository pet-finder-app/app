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

## Deployment

GitHub Actions runs lint (including formatting) and tests in parallel, then builds
the app after both pass. Pushes to `main` then build an AMD64/ARM64 Docker image,
publish it to `ghcr.io/<owner>/<repository>` with `main` and `sha-<commit>` tags,
and deploy the image by digest over SSH using the `production` environment.
Pull requests and other branches run validation and the app build only.

Configure these Actions settings in the repository or `production` environment:

| Name          | Kind               | Purpose                                    |
| ------------- | ------------------ | ------------------------------------------ |
| `HOST`        | Secret or variable | Server hostname or IPv4 address             |
| `USER`        | Secret or variable | SSH user with Docker access                |
| `PORT`        | Variable or secret | SSH port; defaults to `22`                  |
| `DEPLOY_PATH` | Variable or secret | Absolute app deployment directory          |
| `SSH_KEY`     | Secret             | SSH private key for the deployment user    |

The workflow uses `GITHUB_TOKEN` to publish to GHCR. On the server, install Docker
with Compose v2 and log in to `ghcr.io` as the deployment user with a token that
can read the package if it is private. Create a dedicated directory such as
`/opt/petfinder-app` (separate from the API deployment) and its `.env` file:

```dotenv
API_BASE_URL=https://api.example.com
APP_BIND_ADDRESS=127.0.0.1
APP_PORT=3000
```

`API_BASE_URL` must be reachable from inside the app container. `localhost` refers
to the app container itself; use the backend's reachable URL. The URL is supplied
at runtime and is never baked into the image. Keep the `.env` file on the server;
it is excluded from Docker builds and deployment uploads.

Point your HTTPS reverse proxy at `127.0.0.1:3000`. Production authentication uses
Secure cookies and requires HTTPS in the browser. Each deployment uploads Compose
and the runner to `DEPLOY_PATH/releases/<commit>`, pulls the published image, and
waits for the app health check before writing `DEPLOY_PATH/current-image`.
The app uses its own stable Compose project, `petfinder-app-production`.

See [component placement](src/components/README.md),
[the UI system](src/components/ui/README.md), and
[the adoption design plan](docs/adoption-workflow-plan.md). Design documents may
include planned behavior that the current backend does not implement.
