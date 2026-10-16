# Project guide

This guide applies to the entire repository. Keep it current when changing the
architecture or project conventions.

## Architecture

Petfinder is a full-stack Next.js App Router application using React, TypeScript,
Tailwind CSS v4, and pnpm. The Next.js application serves both the interface and
the HTTP API; there is no separate backend service. React Compiler is enabled.

| Location                   | Responsibility                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `src/app`                  | Routes, page composition, layouts, global styles, and application metadata         |
| `src/app/api/**/route.ts`  | HTTP handlers for authentication, authorization, validation, and domain operations |
| `src/app/**/_components`   | Components and styles owned by a specific page                                     |
| `src/components/<feature>` | Reusable components grouped by domain or capability                                |
| `src/components/ui`        | Shared controls, surfaces, layout primitives, and styling helpers                  |
| `src/lib`                  | Domain types, validation, services, persistence, and supporting utilities          |
| `src/data/*.json`          | Local prototype data persisted by server-side services                             |
| `public`                   | Public branding, pet photographs, and uploaded media                               |
| `tests`                    | Node test-runner tests, including English route and data migration coverage        |
| `docs`                     | Supporting project and workflow documentation                                      |

### Rendering and data flow

- Pages and layouts are Server Components by default. Add `"use client"` only
  when a component needs state, effects, event handlers, or browser APIs.
- Server-rendered pages read sessions and domain data through `src/lib` services.
  Client interactions call internal `/api/...` endpoints.
- Route handlers check the session, role, resource ownership, and request data
  before invoking domain services. Do not rely on hidden buttons for authorization.
- Model modules such as `pet.ts`, `adoption.ts`, and `surrender.ts` provide domain
  types, labels, validation, and client projections. Service modules such as
  `pets.ts`, `adoptions.ts`, and `surrenders.ts` handle persistence and transitions.
- Keep Node filesystem access and server-only operations out of client imports.
  Client-safe models must not import persistence services.
- JSON files are the current storage mechanism, not a production database.
  Authentication and delivery of reset/signing codes also have prototype
  limitations; do not describe them as production authentication or delivery.

### Routes and domain boundaries

- Authentication pages include `/login`, `/register`, `/forgot-password`, and
  `/reset-password`.
- `/adopter/*` serves personal accounts; `/ngo/*` serves organization accounts.
  They are separate account roles with different profiles and permissions.
- `/pets/[id]` displays a pet. Adoption and surrender agreements have dedicated
  printable pages under `/adoptions/[id]/agreement` and
  `/surrenders/[id]/agreement`.
- Adoption and surrender services own workflow transitions, participant checks,
  event histories, signing, handover, and related conversation updates. Invoke
  their actions instead of assigning workflow statuses directly in components.
- Preserve NGO verification and ownership checks for publishing and workflow
  actions. Registration does not automatically verify an organization.
- Use client projections when returning workflow data. Do not expose passwords,
  pending signing codes, or another participant's private data.
- Donations track direct Pix payments to an NGO and subsequent NGO confirmation;
  the application does not process payments itself.

## Component ownership

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
- Use Nunito Sans for application text. The PETFINDER wordmark uses Montserrat:
  `PET` in Black weight and `FINDER` in light italic. Do not restore the former
  NATS-specific line-height overrides.
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
