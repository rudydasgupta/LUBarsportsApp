import Image from "next/image";
import { PrismaClient } from "@prisma/client";
import { formatDate } from "@/utils/dateFormat";

const prisma = new PrismaClient();

const collegeData = {
  bowland: {
    name: "Bowland",
    logo: "/colleges/bowland.png",
    color: "#d90429",
  },
  cartmel: {
    name: "Cartmel",
    logo: "/colleges/cartmel.png",
    color: "#7a003c",
  },
  county: {
    name: "County",
    logo: "/colleges/county.png",
    color: "#003865",
  },
  furness: {
    name: "Furness",
    logo: "/colleges/furness.png",
    color: "#3d2c91",
  },
  fylde: {
    name: "Fylde",
    logo: "/colleges/fylde.png",
    color: "#ff9900",
  },
  graduate: {
    name: "Graduate",
    logo: "/colleges/graduate.png",
    color: "#b8002e",
  },
  grizedale: {
    name: "Grizedale",
    logo: "/colleges/grizedale.png",
    color: "#005eb8",
  },
  lonsdale: {
    name: "Lonsdale",
    logo: "/colleges/lonsdale.png",
    color: "#003366",
  },
  pendle: {
    name: "Pendle",
    logo: "/colleges/pendle.png",
    color: "#ffb800",
  },
};

async function getUpcomingFixtures(collegeName: string) {
  const currentDate = new Date();
  
  const teams = await prisma.team.findMany({
    where: { name: collegeName },
    include: { division: true }
  });

  if (teams.length === 0) return [] as any[];

  const allFixtures = await prisma.fixture.findMany({
    where: {
      OR: [
        { homeTeamId: { in: teams.map(t => t.id) } },
        { awayTeamId: { in: teams.map(t => t.id) } }
      ],
      date: { gte: currentDate }
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      division: true,
      result: true
    },
    orderBy: { date: 'asc' }
  });

  const fixturesByLeague = new Map<string, any[]>();
  
  allFixtures.forEach(fixture => {
    const divisionName = fixture.division.name;
    if (!fixturesByLeague.has(divisionName)) {
      fixturesByLeague.set(divisionName, []);
    }
    const leagueFixtures = fixturesByLeague.get(divisionName)!;
    if (leagueFixtures.length < 2) {
      leagueFixtures.push(fixture);
    }
  });

  const result: any[] = [];
  for (const leagueFixtures of fixturesByLeague.values()) {
    result.push(...leagueFixtures);
  }
  
  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

async function getLatestResults(collegeName: string) {
  const teams = await prisma.team.findMany({ where: { name: collegeName } });
  if (teams.length === 0) return [] as any[];

  const latest = await prisma.fixture.findMany({
    where: {
      OR: [
        { homeTeamId: { in: teams.map(t => t.id) } },
        { awayTeamId: { in: teams.map(t => t.id) } }
      ],
      result: { isNot: null }
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      division: true,
      result: true
    },
    orderBy: { date: 'desc' },
    take: 5
  });

  return latest;
}

async function getLeagueRanks(collegeName: string) {
  // Get all divisions
  const divisions = await prisma.division.findMany({
    orderBy: { name: 'asc' }
  });

  const leagueRanks = [];

  for (const division of divisions) {
    // Get all teams in this division, ordered by points (descending)
    const teams = await prisma.team.findMany({
      where: { divisionId: division.id },
      orderBy: { points: 'desc' }
    });

    // Find the college's position in this division
    const collegeTeam = teams.find(team => team.name === collegeName);
    if (collegeTeam) {
      const position = teams.findIndex(team => team.id === collegeTeam.id) + 1;
      leagueRanks.push({
        league: division.name,
        rank: position,
        points: collegeTeam.points
      });
    }
  }

  return leagueRanks;
}

export default async function CollegeHomePage({ params }: { params: Promise<{ college: string }> }) {
  const { college: collegeSlug } = await params;
  const college = collegeData[collegeSlug as keyof typeof collegeData];
  if (!college) {
    return <div className="p-8 text-center">College not found.</div>;
  }

  const [upcomingFixtures, latestResults, leagueRanks] = await Promise.all([
    getUpcomingFixtures(college.name),
    getLatestResults(college.name),
    getLeagueRanks(college.name)
  ]);

  return (
    <main className="min-h-screen flex flex-col items-center bg-white text-black p-4">
      <div className="flex flex-col items-center mb-8">
        <Image src={college.logo} alt={`${college.name} logo`} width={96} height={96} className="mb-4" />
        <h1 className="text-4xl font-bold mb-2">{college.name} College</h1>
      </div>
      <section className="w-full max-w-2xl mb-8 bg-gray-100 rounded-lg p-4 text-black">
        <h2 className="text-2xl font-semibold mb-2">League Ranks</h2>
        <table className="min-w-full border border-gray-300 mb-2">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-2 border">League</th>
              <th className="px-4 py-2 border">Rank</th>
              <th className="px-4 py-2 border">Points</th>
            </tr>
          </thead>
          <tbody>
            {leagueRanks.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-2 border text-center text-gray-500">
                  No league data available
                </td>
              </tr>
            ) : (
              leagueRanks.map((rank, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border text-center">{rank.league}</td>
                  <td className="px-4 py-2 border text-center font-semibold">
                    {rank.rank === 1 ? '🥇' : rank.rank === 2 ? '🥈' : rank.rank === 3 ? '🥉' : ''} {rank.rank}
                  </td>
                  <td className="px-4 py-2 border text-center">{rank.points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
      <section className="w-full max-w-2xl mb-8 bg-gray-100 rounded-lg p-4 text-black">
        <h2 className="text-2xl font-semibold mb-2">Next 2 Fixtures (All Leagues)</h2>
        <table className="min-w-full border border-gray-300 mb-2">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Opponent</th>
              <th className="px-4 py-2 border">League</th>
              <th className="px-4 py-2 border">Result</th>
            </tr>
          </thead>
          <tbody>
            {upcomingFixtures.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-2 border text-center text-gray-500">
                  No upcoming fixtures
                </td>
              </tr>
            ) : (
              upcomingFixtures.map((fixture) => {
                const isHome = fixture.homeTeam.name === college.name;
                const opponent = isHome ? fixture.awayTeam.name : fixture.homeTeam.name;
                const venue = isHome ? 'vs' : '@';
                const resultText = fixture.result ? `${fixture.result.homeScore} - ${fixture.result.awayScore}` : '-';
                
                return (
                  <tr key={fixture.id}>
                    <td className="px-4 py-2 border text-center">
                      {formatDate(fixture.date)}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {venue} {opponent}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {fixture.division.name}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {resultText}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
      <section className="w-full max-w-2xl mb-8 bg-gray-100 rounded-lg p-4 text-black">
        <h2 className="text-2xl font-semibold mb-2">Latest Results</h2>
        <table className="min-w-full border border-gray-300 mb-2">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Opponent</th>
              <th className="px-4 py-2 border">Result</th>
              <th className="px-4 py-2 border">League</th>
            </tr>
          </thead>
          <tbody>
            {latestResults.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-2 border text-center text-gray-500">
                  No recent results
                </td>
              </tr>
            ) : (
              latestResults.map((fixture) => {
                const isHome = fixture.homeTeam.name === college.name;
                const opponent = isHome ? fixture.awayTeam.name : fixture.homeTeam.name;
                const venue = isHome ? 'vs' : '@';
                const resultText = fixture.result ? `${fixture.result.homeScore} - ${fixture.result.awayScore}` : '-';
                return (
                  <tr key={fixture.id}>
                    <td className="px-4 py-2 border text-center">{formatDate(fixture.date)}</td>
                    <td className="px-4 py-2 border text-center">{venue} {opponent}</td>
                    <td className="px-4 py-2 border text-center">{resultText}</td>
                    <td className="px-4 py-2 border text-center">{fixture.division.name}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
} 