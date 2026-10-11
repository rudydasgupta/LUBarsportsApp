import { cache } from "react";
import { PLACEHOLDER_TEAM } from "./config";
import { db } from "./db";
import { londonIso, mondayOf, todayIso, weekForIso } from "./dates";
import { computeStandings, type StandingRow } from "./standings";

/* --------------------------------------------------------------------------
   Plain, serialisable shapes shared by pages and components.
   ----------------------------------------------------------------------- */

export type SeasonInfo = {
  id: number;
  name: string;
  slug: string;
  status: string;
  isCurrent: boolean;
  michaelmasStart: string;
  lentStart: string;
  winBonus: number;
  drawBonus: number;
  notes: string | null;
};

export type LeagueInfo = {
  id: number;
  name: string;
  slug: string;
  sport: string;
  matchDay: number;
  framesPerMatch: number | null;
  sortOrder: number;
  active: boolean;
};

export type FixtureView = {
  id: number;
  week: number | null;
  /** London calendar date, YYYY-MM-DD. */
  date: string;
  leagueId: number;
  leagueSlug: string;
  leagueName: string;
  sport: string;
  homeTeamId: number;
  awayTeamId: number;
  home: string;
  away: string;
  status: string;
  notes: string | null;
  result: { home: number; away: number; details: string | null; enteredBy: string | null; updatedAt: string } | null;
};

export type AdjustmentView = {
  id: number;
  leagueId: number;
  teamId: number;
  team: string;
  points: number;
  reason: string;
  createdBy: string | null;
  createdAt: string;
};

export type LeagueData = {
  league: LeagueInfo;
  teams: { id: number; name: string }[];
  fixtures: FixtureView[];
  adjustments: AdjustmentView[];
  standings: StandingRow[];
};

export type SeasonData = {
  season: SeasonInfo;
  leagues: LeagueData[];
  fixtures: FixtureView[];
  weeks: number[];
};

function toSeasonInfo(s: {
  id: number;
  name: string;
  slug: string;
  status: string;
  isCurrent: boolean;
  michaelmasStart: Date;
  lentStart: Date;
  winBonus: number;
  drawBonus: number;
  notes: string | null;
}): SeasonInfo {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    status: s.status,
    isCurrent: s.isCurrent,
    michaelmasStart: londonIso(s.michaelmasStart),
    lentStart: londonIso(s.lentStart),
    winBonus: s.winBonus,
    drawBonus: s.drawBonus,
    notes: s.notes,
  };
}

/* --------------------------------------------------------------------------
   Loaders (memoised per request)
   ----------------------------------------------------------------------- */

export const getSeasons = cache(async (): Promise<SeasonInfo[]> => {
  const seasons = await db.season.findMany({ orderBy: { michaelmasStart: "desc" } });
  return seasons.map(toSeasonInfo);
});

export const getCurrentSeason = cache(async (): Promise<SeasonInfo | null> => {
  const seasons = await getSeasons();
  return seasons.find((s) => s.isCurrent) ?? seasons.find((s) => s.status === "ACTIVE") ?? seasons[0] ?? null;
});

export const getSeasonBySlug = cache(async (slug: string): Promise<SeasonInfo | null> => {
  const seasons = await getSeasons();
  return seasons.find((s) => s.slug === slug) ?? null;
});

export const getArchivedSeasons = cache(async (): Promise<SeasonInfo[]> => {
  const [seasons, current] = await Promise.all([getSeasons(), getCurrentSeason()]);
  return seasons.filter((s) => s.id !== current?.id && s.status !== "UPCOMING");
});

export const getLeagues = cache(async (): Promise<LeagueInfo[]> => {
  return db.division.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      sport: true,
      matchDay: true,
      framesPerMatch: true,
      sortOrder: true,
      active: true,
    },
  });
});

export const loadSeason = cache(async (seasonId: number): Promise<SeasonData | null> => {
  const [seasonRow, leagues, teams, fixtureRows, adjustmentRows] = await Promise.all([
    db.season.findUnique({ where: { id: seasonId } }),
    getLeagues(),
    db.team.findMany({
      where: { name: { not: PLACEHOLDER_TEAM } },
      select: { id: true, name: true, divisionId: true },
      orderBy: { name: "asc" },
    }),
    db.fixture.findMany({
      where: { seasonId, status: { not: "VOID" } },
      include: { result: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    }),
    db.pointsAdjustment.findMany({
      where: { seasonId },
      include: { team: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!seasonRow) return null;
  const season = toSeasonInfo(seasonRow);
  const leagueById = new Map(leagues.map((l) => [l.id, l]));

  const fixtures: FixtureView[] = [];
  for (const f of fixtureRows) {
    const league = leagueById.get(f.divisionId);
    if (!league) continue;
    const date = londonIso(f.date);
    fixtures.push({
      id: f.id,
      week: f.week ?? weekForIso(season, date),
      date,
      leagueId: league.id,
      leagueSlug: league.slug,
      leagueName: league.name,
      sport: league.sport,
      homeTeamId: f.homeTeamId,
      awayTeamId: f.awayTeamId,
      home: f.homeTeam.name,
      away: f.awayTeam.name,
      status: f.status,
      notes: f.notes,
      result: f.result
        ? {
            home: f.result.homeScore,
            away: f.result.awayScore,
            details: f.result.details?.trim() || null,
            enteredBy: f.result.enteredBy,
            updatedAt: f.result.updatedAt.toISOString(),
          }
        : null,
    });
  }

  const adjustments: AdjustmentView[] = adjustmentRows.map((a) => ({
    id: a.id,
    leagueId: a.divisionId,
    teamId: a.teamId,
    team: a.team.name,
    points: a.points,
    reason: a.reason,
    createdBy: a.createdBy,
    createdAt: a.createdAt.toISOString(),
  }));

  // A season shows the leagues it has fixtures in. A season with no
  // fixtures yet shows every active league.
  const withFixtures = new Set(fixtures.map((f) => f.leagueId));
  const shown = leagues.filter((l) => (withFixtures.size ? withFixtures.has(l.id) : l.active));

  const rule = { winBonus: season.winBonus, drawBonus: season.drawBonus };
  const leagueData: LeagueData[] = shown.map((league) => {
    const leagueTeams = teams.filter((t) => t.divisionId === league.id).map(({ id, name }) => ({ id, name }));
    const leagueFixtures = fixtures.filter((f) => f.leagueId === league.id);
    const leagueAdjustments = adjustments.filter((a) => a.leagueId === league.id);
    return {
      league,
      teams: leagueTeams,
      fixtures: leagueFixtures,
      adjustments: leagueAdjustments,
      standings: computeStandings({
        teams: leagueTeams,
        fixtures: leagueFixtures.map((f) => ({
          homeTeamId: f.homeTeamId,
          awayTeamId: f.awayTeamId,
          date: f.date,
          status: f.status,
          result: f.result ? { home: f.result.home, away: f.result.away } : null,
        })),
        adjustments: leagueAdjustments,
        rule,
      }),
    };
  });

  const weeks = [...new Set(fixtures.map((f) => f.week).filter((w): w is number => w !== null))].sort((a, b) => a - b);
  return { season, leagues: leagueData, fixtures, weeks };
});

export const loadCurrentSeason = cache(async (): Promise<SeasonData | null> => {
  const season = await getCurrentSeason();
  return season ? loadSeason(season.id) : null;
});

/* --------------------------------------------------------------------------
   Season calendar helpers
   ----------------------------------------------------------------------- */

export type SeasonPhase =
  | { kind: "before"; firstDate: string | null }
  | { kind: "during"; week: number }
  | { kind: "break"; nextWeek: number | null }
  | { kind: "after" };

export function seasonPhase(data: SeasonData, today = todayIso()): SeasonPhase {
  const first = data.fixtures[0]?.date ?? null;
  const last = data.fixtures[data.fixtures.length - 1]?.date ?? null;
  if (!first || !last || today < mondayOf(first)) return { kind: "before", firstDate: first };
  if (today > last) return { kind: "after" };
  const week = weekForIso(data.season, today);
  if (week === null) return { kind: "break", nextWeek: data.weeks.find((w) => w > 10) ?? null };
  return { kind: "during", week };
}

/** The week to show by default: this week, else the next week with fixtures, else the last. */
export function defaultWeek(data: SeasonData, today = todayIso()): number | null {
  if (data.weeks.length === 0) return null;
  const week = weekForIso(data.season, today);
  if (week !== null && data.weeks.includes(week)) return week;
  const upcoming = data.fixtures.find((f) => f.date >= today && f.week !== null);
  if (upcoming?.week != null) return upcoming.week;
  return data.weeks[data.weeks.length - 1];
}

export function lastWeek(data: SeasonData): number | null {
  return data.weeks.length ? data.weeks[data.weeks.length - 1] : null;
}
