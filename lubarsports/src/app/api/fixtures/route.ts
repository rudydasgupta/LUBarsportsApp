import { NextResponse } from "next/server";
import { loadCurrentSeason } from "@/lib/season-data";

export const dynamic = "force-dynamic";

/** Current season's fixtures and results as JSON. */
export async function GET() {
  const data = await loadCurrentSeason();
  if (!data) return NextResponse.json({ season: null, fixtures: [] });
  return NextResponse.json({
    season: data.season.name,
    fixtures: data.fixtures.map((f) => ({
      id: f.id,
      week: f.week,
      date: f.date,
      division: f.leagueName,
      status: f.status,
      homeTeam: { name: f.home },
      awayTeam: { name: f.away },
      result: f.result ? { homeScore: f.result.home, awayScore: f.result.away, details: f.result.details } : null,
    })),
  });
}
