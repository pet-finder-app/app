# Component organization

Put reusable components in feature folders under `src/components`. Page-private
components and styles belong in the owning page's `_components` directory;
shared components must not import those private modules.

| Folder | Responsibility |
| --- | --- |
| `api` | React Query screens for authentication, animals, applications, appointments, conversations, profiles, organizations, and reports |
| `auth` | Shared photographic authentication layout and slideshow |
| `brand` | Application header, marks, and brand icons |
| `posts` | Reusable media carousel, photo viewer, and gesture helpers |
| `navigation` | Shared navigation links, icons, and interaction helpers |
| `account` | Shared profile icon |
| `ui` | Generic controls, surfaces, layout primitives, and styling helpers |

The root `QueryProvider` supplies a shared query client. API screens use typed
requests and hooks from `src/lib/api`, rather than importing prototype services.
Existing photo viewer helpers remain independent of API data and retain their
gesture tests. Authentication pages stay inside the shared `(auth)` layout so
navigation does not restart the decorative slideshow.

See `src/components/ui/README.md` before adding controls or styling variants.
