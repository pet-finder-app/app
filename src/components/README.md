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
| `account` | Sign-out and account-deletion controls |
| `adopter` | Shared adopter feed, pet cards, and navigation |
| `adoptions` | Adoption panels and actions shared between participants |
| `agreements` | Printable agreement content and signature evidence |
| `auth` | Shared authentication layouts and pet slideshow |
| `brand` | Wordmarks, marks, and brand icons |
| `conversations` | Chat threads, conversation lists, and chat actions |
| `donations` | Reusable donation forms and confirmation controls |
| `location` | Browser-location controls, crossed-pin icon, and permission-denied notice |
| `navigation` | Shared tab definitions, links, selected states, and unread badges |
| `ngo` | Reusable NGO cards, navigation, summaries, and charts |
| `pets` | Pet editing, list items, and pet actions |
| `posts` | Post editing, media carousels, and post actions |
| `surrenders` | Shared surrender requests and process panels |
| `ui` | Generic controls, surfaces, icons, and layout primitives |
| `verification` | Shared verification status displays |
| `workflows` | Controls shared by adoption and surrender workflows |

Keep reusable components independent of page-private `_components` folders. Move
a page component into the appropriate shared feature folder when another page
needs it, rather than importing through a different page's private folder.

Adopter and NGO navigation share `NavigationTabLink`. Both icon and component tabs
display their label. Component tabs render through JSX, allowing the profile tab
to show its icon or avatar above the label. NGO create actions stay in the NGO bar.

Home feed filters, navigation, and progressive batches belong to
`src/app/_components`. Home and Favorites reuse `FeedPost` and `FeedPostMenu`
from `components/posts`, including the NGO header, media carousel, like actions,
and options sheet. Favorites keeps nonarchived liked pets visible regardless of
availability or Home's hidden-pet filter; adoption actions live on pet details.
The carousel supports edge-to-edge media and optional pet tags. Its optional
photo double-tap callback excludes swipes, long presses, and video controls, and
displays a temporary heart with reduced-motion support. Home post options and
personal profile categories reuse the shared `BottomSheet` and form controls.
Pet details enable the carousel's optional full-screen `PhotoViewer`, with pinch
zoom, panning, and keyboard navigation. Other carousel callers retain their
existing photo double-tap behavior.

For example, the print button lives in `ui` because both adoption and surrender
agreement pages use it, while the NGO dashboard composition lives in
`src/app/ngo/dashboard/_components`.
