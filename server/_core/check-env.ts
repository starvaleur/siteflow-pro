/**
 * SiteFlow-Pro — runtime environment validator
 * Single source of truth. Bundled into the server by esbuild and also
 * callable directly from CI via `pnpm env:check` (which runs this file
 * with tsx, no rebuild required).
 */

const REQUIRED = ["DATABASE_URL", "SESSION_SECRET"];
const RECOMMENDED = ["S3_BUCKET", "S3_REGION", "OAUTH_SERVER_URL"];

const isProd = process.env.NODE_ENV === "production";
const failures: string[] = [];
const warnings: string[] = [];

for (const key of REQUIRED) {
  const v = process.env[key];
  if (!v) {
    failures.push(`Missing required env: ${key}`);
  } else if (isProd && /dev|change-?me|placeholder/i.test(v)) {
    failures.push(`Refusing to start in production with placeholder value for ${key}`);
  }
}

for (const key of RECOMMENDED) {
  if (!process.env[key]) warnings.push(`Recommended env not set: ${key}`);
}

if (failures.length) {
  console.error("\n\u2717 Environment validation failed:");
  failures.forEach((f) => console.error("  " + f));
  process.exit(1);
}

if (warnings.length) {
  console.warn("\n\u26A0 Environment warnings:");
  warnings.forEach((w) => console.warn("  " + w));
}

console.log("\u2713 Environment validated for " + (isProd ? "production" : "development"));

export {};