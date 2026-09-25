# syntax=docker/dockerfile:1.7
# =============================================================================
# SiteFlow-Pro — production Dockerfile
# Multi-stage: pnpm install (with build cache) -> client+server build ->
# slim production runtime.
# Image: Node 22 LTS alpine, non-root, distroless-style hardening.
# =============================================================================

ARG NODE_VERSION=22-alpine

# ---- Stage 1: deps with build cache for native modules --------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /repo
RUN apk add --no-cache libc6-compat python3 make g++ \
 && corepack enable && corepack prepare pnpm@10 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* patches/ ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

# ---- Stage 2: build (client + server bundled with esbuild) ---------------
FROM node:${NODE_VERSION} AS build
WORKDIR /repo
RUN apk add --no-cache libc6-compat python3 make g++ \
 && corepack enable && corepack prepare pnpm@10 --activate
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
ARG BUILD_SHA=dev
ARG BUILD_DATE=unknown
ENV BUILD_SHA=${BUILD_SHA} BUILD_DATE=${BUILD_DATE}
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline && pnpm build

# ---- Stage 3: production runner ------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app

# OCI labels for image metadata (consumed by registries + scanners)
ARG BUILD_SHA=dev
ARG BUILD_DATE=unknown
LABEL org.opencontainers.image.title="siteflow-pro" \
      org.opencontainers.image.source="https://github.com/starvaleur/siteflow-pro" \
      org.opencontainers.image.revision="${BUILD_SHA}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="MIT"

# tini for clean signal handling, curl for healthcheck
RUN apk add --no-cache tini curl

# Non-root user (UID 10001) for least-privilege runtime
RUN addgroup -g 10001 -S nodejs && adduser -S -u 10001 -G nodejs nodejs

ENV NODE_ENV=production \
    PORT=3000 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NODE_OPTIONS="--enable-source-maps" \
    NODE_NO_WARNINGS=1 \
    UV_THREADPOOL_SIZE=4

COPY --from=build --chown=nodejs:nodejs /repo/dist ./dist
COPY --from=build --chown=nodejs:nodejs /repo/package.json ./package.json
COPY --from=deps --chown=nodejs:nodejs /repo/node_modules ./node_modules

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]