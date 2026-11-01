# Project guide

This guide applies to the entire repository. Keep it current when changing the
architecture or project conventions.

## Architecture

Petfinder uses Next.js App Router, React, TypeScript, Tailwind CSS v4, pnpm,
and React Compiler. The Go API in `../api` owns authentication and domain data.
Next.js serves the interface and a same-origin API proxy; it does not persist
prototype records locally.

| Location                   | Responsibility                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `src/app`                  | English routes, page composition, layouts, styles, and metadata                     |
| `src/app/api/backend`      | Authenticated proxy to the Go API's `/v1/*` contract                                |
| `src/app/api/session`      | Login, registration, refresh, and logout with HTTP-only cookies                     |
| `src/components/api`       | Shared React Query screens for API-backed features                                  |
| `src/components/<feature>` | Shared domain components, authentication layout, branding, and media controls       |
| `src/components/ui`        | Shared controls, surfaces, layout primitives, and styling helpers                   |
| `src/lib/api`              | Generated OpenAPI types, typed HTTP client, query keys, hooks, and server transport |
| `src/lib`                  | Client-safe models, validation, and supporting utilities                            |
| `public`                   | Branding and decorative authentication photography                                  |
| `tests`                    | Node test-runner coverage for API transport, profile models, and photo gestures     |
| `docs`                     | Project documentation and historical workflow plans                                 |

### Rendering and data flow

- Pages and layouts are Server Components by default; interactive screens use
  React Query through the root `QueryProvider`.
- Generate `src/lib/api/schema.d.ts` with `pnpm api:generate` from
  `../api/build/openapi.yaml`. Commit generated types so builds do not require
  the API checkout. Do not edit generated types manually.
- Use `openapi-fetch` through `src/lib/api/client.ts` and query hooks in
  `queries.ts`. Invalidate affected query keys after successful mutations.
- Tokens stay in HTTP-only cookies. Never expose them in browser responses,
  localStorage, logs, or component props. Clear personal caches on login/logout.
- The Go API enforces authentication, membership, permissions, and resource
  ownership. The local organization ID is an interface preference, not proof
  of authorization.
- A session failure can trigger one shared refresh and replay. Invalid OTPs
  must not trigger refresh or replay. Other mutations have no automatic retry.
- Do not reintroduce JSON/JSONL stores, demo users, mock responses, or local
  workflow services. Client-safe model helpers are not persistence services.

### Routes and domain boundaries

- Preserve English routes: `/login`, `/register`, `/forgot-password`,
  `/reset-password`, `/adopter/*`, `/ngo/*`, `/ngos/*`, and `/me`.
- Login, registration, and forgot-password pages stay in the `(auth)` route
  group. Its shared layout keeps the decorative pet slideshow mounted during
  navigation. Preserve the photographic auth layout and reduced-motion support.
- `/me` displays the account profile; `/ngo/settings` manages organizations
  and members. Do not add compatibility redirects for removed profile URLs.
- Animals support discovery, preferences, details, URL-based galleries,
  edits, and availability changes. Publishing requires a verified organization.
- Applications require a liked animal and an introduction, then support
  screening, decisions, chat, and appointments. The organization issues the
  delivery OTP; the adopter uses it to confirm receipt.
- Respect the gaps in the current contract, documented in `README.md`:
  posts, donations, follows, read receipts, password recovery, account deletion,
  signed agreements, and complete surrender workflows have no endpoints.
  Their existing routes show unavailable states instead of simulated success.
- Organization animal lists contain only the selected organization's animals
  on the current discovery page. Never present these partial results as totals.
- Preserve reusable photo viewer/carousel controls and their gesture coverage.
  Authentication photography is decorative and does not represent API records.

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
placement, and `src/components/ui/README.md` for UI conventions. Distinguish
planned behavior in design documents from behavior implemented in the source.
