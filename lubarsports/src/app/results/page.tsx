import type { Metadata } from "next";
import Link from "next/link";
import { LeagueChips } from "@/components/filters";
import { FixtureList } from "@/components/fixture-list";
import { EmptyState, PageHeading } from "@/components/states";
import { formatWeekRange, weekStartIso } from "@/lib/dates";
import { getArchivedSeasons, loadCurrentSeason } from "@/lib/season-data";

export const metadata: Metadata = { title: "Results" };

type Props = { searchParams: Promise<{ league?: string }> };

export default async function ResultsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [data, archived] = await Promise.all([loadCurrentSeason(), getArchivedSeasons()]);
  if (!data) return <EmptyState title="No season yet" />;

  const league = data.leagues.some((l) => l.league.slug === sp.league) ? sp.league : undefined;
  const results = data.fixtures
    .filter((f) => f.result && (!league || f.leagueSlug === league))
    .sort((a, b) => (a.date === b.date ? a.leagueId - b.leagueId : a.date < b.date ? 1 : -1));

  const byWeek = new Map<number, typeof results>();
  for (const f of results) {
    const w = f.week ?? 0;
    if (!byWeek.has(w)) byWeek.set(w, []);
    byWeek.get(w)!.push(f);
  }

  return (
    <>
      <PageHeading
        eyebrow={`Season ${data.season.name}`}
        title="Results"
        lead={`${results.length} ${results.length === 1 ? "result" : "results"} so far${league ? " in this league" : ""}, most recent first.`}
      />
      <div className="space-y-6">
        <LeagueChips leagues={data.leagues.map((l) => l.league)} selected={league} path="/results" params={{ league }} />
        {results.length === 0 ? (
          <EmptyState title="No results yet">
            <p>
              Results appear here as soon as they are entered.
              {archived[0] ? (
                <>
                  {" "}
                  Looking for last season?{" "}
                  <Link href={`/archive/${archived[0].slug}`} className="link">
                    See the {archived[0].name} archive
                  </Link>
                  .
                </>
              ) : null}
            </p>
          </EmptyState>
        ) : (
          [...byWeek.entries()].map(([week, items]) => (
            <section key={week} aria-labelledby={`week-${week}`}>
              <h2 id={`week-${week}`} className="mb-3 flex items-baseline gap-3">
                <span className="display text-2xl">Week {week}</span>
                <span className="num text-[0.8125rem] text-muted">{formatWeekRange(weekStartIso(data.season, week))}</span>
              </h2>
              <FixtureList fixtures={items} group={league ? "none" : "league"} showLeague={!league} />
            </section>
          ))
        )}
      </div>
    </>
  );
}
