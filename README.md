# SiteFlow-Pro

[![CI](https://github.com/starvaleur/siteflow-pro/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/starvaleur/siteflow-pro/actions/workflows/ci.yml)
[![Deploy Vercel](https://github.com/starvaleur/siteflow-pro/actions/workflows/deploy-vercel.yml/badge.svg?branch=main)](https://github.com/starvaleur/siteflow-pro/actions/workflows/deploy-vercel.yml)
[![Docker image](https://github.com/starvaleur/siteflow-pro/actions/workflows/docker.yml/badge.svg?branch=main)](https://github.com/starvaleur/siteflow-pro/actions/workflows/docker.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> **Atelier no-code des équipes qui veulent composer et publier des sites exigeants sans perdre la maîtrise du détail.**
>
> A Wix-like drag-and-drop website builder with a typed canvas, role-based collaboration, and one-click publishing.

SiteFlow-Pro is a full-stack website builder platform. It pairs a strict TypeScript canvas data model with a React 19 editor and an Express + tRPC backend, so every drag, drop, edit, and undo round-trips losslessly through a versioned JSON document.

---

## ✨ Features

- **Drag-and-drop canvas** — typed blocks via discriminated unions (`shared/canvas.ts`)
- **Responsive editor** — Desktop / Tablet / Mobile layouts with collapsible sidebars and bottom-sheet properties
- **Hierarchical layers** — rename / hide / lock / duplicate / reorder
- **Theme & global styles** — full token set
- **Versioned publishing** — `?version=<id>` previews from immutable snapshots
- **RBAC** — `viewer` < `editor` < `owner` enforced server-side
- **Type-safe boundary** — Zod schemas first, TypeScript types second
- **Tested** — Vitest unit + integration + Playwright E2E journeys

---

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 · TypeScript 5.9 strict · Vite 7 |
| Styling | Tailwind CSS 4 · Radix UI · Framer Motion |
| State / data | TanStack Query 5 · tRPC 11 · Zod 4 |
| Backend | Node 22 · Express 4 · tRPC 11 · tsx |
| Database | MySQL · Drizzle ORM |
| Auth | Cookie sessions via `jose` |
| Storage | S3-compatible |
| Tests | Vitest 2 · Playwright 1.49 |

Package manager: **pnpm** (see `pnpm-lock.yaml`).

---

## 🚀 Quick start

```bash
nvm use                                    # Node 22
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
cp .env.example .env.local                  # fill DATABASE_URL, SESSION_SECRET, etc.
pnpm db:push
pnpm dev                                    # http://localhost:5173
```

Production:

```bash
pnpm build
pnpm start
```

---

## 🧪 Testing

| Command | What it runs |
|---|---|
| `pnpm test` | Vitest unit + integration |
| `pnpm test:unit` | `tests/unit/**` |
| `pnpm test:integration` | `tests/integration/**` |
| `pnpm test:e2e` | Playwright |
| `pnpm test:coverage` | V8 coverage |
| `pnpm check` | `tsc --noEmit` |
| `pnpm bundle:check` | Per-chunk gzip budget gate |
| `pnpm env:check` | Runtime env validator |

---

## 🔁 Continuous Integration

Every push and PR runs the pipeline in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). Jobs fan out in parallel:

| Job | Runs |
|---|---|
| `install`           | `pnpm install --frozen-lockfile` + Playwright browser cache |
| `typecheck`         | `pnpm check` |
| `unit-integration`  | `pnpm test:unit` + `pnpm test:integration` |
| `build`             | `pnpm build` → uploads `dist` artifact |
| `bundle-size`       | `pnpm bundle:check` — gzipped budget gate |
| `e2e`               | `pnpm test:e2e` against the freshly built prod server |

PRs are blocked from merging until all six jobs are green. Runs cancel-in-progress when a new commit lands on the same branch. Deployment workflows (`deploy-vercel.yml`, `docker.yml`, `deploy-aws.yml`) only fire on `push` to `main`. Full pipeline reference: [`docs/devops/CI-CD.md`](./docs/devops/CI-CD.md).

---

## 📁 Project structure

```
.
├── client/                React 19 + Vite frontend
├── server/                Express + tRPC backend
│   ├── _core/             Bootstrap, RBAC, canvas tree ops, check-env
│   └── routers/           tRPC routers
├── shared/                Zod schemas + derived TS types
├── drizzle/               Migrations + schema
├── tests/                 unit / integration / e2e
├── docs/
│   ├── architecture/      canvas.md
│   ├── adr/               Architecture Decision Records
│   └── devops/            CI-CD.md, PERFORMANCE.md
├── scripts/               bundle-size.mjs, check-env.mjs
├── .github/workflows/     ci, deploy-vercel, deploy-aws, docker, lighthouse
├── Dockerfile             multi-stage production image
├── docker-compose.yml     local stack (MySQL + app)
├── lighthouserc.json      Lighthouse CI assertions
├── vercel.json            Vercel regions + security headers
└── package.json
```

---

## 🚀 Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full runbook covering Vercel, AWS ECS, container build, rollback, and post-deploy verification.

---

## 📜 Project status

See [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for what's verified-working, what's incomplete, and what **must not be touched** without architect-agent approval.

---

## 📜 Changelog

See [`CHANGELOG.md`](./CHANGELOG.md).

## 🤝 Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## 🏛️ Architecture decisions

See [`docs/adr/`](./docs/adr/README.md).

---

## 📝 License

MIT — see [`LICENSE`](./LICENSE).