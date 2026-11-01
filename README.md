# Petfinder App

The official Petfinder interface, built with Next.js, React, Tailwind CSS, and pnpm.

Source code, identifiers, comments, and routes use English. Visible product text
remains in Brazilian Portuguese.

## Development

Install Node.js 24 and pnpm, then run:

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Validation

```sh
pnpm lint
pnpm test
pnpm exec tsc --noEmit
pnpm format:check
pnpm build
```

Migration checks cover internal route targets, persisted domain values, workflow
roles, agreement placeholders, and registration API behavior without changing
application data.

See [the UI system](src/components/ui/README.md) and
[the adoption workflow plan](docs/adoption-workflow-plan.md) for project details.
