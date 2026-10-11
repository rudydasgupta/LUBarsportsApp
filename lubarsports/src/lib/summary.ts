import type { SeasonData } from "./season-data";

export type Champion = {
  league: string;
  leagueSlug: string;
  sport: string;
  team: string;
  points: number;
  played: number;
  /** Most of the league's fixtures were played, so the leader really is the champion. */
  complete: boolean;
};

/** Each league's leader (top of the table), for leagues where matches were played. */
export function champions(data: SeasonData): Champion[] {
  const out: Champion[] = [];
  for (const l of data.leagues) {
    const top = l.standings[0];
    if (!top || top.position !== 1 || top.played === 0) continue;
    const results = l.fixtures.filter((f) => f.result).length;
    const due = l.fixtures.filter((f) => f.status !== "CANCELLED").length;
    out.push({
      league: l.league.name,
      leagueSlug: l.league.slug,
      sport: l.league.sport,
      team: top.team,
      points: top.points,
      played: top.played,
      complete: due > 0 && results / due >= 0.75,
    });
  }
  // Completed leagues first.
  return out.sort((a, b) => Number(b.complete) - Number(a.complete));
}

export function championLabel(c: Champion, finished: boolean): string {
  if (!finished) return `${c.league} leaders`;
  return c.complete ? `${c.league} champions` : `${c.league} · top when play stopped`;
}

export function resultCounts(data: SeasonData) {
  const played = data.fixtures.filter((f) => f.result).length;
  return { played, total: data.fixtures.filter((f) => f.status !== "CANCELLED").length };
}

/** Most recent results first. */
export function latestResults(data: SeasonData, limit: number) {
  return data.fixtures
    .filter((f) => f.result)
    .sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1))
    .slice(0, limit);
}
