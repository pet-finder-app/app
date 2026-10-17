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
  corner radius and white registration panel with theme-colored field borders.

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
| `accent-tertiary` | `#249c42` | Selected navigation text, filled icons, and profile-photo outlines; 3.55:1 contrast on white |
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

Input, Select, Textarea, FileInput, and Checkbox support an optional `labelIcon`
Lucide component beside the label. These icons are decorative and do not replace
accessible label text.

## Field tones

Fields, checkboxes, and links support these tones:

- `primary`: green authentication surfaces with dark labels.
- `light`: white and neutral application surfaces; the default.
- `brutal`: thin dark borders without soft elevation.
- `photo`: dark photographic surfaces, with white labels and white controls.

Links also support `tone="accent-underline"` for bold theme-black text with an
accent-green underline, used inside the registration panel.

Checkboxes retain their native checked state, keyboard behavior, and label
association. The default shared style uses an accent-green background and a
theme-black checkmark when checked, including registration and profile forms.
The `chip` variant displays a compact selectable pill with an accent fill while
preserving native checkbox semantics; use wrapping groups for multiple choices.
Unchecked boxes remain white. `variant="default"` retains the white box with a
primary-green checkmark when an explicit alternative is needed.

## Components

| Component | Purpose |
| --- | --- |
| `Button` | Primary, secondary, outline, pill, filter, danger, danger-ghost, dark, photo, and photo-back variants; sm/md/lg sizes and loading states. |
| `LinkButton` | The same visual treatment for navigation. |
| `TextLink` | Inline link with a visible focus indicator. |
| `Input`, `Select`, `Textarea` | Controls with accessible labels, hints, and errors. Always supply id and label. |
| `PasswordInput` | Reuses `Input` with an independent show/hide eye button. Supports the same tones, hints, and validation props. |
| `Checkbox` | Accent-green checked box with a theme-black tick and an associated label that may contain links. |
| `FileInput` | File selection and metadata. |
| `PhotoInput` | Multiple photo selection with previews and individual removal. |
| `MediaInput` | Multiple photos/videos with previews; retain actual Files for multipart uploads. |
| `FormError` | Always-mounted form alert; fields reference its id through errorId. |
| `Card`, `CardTitle`, `CardDescription` | Shared content surfaces. Card tone controls the background. |
| `Badge` | Neutral, informational, success, warning, and danger status labels. |
| `BottomSheet` | Modal panel with a draggable handle, animated dismissal, focus management, scroll lock, an independently scrolling body, and an optional fixed footer. Mount to open and unmount in `onClose`. |
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
Its default background is white. The home feed removes outer gutters for
edge-to-edge media, while its headers, captions, and controls retain padding.
Home filters use the `Button` filter variant: white with a theme border by
default, accent green with dark text when `aria-checked` or `data-selected` is
true. Location and hidden-pet toggles are icon-only on the left and right; a
denied location control stays clickable at 75% opacity. The center uses two
exclusive mode buttons with `aria-pressed` and a sliding accent-green background.
Toggle controls retain accessible names, switch semantics, keyboard interaction,
and visible focus. Reduced-motion preferences disable the sliding transition.
The filter row stays directly below the fixed header. Scroll is the default
view; the grid shows animal photos without post chrome. Selecting a photo opens
a temporary scroll feed positioned at that exact post. Browser Back or the
temporary back arrow restores the grid's loaded batch and scroll position.
Hidden-pet and location choices remain live through preview and return; Back
does not revert them. Filter state uses `view`, `hidden`, and `location` URL
parameters, with `post` identifying a temporary preview. Reloading or sharing
these URLs restores the same filters and selected post. Keep Next.js history
fields intact and its canonical URL synchronized when writing feed history.
Location denial opens the shared `LocationDisabledDialog`, with a crossed-pin
illustration and browser-settings guidance. The filter retains a static crossed
pin and reopens the notice, leaving denial text out of the feed. The shared icon
uses a transparent gap around its diagonal stroke so it works on any surface;
reduced-motion preferences disable the modal's wiggle and line-drawing animation.
Scroll-feed photos support double-tap/double-click likes and a temporary heart
overlay. This gesture only adds a like; the separate accessible heart button
still toggles it. Swiping the carousel or scrolling the feed must not trigger a
like. Reduced-motion preferences replace the moving heart with a static one.
The home post-options sheet has a draggable handle: upward and short downward
pulls spring back, while a longer downward pull or flick dismisses it. Close
buttons, backdrop clicks, and Escape use the same exit animation. Keep the modal
and background scroll lock until the animation completes; hide actions update
the feed afterward. Reduced-motion preferences disable sheet animations.
Pages with `hasActionBar` also show the fixed PETFINDER header and reserve space
above the content. Use `hasHeader` to override that default when needed. Page
headings belong inside the same content bounds. Forms with fixed actions use
`ActionBar`, aligned with the page width and device safe area. Bottom navigation
uses compact padding while keeping 44 px touch targets and bottom safe-area space.
Shared navigation icons fill inward from their outlines on selection using
`accent-tertiary`. Press feedback scales
the content inside a stable touch target, with a small overshoot on release.
Reduced-motion preferences disable the fill animation and scaling.

Login, registration, and password recovery share `PhotoAuthLayout`: the dark
gradient, wordmark, and initial logo position. Their `(auth)` route-group layout
keeps `PetSlideshow` mounted across navigation, preserving its active slide,
timer, fade, and scale animation. The logo moves upward when registration opens.
The rounded white panel slides over disabled role cards; only the panel scrolls.
Back navigation or clicking outside closes it with a prompt-starting ease-out
animation. Reduced-motion preferences disable movement. The forgot-password page
uses photo-tone controls and a custom footer linking back to login. The
reset-password page currently uses `AuthLayout`.

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
- Maintain readable contrast, including dark text on the white registration panel.
- Check mobile layouts at 375 px: no horizontal scrolling, cropped text, or overlap.

## Domain components and loading

Reusable domain components compose the shared controls and live in feature
folders outside `ui/`, such as `auth/photo-auth-layout`,
`verification/verification-badge`, and `ngo/ngo-tab-bar`. Page-specific components,
including the registration role selector, live in their page's `_components`
folder. See [component organization](../README.md).

Loading buttons use `PetfinderMark` with `magnifier-loading` from globals.css.
There is no startup splash screen or global route-change loading indicator.
