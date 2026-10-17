# Project guide

This guide applies to the entire repository. Keep it current when changing the
architecture or project conventions.

## Architecture

Petfinder is a full-stack Next.js App Router application using React, TypeScript,
Tailwind CSS v4, and pnpm. The Next.js application serves both the interface and
the HTTP API; there is no separate backend service. React Compiler is enabled.

| Location                     | Responsibility                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `src/app`                    | Routes, page composition, layouts, global styles, and application metadata         |
| `src/app/api/**/route.ts`    | HTTP handlers for authentication, authorization, validation, and domain operations |
| `src/app/**/_components`     | Components and styles owned by a specific page                                     |
| `src/components/<feature>`   | Reusable components grouped by domain or capability                                |
| `src/components/ui`          | Shared controls, surfaces, layout primitives, and styling helpers                  |
| `src/lib`                    | Domain types, validation, services, persistence, and supporting utilities          |
| `src/data/*.json`, `*.jsonl` | Local prototype data persisted by server-side services                             |
| `public`                     | Public branding, pet photographs, and uploaded media                               |
| `tests`                      | Node test-runner tests, including English route and data migration coverage        |
| `docs`                       | Supporting project and workflow documentation                                      |

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
- Login, registration, and forgot-password pages live in the `(auth)` route group.
  Its shared layout keeps the pet slideshow mounted during navigation. Preserve
  that layout boundary so changing auth routes does not reset the slide or timer.
  Route groups do not add segments to public URLs.
- `/adopter/*` serves personal accounts; `/ngo/*` serves organization accounts.
  They are separate account roles with different profiles and permissions.
- Personal profile categories open their forms in the shared `BottomSheet`, also
  used by home post options. Keep drafts in the parent profile state and save
  actions inside the sheet; checklist links open the corresponding category.
  Verification progress appears beneath the profile header, outside the settings
  list. It counts required checklist items and links the next missing item to its
  settings category. Completing the checklist enables review
  submission; it does not change verification status automatically. Logout and
  account deletion are direct actions in the personal profile list, each opening
  a confirmation modal before making a request. Terms and privacy are linked in
  the profile footer. Terms acceptance is collected at signup and preserved in
  stored records; the verification checklist covers profile data without asking
  for acceptance again.
- `/me` is the signed-in account's profile and renders either the personal form
  or the NGO profile according to the server-side session. It is implemented in
  `src/app/me`. Do not add compatibility redirects for the removed profile URLs.
- `/pets/[id]` displays a pet. Its shared media carousel enables an opt-in
  full-screen photo viewer with pinch zoom, panning, and keyboard controls.
  Keep this opt-in separate from Home photo double-tap likes. Adoption and
  surrender agreements have dedicated printable pages under `/adoptions/[id]/agreement` and
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
- Home feed filters, navigation, and progressive batches live in
  `src/app/_components`. Home and Favorites share post presentation and options
  in `components/posts`. Favorites includes nonarchived liked pets even when
  unavailable or hidden from Home. Shared NGO identity and media carousels live
  in `components/ngo` and `components/posts`. Sticky tag filters choose the default scroll feed or a
  photo-only grid, toggle GPS, and optionally reveal hidden pets. Hiding a pet
  also hides posts tagged with that pet unless the visibility filter is enabled.
- Selecting a grid animal opens its post in a temporary scroll view. Browser
  Back and the temporary back arrow restore the grid snapshot, including its
  loaded batch and scroll position, while keeping the latest hidden-pet and
  location choices. `feed-query.ts` parses and serializes the `view`, `hidden`,
  `location`, and optional `post` URL parameters. A preview retains `view=grid`
  and adds `post`; shared preview URLs also create a grid return entry.
  Validate custom history state and preserve Next.js fields when writing history.
  URL-changing writes must use Next's native History integration so subsequent
  server refreshes read the current filter URL.
- Browser location starts enabled, requests permission, and turns off when
  permission is denied. `/api/location` stores approximate coordinates and an
  explicit enabled/disabled cookie; honor a saved disabled preference. Turning
  GPS off falls back to the profile postal code for distance ordering.
- Content reports are appended to `src/data/reports.jsonl` through `/api/reports`.
  This stores reports for later review; there is no moderation dashboard or
  automatic delivery. Standalone post likes use `post-likes.json`; tagged posts
  keep the existing pet-like workflow and NGO notifications.
- Pet and standalone-post like endpoints accept `POST` to toggle and `PUT` to
  ensure a like exists. Photo double-taps use `PUT` so repeating the gesture
  cannot remove a like or duplicate a notification.

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
