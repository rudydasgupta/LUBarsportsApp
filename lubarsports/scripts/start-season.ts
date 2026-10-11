/**
 * Creates a season, generates its fixtures from the template and makes it
 * the current season (archiving the previous one). The admin panel's
 * Seasons page does the same; this is for doing it from a terminal.
 *
 *   npx tsx scripts/start-season.ts --name 2026/27 --michaelmas 2026-10-05 --lent 2027-01-11 [--swap] [--dry-run]
 */
import { PrismaClient } from "@prisma/client";
import { isValidIso, weekdayIndex } from "../src/lib/dates";
import { createSeason, planFixtures, slugForSeason } from "../src/lib/season-admin";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const name = arg("name");
  const michaelmasStart = arg("michaelmas");
  const lentStart = arg("lent");
  const swapHomeAway = process.argv.includes("--swap");
  const dryRun = process.argv.includes("--dry-run");
  if (!name || !michaelmasStart || !lentStart) throw new Error("Usage: --name 2026/27 --michaelmas YYYY-MM-DD --lent YYYY-MM-DD");
  for (const d of [michaelmasStart, lentStart]) {
    if (!isValidIso(d) || weekdayIndex(d) !== 0) throw new Error(`${d} must be a Monday (YYYY-MM-DD).`);
  }

  const db = new PrismaClient();
  try {
    const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/[/?].*$/, "");
    console.log(`Database: ${host}`);
    const divisions = await db.division.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
    const input = {
      name,
      slug: slugForSeason(name),
      michaelmasStart,
      lentStart,
      winBonus: 2,
      drawBonus: 0,
      divisionIds: divisions.map((d) => d.id),
      generateFixtures: true,
      swapHomeAway,
      makeCurrent: true,
    };
    const plan = await planFixtures(db, input);
    console.log(`${name}: ${plan.planned.length} fixtures across ${divisions.length} leagues${swapHomeAway ? " (home and away swapped)" : ""}.`);
    if (plan.missing.length) console.log("Missing teams:", plan.missing.join("; "));
    if (dryRun) return;

    const result = await db.$transaction((tx) => createSeason(tx, input));
    await db.auditLog.create({
      data: { actorName: "Script", action: "season.create", summary: `Created ${name} with ${result.created} fixtures and made it current.` },
    });
    console.log(`Created season ${result.season.name} (id ${result.season.id}) with ${result.created} fixtures.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
