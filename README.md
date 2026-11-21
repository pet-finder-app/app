# Petfinder App

The web interface of Petfinder, a platform where verified NGOs mediate pet
adoptions. Built with Next.js, React and Tailwind CSS; the Go service in
[`../api`](../api) owns all data, authentication and rules.

## Getting started

Start the API first (see its README), then, with Node.js 24 and pnpm:

```sh
pnpm install
cp .env.example .env.local   # set API_BASE_URL to the API
pnpm dev                     # http://localhost:3000
```

Before pushing, run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test` and `pnpm build`.

## Documentation

| Topic | Document |
| --- | --- |
| Setup, commands and tests | [docs/development.md](docs/development.md) |
| Folders, rendering, permissions and pages | [docs/architecture.md](docs/architecture.md) |
| Talking to the Go API, sessions, chat and media | [docs/api-integration.md](docs/api-integration.md) |
| CI and production deployment | [docs/deployment.md](docs/deployment.md) |
| Known limitations | [docs/known-gaps.md](docs/known-gaps.md) |
| Components and UI system | [src/components/README.md](src/components/README.md), [src/components/ui/README.md](src/components/ui/README.md) |
| Conventions for AI coding agents | [AGENTS.md](AGENTS.md) |
