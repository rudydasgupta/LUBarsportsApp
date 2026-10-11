/**
 * Sets up an EMPTY database for local development: the six leagues, a team
 * for each college in each league, and a current season with fixtures.
 * Refuses to run against a database that already has leagues in it.
 *
 *   DATABASE_URL=postgresql://localhost/lubarsports npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { COLLEGE_NAMES } from "../src/lib/config";
import { addDaysIso, mondayOf, todayIso } from "../src/lib/dates";
import { createSeason } from "../src/lib/season-admin";

const db = new PrismaClient();

const LEAGUES = [
  { name: "Open A's Pool", slug: "open-as-pool", sport: "Pool", matchDay: 1, framesPerMatch: 9, sortOrder: 1 },
  { name: "Open B's Pool", slug: "open-bs-pool", sport: "Pool", matchDay: 1, framesPerMatch: 7, sortOrder: 2 },
  { name: "Women's+ Pool", slug: "womens-pool", sport: "Pool", matchDay: 0, framesPerMatch: 5, sortOrder: 3 },
  { name: "Open Darts", slug: "open-darts", sport: "Darts", matchDay: 0, framesPerMatch: 9, sortOrder: 4 },
  { name: "Women's+ Darts", slug: "womens-darts", sport: "Darts", matchDay: 1, framesPerMatch: 5, sortOrder: 5 },
  { name: "Dominoes", slug: "dominoes", sport: "Dominoes", matchDay: 0, framesPerMatch: 3, sortOrder: 6 },
];

async function main() {
  if ((await db.division.count()) > 0) {
    console.log("This database already has leagues. Nothing changed. (The seed only sets up empty databases.)");
    return;
  }
  for (const league of LEAGUES) {
    const division = await db.division.create({ data: league });
    await db.team.createMany({ data: COLLEGE_NAMES.map((name) => ({ name, divisionId: division.id })) });
  }
  // A season whose week 2 is this week, so there is something to look at.
  const michaelmasStart = addDaysIso(mondayOf(todayIso()), -7);
  const year = Number(michaelmasStart.slice(0, 4));
  const { created } = await createSeason(db, {
    name: `${year}/${String(year + 1).slice(2)}`,
    slug: `${year}-${String(year + 1).slice(2)}`,
    michaelmasStart,
    lentStart: addDaysIso(michaelmasStart, 14 * 7),
    winBonus: 2,
    drawBonus: 0,
    divisionIds: (await db.division.findMany()).map((d) => d.id),
    generateFixtures: true,
    swapHomeAway: false,
    makeCurrent: true,
  });
  console.log(`Seeded ${LEAGUES.length} leagues and ${created} fixtures.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
