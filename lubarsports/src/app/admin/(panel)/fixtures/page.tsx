import type { Metadata } from "next";
import { LeagueChips, WeekNav } from "@/components/filters";
import { EmptyState } from "@/components/states";
import { requireUser } from "@/lib/auth";
import { addDaysIso, formatShortDay, todayIso, weekForIso, weekStartIso } from "@/lib/dates";
import { defaultWeek, loadCurrentSeason } from "@/lib/season-data";
import { AddFixtureForm, FixtureRow, WeekTools, type EditableFixture } from "./fixture-forms";

export const metadata: Metadata = { title: "Fixtures" };

type Props = { searchParams: Promise<{ league?: string; week?: string }> };

export default async function AdminFixturesPage({ searchParams }: Props) {
  const sp = await searchParams;
  await requireUser({ roles: ["SUPER", "GENERAL"] });
  const data = await loadCurrentSeason();
  if (!data) return <EmptyState title="No season yet" />;

  const today = todayIso();
  const league = data.leagues.find((l) => l.league.slug === sp.league);
  const requested = Number(sp.week);
  const week = data.weeks.includes(requested) ? requested : (defaultWeek(data, today) ?? data.weeks[0] ?? 1);
  const fixtures = data.fixtures.filter((f) => f.week === week && (!league || f.leagueId === league.league.id));
  const teamsFor = (leagueId: number) => data.leagues.find((l) => l.league.id === leagueId)?.teams ?? [];

  const rows: (EditableFixture & { leagueId: number })[] = fixtures.map((f) => ({
    id: f.id,
    leagueId: f.leagueId,
    date: f.date,
    dateLabel: formatShortDay(f.date),
    homeTeamId: f.homeTeamId,
    awayTeamId: f.awayTeamId,
    home: f.home,
    away: f.away,
    status: f.status,
    notes: f.notes,
    score: f.result ? `${f.result.home}–${f.result.away}` : null,
    leagueName: f.leagueName,
  }));

  const counts = {
    total: data.fixtures.length,
    played: data.fixtures.filter((f) => f.result).length,
    postponed: data.fixtures.filter((f) => f.status === "POSTPONED").length,
    cancelled: data.fixtures.filter((f) => f.status === "CANCELLED").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-chalk">Season {data.season.name}</p>
          <h1 className="display mt-2 text-4xl">Fixtures</h1>
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-[0.875rem]">
          {[
            ["Fixtures", counts.total],
            ["Played", counts.played],
            ["Postponed", counts.postponed],
            ["Cancelled", counts.cancelled],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <dt className="text-muted">{k}</dt>
              <dd className="num font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <LeagueChips leagues={data.leagues.map((l) => l.league)} selected={league?.league.slug} path="/admin/fixtures" params={{ week: String(week) }} />
      {data.weeks.length > 0 ? (
        <WeekNav
          season={data.season}
          weeks={data.weeks}
          selected={week}
          current={weekForIso(data.season, today)}
          path="/admin/fixtures"
          params={{ league: league?.league.slug, week: String(week) }}
        />
      ) : null}

      <section aria-labelledby="list-heading">
        <h2 id="list-heading" className="mb-2 text-lg font-bold">
          Week {week}
          {league ? `, ${league.league.name}` : ", all leagues"}
          <span className="ml-2 text-[0.875rem] font-normal text-muted">Select a fixture to edit it.</span>
        </h2>
        {rows.length === 0 ? (
          <p className="card px-5 py-6 text-muted">No fixtures in this week.</p>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden">
            {rows.map((r) => (
              <FixtureRow key={r.id} f={r} teams={teamsFor(r.leagueId)} showLeague={!league} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="mb-2 text-lg font-bold">
          Whole-week changes
        </h2>
        <WeekTools
          seasonId={data.season.id}
          week={week}
          leagues={data.leagues.map((l) => ({ id: l.league.id, name: l.league.name }))}
          selectedLeagueId={league?.league.id}
          suggestedMonday={addDaysIso(weekStartIso(data.season, week), 7)}
        />
      </section>

      <section aria-labelledby="add-heading" className="card p-4 sm:p-5">
        <h2 id="add-heading" className="text-lg font-bold">
          Add a fixture
        </h2>
        <p className="mb-3 text-[0.8125rem] text-muted">For rearranged or extra matches. Its week number is worked out from the date.</p>
        <AddFixtureForm
          seasonId={data.season.id}
          leagues={data.leagues.map((l) => ({ id: l.league.id, name: l.league.name, teams: l.teams }))}
          defaultLeagueId={league?.league.id}
          defaultDate={addDaysIso(weekStartIso(data.season, week), league?.league.matchDay ?? 0)}
        />
      </section>
    </div>
  );
}
