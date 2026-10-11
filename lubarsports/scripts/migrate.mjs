/**
 * Applies database migrations. Vercel's build command runs this (through
 * `npm run prisma:migrate:deploy`) before `next build`.
 *
 * Migrations must not go through Neon's connection pooler: Prisma takes a
 * Postgres advisory lock while migrating, and through the pooler that lock can
 * be left behind on a pooled connection, making the next deploy time out
 * (error P1002). So this uses DIRECT_URL if set, or else DATABASE_URL with
 * "-pooler" taken out of the host, which is Neon's direct connection.
 */
import { spawnSync } from "node:child_process";

const pooled = process.env.DATABASE_URL;
if (!pooled && !process.env.DIRECT_URL) {
  console.error("Set DATABASE_URL (or DIRECT_URL) to run migrations.");
  process.exit(1);
}
const direct = process.env.DIRECT_URL || pooled.replace(/-pooler(?=\.)/, "");
const host = direct.replace(/^.*@/, "").replace(/[/?].*$/, "");
console.log(`Applying migrations on ${host}`);

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: direct },
});
process.exit(result.status ?? 1);
