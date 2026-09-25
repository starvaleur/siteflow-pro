# SiteFlow-Pro — Deployment Runbook

> Single source of truth for shipping SiteFlow-Pro to production.
> Every step below has a corresponding automated check in CI (`.github/workflows/`).
> If a step is failing manually, fix CI first — the manual path is the backup.

---

## Architecture

```
                  ┌──────────────────────────┐
   users ──HTTPS──▶  CloudFront / Vercel CDN │
                  └──────────┬───────────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
   ┌────────▼────────┐               ┌────────▼────────┐
   │ Vercel Edge /   │               │  ECS Fargate    │
   │ Vercel Function │               │  (Express+tRPC) │
   └────────┬─────────┘               └────────┬────────┘
            │                                │
            └────────────────┬───────────────┘
                             │
                  ┌──────────▼───────────┐
                  │  RDS MySQL 8 / S3    │
                  └──────────────────────┘
```

Two parallel deployment targets:

| Target       | Best for                                  | Workflow                |
|--------------|-------------------------------------------|-------------------------|
| **Vercel**   | Static SPA + edge functions; PR previews  | `deploy-vercel.yml`     |
| **AWS ECS**  | Full Express + tRPC + RDS MySQL stack     | `deploy-aws.yml`        |

Both build from the same `pnpm build` artifact.

---

## Local development

```bash
# 1. Prereqs: Node 22 (use .nvmrc), pnpm 10, Docker (for MySQL).
nvm use          # picks up .nvmrc

# 2. Install deps with patched lockfile.
pnpm install --frozen-lockfile

# 3. Boot MySQL + the production build via docker compose.
pnpm docker:run

# 4. Or run the dev server (Vite HMR + tsx watch) against your own MySQL:
cp .env.example .env.local
# fill DATABASE_URL etc.
pnpm dev

# 5. Quality gates (run all before opening a PR):
pnpm check          # tsc --noEmit
pnpm lint           # prettier --check
pnpm test           # vitest unit + integration
pnpm test:e2e       # playwright (needs `pnpm test:e2e:install` once)
pnpm bundle:check   # dist size budgets
pnpm env:check      # runtime env validation
```

---

## CI pipeline

`.github/workflows/ci.yml` runs on every PR and push to `main`. The pipeline is a fan-out DAG; if any job fails the merge is blocked.

```
install ─┬─ typecheck
         ├─ unit-integration
         └─ build ─┬─ bundle-size
                   └─ e2e
                          ↓
                    ci-success-gate
```

---

## Deploy to Vercel

**Required GitHub secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `LHCI_GITHUB_APP_TOKEN`.

`vercel.json` configures regions, security headers, and immutable cache for `/assets/*`.

---

## Deploy to AWS ECS

**Required GitHub secrets:** `AWS_DEPLOY_ROLE_ARN`, `ECS_CLUSTER_NAME`, `ECS_SERVICE_NAME`, `ECS_CONTAINER_NAME`.

**Pipeline flow** (`deploy-aws.yml`):

1. OIDC → assume `AWS_DEPLOY_ROLE_ARN` (no static AWS keys).
2. Download current ECS task definition.
3. `jq` → swap image to `ghcr.io/starvaleur/siteflow-pro:sha-<sha>`.
4. Register new task definition.
5. `aws ecs update-service --force-new-deployment`.
6. `aws ecs wait services-stable`.

---

## Container build (local)

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg BUILD_SHA=$(git rev-parse --short HEAD) \
  --build-arg BUILD_DATE=$(date -u +%FT%TZ) \
  --tag siteflow-pro:local \
  --load .

pnpm docker:run

curl -fsS http://localhost:3000/health
# → {"status":"ok","sha":"<sha>","uptime":<seconds>}
```

---

## Rollback

### Vercel
```bash
vercel rollback
```

### ECS
```bash
aws ecs update-service \
  --cluster siteflow-pro-prod \
  --service siteflow-pro-web \
  --task-definition siteflow-pro-web:<previous-rev>
```

---

## Post-deploy verification

After every production deploy, verify in order:

```bash
curl -fsS https://siteflow.app/health | jq
pnpm lighthouse -- --collect.url=https://siteflow.app/
```

If any check fails → trigger Rollback.