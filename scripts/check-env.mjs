#!/usr/bin/env node
// DEPRECATED — canonical implementation now lives at server/_core/check-env.ts
// (bundled into the server runtime, single source of truth). This shim is kept
// for backwards compatibility with `pnpm env:check` and forwards via tsx.
import { spawnSync } from "node:child_process";
const r = spawnSync(
  process.execPath,
  ["--import", "tsx", "../server/_core/check-env.ts"],
  { stdio: "inherit", cwd: new URL(".", import.meta.url) },
);
process.exit(r.status ?? 1);