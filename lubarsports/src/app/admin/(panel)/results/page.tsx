import type { Metadata } from "next";
import Link from "next/link";
import { LeagueChips, WeekNav } from "@/components/filters";
import { EmptyState, Notice } from "@/components/states";
import { overdueFixtures, resultLeagues } from "@/lib/admin-data";
import { requireUser } from "@/lib/auth";
import { DAY_NAMES } from "@/lib/config";
import { formatDateTime, formatLongDay, todayIso, weekForIso } from "@/lib/dates";
import { canEnterResult, isCoordinator } from "@/lib/permissions";
import { defaultWeek, loadCurrentSeason } from "@/lib/season-data";
import { ResultsSheet, type SheetRow } from "./results-sheet";

export const metadata: Metadata = { title: "Results" };

type Props = { searchParams: Promise<{ league?: string; week?: string }> };

export default async function AdminResultsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await requireUser();
  const data = await loadCurrentSeason();
  if (!data) return <EmptyState title="No season yet" />;

  const leagues = resultLeagues(data, user);
  if (leagues.length === 0) return <Notice tone="warning">Your account can&apos;t enter results for any league.</Notice>;

  const today = todayIso();
  const league = leagues.find((l) => l.league.slug === sp.league) ?? leagues[0];
  const weeks = [...new Set(league.fixtures.map((f) => f.week).filter((w): w is number => w !== null))].sort((a, b) => a - b);
  if (weeks.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <p className="eyebrow text-chalk">Season {data.season.name}</p>
          <h1 className="display mt-2 text-4xl">Results</h1>
        </div>
        <EmptyState title="No fixtures yet">
          <p>Results can be entered once the {data.season.name} fixtures have been added.</p>
        </EmptyState>
      </div>
    );
  }
  const requested = Number(sp.week);
  const week = weeks.includes(requested) ? requested : (defaultWeek(data, today) ?? weeks[0]);
  const fixtures = league.fixtures.filter((f) => f.week === week && f.status !== "CANCELLED");
  const overdue = overdueFixtures(data, user, today).filter((f) => f.leagueId === league.league.id);
  const overdueWeeks = [...new Set(overdue.map((f) => f.week!))].sort((a, b) => a - b);

  const rows: SheetRow[] = fixtures.map((f) => ({
    id: f.id,
    date: f.date,
    dateLabel: formatLongDay(f.date),
    home: f.home,
    away: f.away,
    status: f.status,
    editable: canEnterResult(user, f),
    result: f.result
      ? {
          home: f.result.home,
          away: f.result.away,
          details: f.result.details,
          enteredBy: f.result.enteredBy,
          updatedLabel: formatDateTime(f.result.updatedAt),
        }
      : null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-chalk">Season {data.season.name}</p>
          <h1 className="display mt-2 text-4xl">Results</h1>
        </div>
        <Link href={`/leagues/${league.league.slug}`} className="btn btn-sm" target="_blank">
          View public table <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <LeagueChips leagues={leagues.map((l) => l.league)} selected={league.league.slug} path="/admin/results" params={{ week: String(week) }} allLabel={null} />

      <WeekNav
        season={data.season}
        weeks={weeks}
        selected={week}
        current={weekForIso(data.season, today)}
        path="/admin/results"
        params={{ league: league.league.slug, week: String(week) }}
      />

      {overdueWeeks.length > 0 ? (
        <Notice tone="warning">
          <span className="font-semibold">{overdue.length} played {overdue.length === 1 ? "match is" : "matches are"} missing a result</span> in{" "}
          {league.league.name}:{" "}
          {overdueWeeks.map((w, i) => (
            <span key={w}>
              {i > 0 ? ", " : ""}
              <Link href={`/admin/results?league=${league.league.slug}&week=${w}`} className="link">
                week {w}
              </Link>
            </span>
          ))}
          .
        </Notice>
      ) : null}

      <p className="text-[0.875rem] text-muted">
        {league.league.name} &middot; {DAY_NAMES[league.league.matchDay]} nights
        {league.league.framesPerMatch ? <> &middot; {league.league.framesPerMatch} frames a match</> : null}. Points: 1 per frame,
        +{data.season.winBonus} for a win. Type both scores and save; leave a row blank if it hasn&apos;t been played.
        {isCoordinator(user) && user.college ? <> You can edit {user.college}&apos;s fixtures.</> : null}
      </p>

      {rows.length === 0 ? (
        <EmptyState title={`No ${league.league.name} fixtures in week ${week}`} />
      ) : (
        <ResultsSheet rows={rows} framesPerMatch={league.league.framesPerMatch} leagueName={league.league.name} />
      )}
    </div>
  );
}
