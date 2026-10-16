# UI system

Shared Petfinder components. Check here before creating a component. Add a
`variant` or `tone` to an existing component when a new presentation is needed.

```tsx
import { Button, Input, Card } from "@/components/ui";
```

Code and comments use English; visible product text stays in Brazilian Portuguese.

## Visual style

Use soft, diffuse elevation, rounded corners, white surfaces, and pastel fills.
Most surfaces do not need a border; fields and list items may use a thin border.
Avoid thick borders and `backdrop-blur`.

- Reuse `shadowSoft.sm | md | lg | xl` and the matching `pressSoft` size from
  `elevation.ts` rather than choosing new shadows or press effects.
- Badges and chips do not need shadows. Button elevation follows size; cards use
  the large elevation by default.
- Use round pills, badges, and avatars; rounded fields, buttons, and cards.
- Authentication uses the user's photo-based design, including its smaller field
  corner radius and green registration panel.

```tsx
import { Button, shadowSoft } from "@/components/ui";
import { cn } from "@/components/ui";

<div className={cn("rounded-3xl bg-white p-4", shadowSoft.lg)}>...</div>;
```

## Brand tokens

Tokens are defined in `src/app/globals.css`. Use semantic tokens rather than
repeating hex values in page components.

| Token | Value | Purpose |
| --- | --- | --- |
| `text`, `bg-black` | `#151316` | Dark text and backgrounds |
| `text-light`, `bg-white` | `#ffffff` | Light text and white surfaces |
| `primary`, `accent` | `#45fd66` | Primary actions, active states, checkmarks |
| `secondary`, `primary-soft` | `#effae7` | Soft green surfaces |
| `border-light`, `line` | `#c3c3c3` | Borders and separators |
| `primary-hover` | Darkened primary | Primary hover state |
| `primary-faint` | `#f0fdf4` | Subtle surface hover |
| `accent-yellow` | `#fdecc8` | Supporting pastel emphasis |
| `accent-peach` | `#fde1d3` | Supporting notices and errors |

Other existing status colors remain available for charts and semantic feedback:
red, yellow, pink, blue, purple, gray, and neutral. Use dark green or red text where
bright variants would not provide sufficient contrast on light surfaces.

## Typography

Use Nunito Sans throughout the application. Reserve Montserrat for the PETFINDER
wordmark: PET uses Black (900), while FINDER. uses Light Italic (300). Do not restore
NATS-specific line-height overrides.

## Field tones

Fields, checkboxes, and links support these tones:

- `primary`: green authentication surfaces with dark labels.
- `light`: white and neutral application surfaces; the default.
- `brutal`: thin dark borders without soft elevation.
- `photo`: dark photographic surfaces, with white labels and white controls.

Checkboxes retain their native checked state, keyboard behavior, and label
association. The custom visual is a white box with a primary-green checkmark.

## Components

| Component | Purpose |
| --- | --- |
| `Button` | Primary, secondary, outline, pill, danger, dark, photo, and photo-back variants; sm/md/lg sizes and loading states. |
| `LinkButton` | The same visual treatment for navigation. |
| `TextLink` | Inline link with a visible focus indicator. |
| `Input`, `Select`, `Textarea` | Controls with accessible labels, hints, and errors. Always supply id and label. |
| `Checkbox` | White checkbox with a primary-green tick and an associated label that may contain links. |
| `FileInput` | File selection and metadata. |
| `PhotoInput` | Multiple photo selection with previews and individual removal. |
| `MediaInput` | Multiple photos/videos with previews; retain actual Files for multipart uploads. |
| `FormError` | Always-mounted form alert; fields reference its id through errorId. |
| `Card`, `CardTitle`, `CardDescription` | Shared content surfaces. Card tone controls the background. |
| `Badge` | Neutral, informational, success, warning, and danger status labels. |
| `Progress` | Progress indicator without built-in text. |
| `Field`, `useFieldA11y`, `cn` | Shared field structure, accessibility, and class composition. |

## Form example

```tsx
const ERROR_ID = "login-error";

<form className="flex flex-col gap-4">
  <Input
    id="email"
    label="E-mail"
    type="email"
    tone="primary"
    invalid={errorField === "email"}
    errorId={ERROR_ID}
  />
  <FormError id={ERROR_ID}>{error}</FormError>
  <Button
    type="submit"
    size="lg"
    loading={isSubmitting}
    variant="dark"
    loadingLabel="ENTRANDO..."
  >
    ENTRAR
  </Button>
</form>;
```

## Page shells and authentication

Application pages use `PageShell` for centered content and mobile gutters.
Headers belong inside the same content bounds. Forms with fixed actions use
`ActionBar`, aligned with the page width and device safe area.

Login and registration share `PhotoAuthLayout`: the pet slideshow, dark gradient,
wordmark, and initial logo position. The logo moves upward when registration opens.
The rounded green panel slides over disabled role cards; only the panel scrolls.
Back navigation or clicking outside closes it with a prompt-starting ease-out
animation. Reduced-motion preferences disable movement. Legacy password-recovery
pages use `AuthLayout`.

## Icons and accessibility

Use `lucide-react` icons, imported where needed, with `iconSize.sm | md | lg` from
`icon.ts`. Avoid emoji or Unicode glyphs as interface icons.

- Hide decorative icons with `aria-hidden`.
- Icon-only controls need a specific accessible name.
- Never communicate status using color or an icon alone; include text or sr-only
  content.
- Associate labels and hints with every control. Connect validation errors using
  aria-invalid and aria-describedby.
- Keep FormError mounted so assistive technology announces updates reliably.
- Provide visible focus and comfortable touch targets of at least 24 px.
- Maintain readable contrast, including dark text on the primary-green panel.
- Check mobile layouts at 375 px: no horizontal scrolling, cropped text, or overlap.

## Domain components and loading

Reusable domain components compose the shared controls and live in feature
folders outside `ui/`, such as `auth/photo-auth-layout`,
`verification/verification-badge`, and `ngo/ngo-tab-bar`. Page-specific components,
including the registration role selector, live in their page's `_components`
folder. See [component organization](../README.md).

Loading buttons use `PetfinderMark` with `magnifier-loading` from globals.css.
There is no startup splash screen or global route-change loading indicator.
