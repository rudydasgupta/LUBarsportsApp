import { todayIso } from "./dates";
import { canEnterResult, canEnterResultsForSport, type Actor } from "./permissions";
import type { FixtureView, LeagueData, SeasonData } from "./season-data";

/** Leagues this user can enter at least some results in. */
export function resultLeagues(data: SeasonData, user: Actor): LeagueData[] {
  return data.leagues.filter((l) => canEnterResultsForSport(user, l.league.sport));
}

/** Played (date in the past) but no result entered, and not postponed or cancelled. */
export function overdueFixtures(data: SeasonData, user: Actor, today = todayIso()): FixtureView[] {
  return data.fixtures.filter((f) => !f.result && f.status === "SCHEDULED" && f.date < today && canEnterResult(user, f));
}
