# Project guide

This guide applies to the entire repository. Keep it current when changing the
architecture or project conventions.

## Architecture

Petfinder uses Next.js App Router, React, TypeScript, Tailwind CSS v4, pnpm,
and React Compiler for its interface. The separate Go service in `../api` owns
PostgreSQL persistence, authentication, authorization, validation, and domain
workflows. Do not implement missing backend features in Next.js.

| Location                        | Responsibility                                                          |
| ------------------------------- | ----------------------------------------------------------------------- |
| `src/app`                       | Pages, layouts, metadata, styles, and composition                       |
| `src/app/api/backend/[...path]` | Allowlisted transport to existing Go routes                             |
| `src/app/api/session/[action]`  | JWT cookie management and selected organization context                 |
| `src/app/api/location`          | Browser location preference cookies                                     |
| `src/app/**/_components`        | Page-owned components                                                   |
| `src/components/backend`        | Reusable forms and workflows using the Go API                           |
| `src/components/ui`             | Shared controls and surfaces                                            |
| `src/lib/api`                   | React Query keys, queries, mutations, errors, and invalidation          |
| `src/lib/backend`               | Generated response schemas and route allowlist, transport, server reads |
| `public/auth`                   | Decorative authentication photographs, never animal records             |
| `tests`                         | Contract, cache, authentication, and interaction regression coverage    |
| `UNSUPPORTED.md`                | Backend gaps and proposed routes for a later issue                      |

### Rendering and data flow

- Pages and layouts are Server Components by default. Add `"use client"` only
  when state, effects, event handlers, or browser APIs require it.
- Server Components use `lib/backend/server.ts`; browser requests use React Query
  through `lib/api`. Keep requests and pending state in query/mutation hooks.
- `API_BASE_URL` is server-only and required. Copy `.env.example` for local setup.
  Never expose backend credentials or JWTs through public environment variables.
- Access and rotating refresh tokens stay in HttpOnly cookies. The Next proxy
  checks `/v1/me`, preserves login return URLs, and passes rotated cookies to
  server rendering. `SessionGuard` checks `/api/session/me` in the browser.
- Go remains authoritative for every permission and transition. A selected NGO
  cookie is only a navigation preference; validate membership against Go before
  using it. Never infer membership solely from a role or cookie.
- Regenerate `contracts.ts` and `routes.ts` with `pnpm api:generate` after updating
  the backend OpenAPI contract. Keep snake_case at the integration boundary and
  map to camelCase internally. Validate responses before putting them in caches.
- Mutations never retry automatically. Shared metadata invalidates related
  resources; account/context changes cancel requests and clear private caches.
- CI gates the app build on lint and tests. Main pushes publish the standalone
  Docker image to GHCR and deploy through `.github/actions/deploy` and
  `deploy/run.sh`. Server runtime settings live in `DEPLOY_PATH/.env`; SSH Actions
  settings use `HOST`, `USER`, `PORT`, `DEPLOY_PATH`, and `SSH_KEY`.
- Invalid appointment OTP responses use HTTP 401 but must not expire sessions.
- No JSON/JSONL stores, local accounts, seed records, mock API fallbacks, or local
  domain services are allowed. Tests may isolate transport fixtures from runtime.
- Unsupported features show an explicit Portuguese unavailable state. List gaps
  in `UNSUPPORTED.md`; do not create Next domain handlers or extend Go within a
  frontend-only migration.

### Routes and domain boundaries

- `(auth)` keeps the shared photographic background mounted across `/login`,
  `/register`, and `/forgot-password`. Preserve slideshow state and reduced motion.
- `/me` edits the actual Go user fields. Profile forms reuse `BottomSheet`, retain
  drafts in parent state, and save inside the sheet. Password resets, account
  deletion, and personal verification await backend routes.
- Backend accounts can be adopters and advertisers. NGO context is selected
  separately through `/ngo/organizations`; creation is `/ngo/register` and never
  implies verification. Go enforces publication and membership permissions.
- `/pets/[id]` uses Go animals and approved image URLs. Its carousel supports an
  opt-in full-screen viewer separate from Home's photo double-tap likes.
- Adoption applications, screening, decisions, messages, appointments, OTPs, and
  confirmations call existing Go routes. Do not invent workflow statuses or
  agreement/signature records. Existing appointment reads are a backend gap.
- Home filters, grid preview history, progressive batches, and scroll snapshots
  stay in `src/app/_components`. Shared presentation stays in `components/posts`.
  Preserve Next.js history fields and use its native History integration.
- Go preferences are mutually exclusive `liked` and `not_interested` values.
  Likes use idempotent PUT. There is no clear-preference endpoint; do not simulate
  toggles or provide a successful unhide/unlike action.
- Location cookies store approximate coordinates and an enabled preference.
  Disabled GPS must stay disabled. Discovery uses Go latitude/longitude filters;
  no local postal-code geocoding or ordering fallback is implemented.
- Messages poll the actual Go endpoint. Do not invent unread counts or message
  delivery receipts. Binary uploads, standalone posts, donations, follows,
  notifications, and surrender workflows remain unsupported as documented.

## Component ownership

- Before creating a component, check the existing page components and
  `src/components` for a suitable implementation. Reuse existing components
  first; extend their props or variants when appropriate. Create a new component
  only when the existing ones cannot reasonably meet the requirement.
- Put page-specific components in the owning page's `_components` directory and
  colocate their CSS modules there.
- Put generic or potentially reusable components in `src/components`, grouped
  into meaningful feature folders. For example, reusable NGO components belong
  in `src/components/ngo`; generic inputs belong in `src/components/ui`.
- Shared components must not import page-private components. A page must not
  import another page's `_components`. Promote a component to the appropriate
  shared feature folder when it becomes reusable.
- Keep pages focused on composition, data loading, and access checks. Keep
  business rules in domain modules and services.
- Follow the existing UI barrel in `src/components/ui/index.ts`; avoid adding
  broad barrels that mix client and server dependencies.

## Language and naming

- Write code, identifiers, comments, developer documentation, route segments,
  internal URLs, object keys, and stored enum values in English.
- Write user-facing content in Brazilian Portuguese, including labels, validation
  messages, errors, accessibility text, and agreement prose. Use `pt-BR` date and
  number formatting and BRL for currency where appropriate.
- Preserve external API field names at the integration boundary, then map them
  to English internal names. Do not translate protocol keys, user-authored data,
  or existing identifiers just to satisfy the language convention.
- Use `ngo`, `ngoId`, and `NgoProfile` in code; use `ONG` in Portuguese UI labels.
- Use kebab-case for files and directories, such as `ngo-profile-card.tsx`.
  Preserve Next.js special filenames and dynamic route syntax.
- Use PascalCase for React components, types, and interfaces; camelCase for
  functions, variables, and properties; and UPPER_SNAKE_CASE for module constants
  and label maps.
- Name component props types `ComponentNameProps`. Use `use` prefixes for hooks,
  `handle` prefixes for event handlers, `on` prefixes for callback props, and
  `is`, `has`, `can`, or `should` prefixes for boolean names when appropriate.
- Prefer named component exports; use default exports where Next.js requires
  them. Use `import type` for type-only dependencies.
- Use `@/` imports across features and layers; use local relative imports for
  closely related files in the same component directory.

## Type safety and coding conventions

- **NEVER use `any`, explicitly or implicitly. Resolve the value to a concrete
  type, or use `unknown` and narrow it before use.** This includes function
  parameters, return values, generic arguments, assertions, and containers such
  as arrays and records.
- Treat untrusted input as `unknown`: request bodies, external API responses,
  parsed JSON, and caught errors. Validate and narrow values with runtime checks
  or type guards before accessing fields or passing them into domain services.
- Do not bypass this rule with TypeScript/ESLint suppression comments, disabled
  strictness, or double assertions. An unchecked assertion is not validation.
- Reuse existing domain types. Use string literal unions and exhaustive handling
  for roles, statuses, and workflow actions; map internal values to Portuguese
  display labels instead of using display text as business logic.
- Keep TypeScript strict mode enabled. Prefer inference when it preserves a
  precise type; declare boundary, public function, and prop types clearly.
- Validate mutations on the server, return appropriate HTTP statuses, and show
  useful Portuguese errors in the interface. Do not silently swallow failures.
- Keep side effects explicit and clean up timers, event listeners, and effects.
  Respect React hook rules and avoid duplicating derived state.
- Follow existing Prettier, import organization, Tailwind ordering, and ESLint
  configuration. Keep changes scoped to the requested work.
- Keep stored records, API contracts, internal links, and agreement placeholders
  consistent when renaming fields or routes. Preserve signed agreement snapshots.

## Interface conventions

- Reuse the primitives documented in `src/components/ui/README.md` before adding
  custom controls. Add a suitable variant to an existing primitive when useful.
- Use semantic theme tokens from `src/app/globals.css`. The base palette is
  text/dark `#151316`, white `#ffffff`, primary/accent `#45fd66`, secondary
  `#effae7`, and light border `#c3c3c3`.
- Use `accent-tertiary` (`#249c42`) for selected navigation text, filled icons,
  and profile-photo outlines. Keep labels medium-weight without badge backgrounds.
- Use Nunito Sans for application text. The PETFINDER wordmark uses Montserrat:
  `PET` in Black weight and `FINDER` in light italic. Do not restore the former
  NATS-specific line-height overrides.
- Application content uses white backgrounds. Home feed posts have no card
  elevation or outer rounding; carousel dots are white at 50% opacity, with the
  active dot fully opaque. Adoption requests stay on the pet details page.
- Preserve the shared login/register photographic background, gradient, and
  wordmark behavior through shared auth components.
- Respect `prefers-reduced-motion` for slideshow scaling and interface animation.
  Do not restore the removed splash screen or flashing global loading indicator.
- Preserve semantic controls, associated labels, keyboard interaction, visible
  focus, readable contrast, and accessible names for icon-only buttons. Use the
  existing Lucide icon conventions.
- Build mobile-first layouts without horizontal overflow. For registration, keep
  the viewport fixed while the form sheet is open and scroll its content inside
  the sheet.

## Validation and references

Use pnpm and the existing lockfile. Available commands:

```sh
pnpm dev
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm format:check
pnpm build
```

Run checks appropriate to the change. For route, component ownership, or domain
refactors, check types, lint, relevant tests, and the production build. For UI
changes, also verify mobile layout and affected interactions. Documentation-only
changes need formatting and factual review, not a full application build.

Consult `README.md` for project context, `src/components/README.md` for component
placement, `src/components/ui/README.md` for UI conventions, and
`docs/adoption-workflow-plan.md` for adoption workflow context. Distinguish planned
behavior in design documents from behavior implemented in the source.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
