# CI/CD pipeline reference

This document describes every workflow under `.github/workflows/`, the secrets they need, and how to debug common failures.

## Workflow inventory

| Workflow              | Trigger                       | Purpose                                                |
|-----------------------|-------------------------------|--------------------------------------------------------|
| `ci.yml`              | PR + push to main             | Lint, type-check, test, build, bundle-budget, e2e      |
| `deploy-vercel.yml`   | PR + push to main             | Preview + production deploys to Vercel                 |
| `lighthouse.yml`      | PR + push to main             | Lighthouse CI runs against local prod build            |
| `docker.yml`          | push to main, tags `v*`       | Multi-arch image → `ghcr.io/{owner}/{repo}`            |
| `deploy-aws.yml`      | push to main (paths filtered) | ECS rolling deploy via OIDC                            |

## Secrets inventory

| Secret                          | Used by                | Required? |
|---------------------------------|------------------------|-----------|
| `VERCEL_TOKEN`                  | deploy-vercel          | yes       |
| `VERCEL_ORG_ID`                 | deploy-vercel          | yes       |
| `VERCEL_PROJECT_ID`             | deploy-vercel          | yes       |
| `LHCI_GITHUB_APP_TOKEN`         | lighthouse -PR comments | optional  |
| `AWS_DEPLOY_ROLE_ARN`           | deploy-aws             | yes       |
| `ECS_CLUSTER_NAME`              | deploy-aws             | yes       |
| `ECS_SERVICE_NAME`              | deploy-aws             | yes       |
| `ECS_CONTAINER_NAME`            | deploy-aws             | yes       |
| `GITHUB_TOKEN`                  | docker.yml             | auto      |

## Debugging common failures

### `bundle:check` fails in CI

Inspect the report artifact or run `pnpm analyze` locally to view `dist/bundle-report.html` (treemap). Either split the offender into its own chunk or justify a budget bump in `scripts/bundle-size.mjs` with a PR note.

### `e2e` is flaky on CI

`playwright.config.ts` uses `npm run build && npm run start` for deterministic hermetic runs. Failures are uploaded as `playwright-report-*` artifacts.

### Vercel deploy fails with "build failed"

Check `pnpm build` locally with the same Node version (22, see `.nvmrc`). Vercel injects `VERCEL=1` — the build script does not read it but custom plugins might.

### ECS service doesn't reach steady state

Inspect the new task's logs in CloudWatch. Common cause: DB connection refused → check the security group on RDS allows the Fargate task SG.