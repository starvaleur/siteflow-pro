#!/usr/bin/env node
// =============================================================================
// SiteFlow-Pro — bundle size budget enforcement
// Run by `pnpm bundle:check` in the CI pipeline (after `pnpm build`).
// Fails with exit 1 if any chunk exceeds its budget.
// =============================================================================
import { readdirSync, statSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist/public/assets/", import.meta.url));

const BUDGETS = {
  "vendor-react":   100,
  "vendor-radix":   150,
  "vendor-motion":  150,
  "vendor-charts":  150,
  "vendor-tanstack":100,
  "vendor-trpc":    100,
  "vendor-icons":   100,
  "vendor-forms":   100,
  "vendor":         100,
  "index":          120,
};

const TOTAL_BUDGET_KB = 700;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const failures = [];
let totalGzip = 0;
const report = [];

for (const file of walk(DIST)) {
  if (![".js", ".css"].includes(extname(file))) continue;
  const raw = statSync(file).size;
  const gz = gzipSync(readFileSync(file)).length;
  totalGzip += gz;
  const fname = basename(file);
  const name = fname.replace(/-\w{8}\.(js|css)$/, "");
  const budget = BUDGETS[name];
  report.push({ file: fname, raw, gz, budget });
  if (budget && gz / 1024 > budget) {
    failures.push(`  ✗ ${fname}: ${(gz/1024).toFixed(1)} KB > budget ${budget} KB`);
  }
}

console.log("\nBundle size report (gzip):");
for (const r of report.sort((a, b) => b.gz - a.gz)) {
  const flag = r.budget && r.gz/1024 > r.budget ? "✗" : "·";
  console.log(`  ${flag} ${r.file.padEnd(40)} ${(r.gz/1024).toFixed(1).padStart(7)} KB`);
}
console.log(`\nTotal gzipped: ${(totalGzip/1024).toFixed(1)} KB (budget ${TOTAL_BUDGET_KB} KB)`);

if (totalGzip / 1024 > TOTAL_BUDGET_KB) {
  failures.push(`  ✗ total bundle ${(totalGzip/1024).toFixed(1)} KB exceeds ${TOTAL_BUDGET_KB} KB budget`);
}

if (failures.length) {
  console.error("\nBundle budget violations:");
  failures.forEach((f) => console.error(f));
  process.exit(1);
}
console.log("\n✅ All bundle budgets satisfied.\n");