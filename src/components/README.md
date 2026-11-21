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
| `account` | Sign-out, account deletion, personal verification warnings |
| `adopter` | Personal account navigation |
| `animals` | Animal attributes, lifecycle (archive/delete, history), reassignment, interest and analytics |
| `api` | React Query provider |
| `auth` | Shared auth layout, slideshow, session guard, password recovery |
| `backend` | Go-backed profiles, organizations, verification, animals, applications, chat, appointments |
| `brand` | Wordmarks and brand icons |
| `community` | NGO posts, follows, following feed, notifications |
| `donations` | Donation reports, history, NGO decisions and totals |
| `location` | Browser location preference controls |
| `media` | Upload field backed by the Go media API |
| `navigation` | Shared navigation primitives |
| `ngo` | NGO navigation, profile sections, donation details, verification-loss warning |
| `posts` | Feed and NGO post presentation, media carousel, and options |
| `ui` | Generic controls, surfaces, and layout primitives |
| `workflows` | Agreements and signing, follow-ups, surrender/return cases |

Keep reusable components independent of page-private `_components` folders. Move
a page component into the appropriate shared feature folder when another page
needs it, rather than importing through a different page's private folder.

Adopter and NGO navigation share `NavigationTabLink`. Both icon and component tabs
display their label. Component tabs render through JSX, allowing the profile tab
to show its icon or avatar above the label. NGO create actions stay in the NGO bar.

Home feed filters, navigation, and progressive batches belong to
`src/app/_components`. Home and Favorites reuse `FeedPost` and `FeedPostMenu`
from `components/posts`, including the NGO header, media carousel, idempotent
likes, unlike/unhide, and options sheet. Favorites loads actual Go liked
preferences independently of discovery; adoption actions live on pet details.
The carousel supports edge-to-edge media and optional pet tags. Its optional
photo double-tap callback excludes swipes, long presses, and video controls, and
displays a temporary heart with reduced-motion support. Home post options and
personal profile categories reuse the shared `BottomSheet` and form controls.
Pet details enable the carousel's optional full-screen `PhotoViewer`, with pinch
zoom, panning, and keyboard navigation. Other carousel callers retain their
existing photo double-tap behavior.

Go-backed workflows live in `backend`. `AnimalInventory` shares the private
advertiser/organization inventory UI; `AnimalList` remains a discovery/preference
feed. `AnimalImageManager` uses membership publication permissions for moderation.
`AppointmentPanel` reads persisted appointments and confirmation history, and
`ChatThread` loads cursor-based history and receives new messages over the
WebSocket (`useChatSocket`), polling only while it reconnects. Capabilities the
API lacks render `UnsupportedFeature`; see `docs/known-gaps.md` before adding an
interaction.
