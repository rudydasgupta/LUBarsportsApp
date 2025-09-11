import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
const prisma = new PrismaClient();

async function main() {
  // 6 Leagues/Divisions
  const divisions = [
    { name: 'Open Darts', sport: 'Darts' },
    { name: "Women's+ Darts", sport: 'Darts' },
    { name: 'Dominoes', sport: 'Dominoes' },
    { name: "Open A's Pool", sport: 'Pool' },
    { name: "Open B's Pool", sport: 'Pool' },
    { name: "Women's+ Pool", sport: 'Pool' },
  ];

  // 9 Colleges
  const colleges = [
    'Graduate',
    'Cartmel',
    'Lonsdale',
    'Pendle',
    'Grizedale',
    'Fylde',
    'Furness',
    'Bowland',
    'County',
  ];

  // Example players per team
  const examplePlayers = [
    ['Alice', 'Bob', 'Charlie'],
    ['Dave', 'Eve', 'Frank'],
    ['Grace', 'Heidi', 'Ivan'],
    ['Judy', 'Mallory', 'Niaj'],
    ['Olivia', 'Peggy', 'Rupert'],
    ['Sybil', 'Trent', 'Victor'],
    ['Walter', 'Xena', 'Yasmine'],
    ['Zane', 'Quinn', 'Uma'],
    ['Oscar', 'Paul', 'Rita'],
  ];

  // Create divisions
  for (const division of divisions) {
    await prisma.division.upsert({
      where: { name: division.name },
      update: {},
      create: division,
    });
  }

  // Create teams and players
  for (const division of divisions) {
    const div = await prisma.division.findUnique({ where: { name: division.name } });
    if (!div) continue;
    for (let i = 0; i < colleges.length; i++) {
      const team = await prisma.team.upsert({
        where: { name_divisionId: { name: colleges[i], divisionId: div.id } },
        update: {},
        create: {
          name: colleges[i],
          divisionId: div.id,
          points: 0,
        },
      });
      for (const playerName of examplePlayers[i]) {
        await prisma.player.upsert({
          where: { name_teamId: { name: playerName, teamId: team.id } },
          update: {},
          create: {
            name: playerName,
            teamId: team.id,
          },
        });
      }
    }
  }

  // Load fixture pairs from CSV to guarantee exactly 4 matches/week
  function loadFixturesFromCsv(): { week: number, games: [string, string][] }[] {
    // Resolve relative to this file's directory to work both locally and in Vercel
    const csvPath = path.resolve(__dirname, 'fixtures.csv');
    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const out: Record<number, [string, string][]> = {};
    let currentWeek: number | null = null;
    for (let i = 1; i < lines.length; i++) { // skip header
      const [weekCell, homeCell, awayCell] = lines[i].split(',');
      if (weekCell && weekCell.startsWith('Week ')) {
        const wk = parseInt(weekCell.replace('Week ', '').trim(), 10);
        if (!isNaN(wk)) currentWeek = wk;
      }
      if (!currentWeek) continue;
      const home = (homeCell || '').trim();
      const away = (awayCell || '').trim();
      if (!home || !away) continue;
      if (!out[currentWeek]) out[currentWeek] = [];
      out[currentWeek].push([home as string, away as string]);
    }
    // Enforce exactly 4 games per week and dedupe pairs
    return Object.keys(out)
      .map(w => parseInt(w, 10))
      .sort((a, b) => a - b)
      .map(week => {
        const uniq = Array.from(new Set(out[week].map(([h, a]) => `${h}|${a}`)))
          .map(k => k.split('|') as [string, string]);
        return { week, games: uniq.slice(0, 4) };
      });
  }
  const fixtures: { week: number, games: [string, string][] }[] = loadFixturesFromCsv();

  // Start dates for term blocks
  // - Week 2 (pre-Christmas) defaults to Oct 13 of current year
  // - Week 11 (post-Christmas) defaults to Jan 12 of next calendar year
  function getWeek2StartDate(): Date {
    const fromEnv = process.env.WEEK2_START_ISO;
    if (fromEnv) {
      const parsed = new Date(fromEnv);
      if (!isNaN(parsed.valueOf())) {
        return parsed;
      }
    }
    const now = new Date();
    const year = now.getFullYear();
    // Month is 0-based; 9 = October. Noon local to avoid timezone midnight issues
    const d = new Date(year, 9, 13, 12, 0, 0, 0);
    return d;
  }
  const week2Start = getWeek2StartDate();

  function getWeek11StartDate(): Date {
    const fromEnv = process.env.WEEK11_START_ISO;
    if (fromEnv) {
      const parsed = new Date(fromEnv);
      if (!isNaN(parsed.valueOf())) {
        return parsed;
      }
    }
    const now = new Date();
    const year = now.getFullYear();
    // If current date is already past October, week 11 belongs to next year
    const baseYear = (now.getMonth() >= 9) ? year + 1 : year;
    // January = month 0
    const d = new Date(baseYear, 0, 12, 12, 0, 0, 0);
    return d;
  }
  const week11Start = getWeek11StartDate();

  // Helper: get the Monday of a given league week index
  function getWeekStartDate(week: number): Date {
    if (week < 11) {
      const base = new Date(week2Start);
      base.setDate(week2Start.getDate() + 7 * (week - 2));
      return base;
    }
    const base = new Date(week11Start);
    base.setDate(week11Start.getDate() + 7 * (week - 11));
    return base;
  }

  // Day offsets for divisions relative to week 2 Monday (0 = Monday, 1 = Tuesday)
  const divisionDayOffset: Record<string, number> = {
    "Women's+ Pool": 0,       // Monday 13th
    "Open Darts": 0,         // Monday 13th
    "Women's+ Darts": 1,     // Tuesday 14th
    "Open A's Pool": 1,      // Tuesday 14th
    "Open B's Pool": 1,      // Tuesday 14th
    // Unspecified divisions default below
  };

  // Create fixtures for all divisions
  for (const division of divisions) {
    const div = await prisma.division.findUnique({ where: { name: division.name } });
    if (!div) continue;
    // Clear existing fixtures for this division to allow correction
    await prisma.fixture.deleteMany({ where: { divisionId: div.id } });
    // Build team map for this division
    const teamMap: Record<string, number> = {};
    for (const c of colleges) {
      const t = await prisma.team.findUnique({ where: { name_divisionId: { name: c, divisionId: div.id } } });
      if (t) teamMap[c] = t.id;
    }
    // Ensure a placeholder team "N/A" exists for special weeks
    let naTeam = await prisma.team.findUnique({ where: { name_divisionId: { name: 'N/A', divisionId: div.id } } });
    if (!naTeam) {
      naTeam = await prisma.team.create({ data: { name: 'N/A', divisionId: div.id, points: 0 } });
    }
    teamMap['N/A'] = naTeam.id;
    for (const { week, games } of fixtures) {
      const base = getWeekStartDate(week);
      // Apply per-division day offset (default 0 => Monday)
      const dayOffset = divisionDayOffset[division.name] ?? 0;
      const weekDate = new Date(base);
      weekDate.setDate(base.getDate() + dayOffset);
      let naCounter = 0;
      for (const [home, away] of games) {
        if (!teamMap[home] || !teamMap[away]) continue;
        const useNA = week === 10;
        const dateForFixture = new Date(weekDate);
        if (useNA) {
          // Spread placeholders by minute to satisfy unique (divisionId, homeTeamId, awayTeamId, date)
          dateForFixture.setMinutes(dateForFixture.getMinutes() + naCounter);
          naCounter += 1;
        }
        await prisma.fixture.create({
          data: {
            divisionId: div.id,
            homeTeamId: useNA ? teamMap['N/A'] : teamMap[home],
            awayTeamId: useNA ? teamMap['N/A'] : teamMap[away],
            date: dateForFixture,
          },
        });
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 