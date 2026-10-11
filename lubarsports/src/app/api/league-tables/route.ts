import { NextResponse } from "next/server";
import { loadCurrentSeason } from "@/lib/season-data";

export const dynamic = "force-dynamic";

/** Current season's league tables as JSON. */
export async function GET() {
  const data = await loadCurrentSeason();
  if (!data) return NextResponse.json({ season: null, divisions: [] });
  return NextResponse.json({
    season: data.season.name,
    divisions: data.leagues.map((l) => ({
      id: l.league.id,
      name: l.league.name,
      slug: l.league.slug,
      sport: l.league.sport,
      teams: l.standings.map((r) => ({
        id: r.teamId,
        name: r.team,
        position: r.position,
        played: r.played,
        won: r.won,
        drawn: r.drawn,
        lost: r.lost,
        framesFor: r.for,
        framesAgainst: r.against,
        points: r.points,
      })),
    })),
  });
}
