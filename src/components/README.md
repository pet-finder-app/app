# Component organization

Keep components that are specific to a page in that page's `_components` folder,
alongside their styles. Pages import these components locally:

```text
src/app/(auth)/register/
  page.tsx
  _components/
    register-flow.tsx
    register-flow.module.css
    register-form.tsx
    ngo-register-form.tsx
    role-select.tsx
    role-select.module.css
```

Reusable components belong in `src/components`, grouped by feature:

| Folder | Responsibility |
| --- | --- |
| `account` | Sign-out confirmation |
| `adopter` | Personal account navigation |
| `api` | React Query provider |
| `auth` | Shared auth layout, slideshow, session guard |
| `backend` | Go-backed profiles, organizations, animals, applications, chat, appointments |
| `brand` | Wordmarks and brand icons |
| `location` | Browser location preference controls |
| `navigation` | Shared navigation primitives |
| `ngo` | NGO identity and navigation |
| `posts` | Animal feed presentation, media carousel, and options |
| `ui` | Generic controls, surfaces, and layout primitives |

Keep reusable components independent of page-private `_components` folders. Move
a page component into the appropriate shared feature folder when another page
needs it, rather than importing through a different page's private folder.

Adopter and NGO navigation share `NavigationTabLink`. Both icon and component tabs
display their label. Component tabs render through JSX, allowing the profile tab
to show its icon or avatar above the label. NGO create actions stay in the NGO bar.

Home feed filters, navigation, and progressive batches belong to
`src/app/_components`. Home and Favorites reuse `FeedPost` and `FeedPostMenu`
from `components/posts`, including the NGO header, media carousel, idempotent likes,
and options sheet. Favorites loads actual Go liked preferences independently of discovery; adoption actions live on pet details.
The carousel supports edge-to-edge media and optional pet tags. Its optional
photo double-tap callback excludes swipes, long presses, and video controls, and
displays a temporary heart with reduced-motion support. Home post options and
personal profile categories reuse the shared `BottomSheet` and form controls.
Pet details enable the carousel's optional full-screen `PhotoViewer`, with pinch
zoom, panning, and keyboard navigation. Other carousel callers retain their
existing photo double-tap behavior.

Go-backed workflows live in `backend`. Missing backend capabilities render
`UnsupportedFeature`; see `UNSUPPORTED.md` before adding an interaction.
