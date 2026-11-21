# Development

Use Node.js 24 and pnpm. Start the Go service using its README, then:

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Set the server-only `API_BASE_URL` to the Go service URL. Open
`http://localhost:3000`. There is no runtime mock fallback or local JSON storage.
Auth slideshow images in `public/auth` are decorative artwork.

## Validation

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm format:check
pnpm build
```

Tests isolate transport fixtures and never mutate configured backend data.

Each feature has its own test file in `tests/` (`account`, `animals`, `community`,
`donations`, `workflows`, plus transport, cache and migration suites). Run one
file with `node --test --test-isolation=none tests/<name>.test.mjs`.
