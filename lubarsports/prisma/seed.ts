import { PrismaClient } from '@prisma/client';
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

  // Fixture structure (20 weeks, byes handled)
  const fixtures: { week: number, games: [string, string][] }[] = [
    { week: 2, games: [
      ["County", "Furness"], ["Lonsdale", "Cartmel"], ["Grizedale", "Fylde"], ["Pendle", "Bowland"]
    ] },
    { week: 3, games: [
      ["Cartmel", "Pendle"], ["Bowland", "Grizedale"], ["Furness", "Fylde"], ["Pendle", "Graduate"], ["County", "Bowland"]
    ] },
    { week: 4, games: [
      ["County", "Bowland"], ["Grizedale", "Cartmel"], ["Lonsdale", "Pendle"], ["Furness", "Fylde"], ["Pendle", "Graduate"]
    ] },
    { week: 5, games: [
      ["Bowland", "Furness"], ["Graduate", "Grizedale"], ["Cartmel", "County"], ["Fylde", "Bowland"], ["Grizedale", "Lonsdale"]
    ] },
    { week: 6, games: [
      ["Furness", "Cartmel"], ["County", "Graduate"], ["Pendle", "Grizedale"], ["Cartmel", "Fylde"], ["Lonsdale", "County"]
    ] },
    { week: 7, games: [
      ["Bowland", "Fylde"], ["Lonsdale", "Graduate"], ["Pendle", "Furness"], ["Grizedale", "Cartmel"], ["County", "Pendle"]
    ] },
    { week: 8, games: [
      ["Fylde", "Graduate"], ["Furness", "Lonsdale"], ["Grizedale", "County"], ["Graduate", "Bowland"], ["Pendle", "Furness"]
    ] },
    { week: 9, games: [
      ["Lonsdale", "Fylde"], ["Cartmel", "Graduate"], ["Bowland", "Cartmel"], ["County", "Pendle"], ["Pendle", "Furness"]
    ] },
    { week: 10, games: [
      ["Grizedale", "County"], ["Graduate", "Bowland"], ["Pendle", "Furness"], ["Lonsdale", "Fylde"], ["Cartmel", "Furness"]
    ] },
    { week: 11, games: [
      ["Cartmel", "Graduate"], ["Furness", "Grizedale"], ["Bowland", "Lonsdale"], ["Fylde", "Pendle"]
    ] },
    { week: 12, games: [
      ["Furness", "County"], ["Cartmel", "Lonsdale"], ["Fylde", "Grizedale"], ["Bowland", "Pendle"], ["Lonsdale", "Graduate"], ["County", "Fylde"]
    ] },
    { week: 13, games: [
      ["Pendle", "Cartmel"], ["Grizedale", "Bowland"], ["Fylde", "Furness"], ["Graduate", "Pendle"]
    ] },
    { week: 14, games: [
      ["Bowland", "County"], ["Cartmel", "Grizedale"], ["Pendle", "Lonsdale"], ["Furness", "Fylde"], ["Graduate", "Pendle"]
    ] },
    { week: 15, games: [
      ["Furness", "Bowland"], ["Grizedale", "Graduate"], ["County", "Cartmel"], ["Bowland", "Fylde"], ["Lonsdale", "Grizedale"]
    ] },
    { week: 16, games: [
      ["Cartmel", "Furness"], ["Graduate", "County"], ["Grizedale", "Pendle"], ["Fylde", "Cartmel"], ["Bowland", "Fylde"], ["Lonsdale", "Grizedale"]
    ] },
    { week: 17, games: [
      ["Fylde", "Cartmel"], ["County", "Lonsdale"], ["Furness", "Graduate"], ["Cartmel", "Bowland"], ["Pendle", "County"], ["Graduate", "Fylde"], ["Lonsdale", "Furness"]
    ] },
    { week: 18, games: [
      ["County", "Grizedale"], ["Bowland", "Graduate"], ["Furness", "Pendle"], ["Fylde", "Lonsdale"], ["Graduate", "Cartmel"], ["Grizedale", "Furness"], ["Lonsdale", "Bowland"], ["Pendle", "Fylde"]
    ] },
    { week: 19, games: [
      ["County", "Grizedale"], ["Bowland", "Graduate"], ["Furness", "Pendle"], ["Fylde", "Lonsdale"], ["Graduate", "Cartmel"], ["Grizedale", "Furness"], ["Lonsdale", "Bowland"], ["Pendle", "Fylde"]
    ] },
    { week: 20, games: [
      ["Graduate", "Cartmel"], ["Grizedale", "Furness"], ["Lonsdale", "Bowland"], ["Pendle", "Fylde"]
    ] },
  ];

  // Start date for week 2
  function getStartDate() {
    const date = new Date();
    date.setDate(date.getDate() + ((8 - date.getDay()) % 7)); // Next Monday
    date.setHours(12, 0, 0, 0);
    return date;
  }
  const startDate = getStartDate();

  // Create fixtures for all divisions
  for (const division of divisions) {
    const div = await prisma.division.findUnique({ where: { name: division.name } });
    if (!div) continue;
    // Build team map for this division
    const teamMap: Record<string, number> = {};
    for (const c of colleges) {
      const t = await prisma.team.findUnique({ where: { name_divisionId: { name: c, divisionId: div.id } } });
      if (t) teamMap[c] = t.id;
    }
    for (const { week, games } of fixtures) {
      const weekDate = new Date(startDate);
      weekDate.setDate(startDate.getDate() + 7 * (week - 2));
      for (const [home, away] of games) {
        if (!teamMap[home] || !teamMap[away]) continue;
        await prisma.fixture.create({
          data: {
            divisionId: div.id,
            homeTeamId: teamMap[home],
            awayTeamId: teamMap[away],
            date: weekDate,
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