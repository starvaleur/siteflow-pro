# Performance guide — Core Web Vitals & bundle budget

Target: **all green on mobile 4G** for `/`, `/dashboard`, `/editor`.

| Metric | Target | Source                              |
|--------|--------|-------------------------------------|
| LCP    | ≤ 2.5s | Hero image preloaded + critical CSS |
| CLS    | ≤ 0.10 | Reserved sizes on all media + fonts |
| INP    | ≤ 200ms | No long-task JS on input handlers  |
| TBT    | ≤ 300ms | Vendor split + defer heavy chunks   |
| JS     | ≤ 700 KB gz | Enforced by `pnpm bundle:check` |

## What the build already does

- **Vite**: target `es2022`, terser with `drop_console` in prod, source maps hidden
- **Code splitting**: manual chunks for `react`, `radix-ui`, `tanstack`, `trpc`, `motion`, `charts`, `icons`, `forms`
- **CSS code split**: per-route CSS
- **Module preload**: polyfill disabled (~2 KB saving)
- **Cache headers**: `/assets/*` → `max-age=31536000, immutable` (in `vercel.json`)
- **Security headers**: HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy

## What developers need to do

1. Convert images to AVIF/WebP; size to layout box; reserve width/height.
2. Lazy-load every new route (`lazy()` + `<Suspense>`).
3. Heavy widgets (charts, AI chat, canvas) behind dynamic imports.
4. Third-party scripts via `defer`; never block the parser.

## How to check

```bash
pnpm build && pnpm start
pnpm lighthouse          # 3 runs, desktop preset
pnpm analyze             # opens dist/bundle-report.html
```

## When you regress

1. Check the PR's `lighthouse-report` artifact for the exact audit that regressed.
2. If `unused-javascript`, find the dep and switch from barrel import to direct path.
3. If `render-blocking-resources`, inline small critical CSS / `defer` the JS.
4. If `bundle:check` fails: split the dep into its own chunk, or justify a budget bump in `scripts/bundle-size.mjs`.