import type { Prisma, PrismaClient } from "@prisma/client";
import { PLACEHOLDER_TEAM } from "./config";
import { addDaysIso, isoToStored, weekStartIso } from "./dates";
import { FIXTURE_TEMPLATE } from "./fixture-template";

type Tx = Prisma.TransactionClient | PrismaClient;

export type NewSeasonInput = {
  name: string;
  slug: string;
  /** Monday of Michaelmas week 1, YYYY-MM-DD. */
  michaelmasStart: string;
  /** Monday of Lent week 11, YYYY-MM-DD. */
  lentStart: string;
  winBonus: number;
  drawBonus: number;
  /** Leagues to create fixtures for. */
  divisionIds: number[];
  generateFixtures: boolean;
  swapHomeAway: boolean;
  /** Make this the season the public site shows, and archive the old one. */
  makeCurrent: boolean;
};

export function slugForSeason(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The fixtures a season would get from the template, without writing anything. */
export async function planFixtures(tx: Tx, input: Pick<NewSeasonInput, "michaelmasStart" | "lentStart" | "divisionIds" | "swapHomeAway">) {
  const divisions = await tx.division.findMany({
    where: { id: { in: input.divisionIds } },
    include: { teams: { where: { name: { not: PLACEHOLDER_TEAM } } } },
  });
  const planned: Prisma.FixtureCreateManyInput[] = [];
  const missing = new Set<string>();
  for (const division of divisions) {
    const teamId = new Map(division.teams.map((t) => [t.name, t.id]));
    for (const round of FIXTURE_TEMPLATE) {
      const monday = weekStartIso(input, round.week);
      const date = isoToStored(addDaysIso(monday, division.matchDay));
      for (const [h, a] of round.matches) {
        const [home, away] = input.swapHomeAway ? [a, h] : [h, a];
        const homeTeamId = teamId.get(home);
        const awayTeamId = teamId.get(away);
        if (!homeTeamId || !awayTeamId) {
          missing.add(`${division.name}: ${!homeTeamId ? home : away}`);
          continue;
        }
        planned.push({ seasonId: 0, divisionId: division.id, week: round.week, homeTeamId, awayTeamId, date });
      }
    }
  }
  return { planned, missing: [...missing] };
}

export async function createSeason(tx: Tx, input: NewSeasonInput) {
  if (input.makeCurrent) {
    await tx.season.updateMany({ where: { status: "ACTIVE" }, data: { status: "ARCHIVED" } });
    await tx.season.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
  }
  const season = await tx.season.create({
    data: {
      name: input.name,
      slug: input.slug,
      status: input.makeCurrent ? "ACTIVE" : "UPCOMING",
      isCurrent: input.makeCurrent,
      michaelmasStart: isoToStored(input.michaelmasStart),
      lentStart: isoToStored(input.lentStart),
      winBonus: input.winBonus,
      drawBonus: input.drawBonus,
    },
  });

  let created = 0;
  let missing: string[] = [];
  if (input.generateFixtures && input.divisionIds.length > 0) {
    const plan = await planFixtures(tx, input);
    missing = plan.missing;
    const result = await tx.fixture.createMany({
      data: plan.planned.map((f) => ({ ...f, seasonId: season.id })),
      skipDuplicates: true,
    });
    created = result.count;
  }
  return { season, created, missing };
}
