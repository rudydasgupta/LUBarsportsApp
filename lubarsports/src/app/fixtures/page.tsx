import type { Metadata } from "next";
import { LeagueChips, WeekNav } from "@/components/filters";
import { FixtureGrid, FixtureList } from "@/components/fixture-list";
import { EmptyState, PageHeading } from "@/components/states";
import { todayIso, weekForIso } from "@/lib/dates";
import { defaultWeek, loadCurrentSeason } from "@/lib/season-data";

export const metadata: Metadata = { title: "Fixtures" };

type Props = { searchParams: Promise<{ week?: string; league?: string }> };

export default async function FixturesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const data = await loadCurrentSeason();
  if (!data || data.weeks.length === 0) {
    return (
      <>
        <PageHeading title="Fixtures" />
        <EmptyState title="No fixtures yet">
          <p>The fixture list will appear here once it has been published.</p>
        </EmptyState>
      </>
    );
  }

  const today = todayIso();
  const thisWeek = weekForIso(data.season, today);
  const requested = Number(sp.week);
  const week = data.weeks.includes(requested) ? requested : (defaultWeek(data, today) ?? data.weeks[0]);
  const league = data.leagues.some((l) => l.league.slug === sp.league) ? sp.league : undefined;
  const fixtures = data.fixtures.filter((f) => f.week === week && (!league || f.leagueSlug === league));
  const params = { week: String(week), league };

  return (
    <>
      <PageHeading
        eyebrow={`Season ${data.season.name}`}
        title="Fixtures"
        lead="Week by week, across every league. Scores appear as soon as they are entered."
      />
      <div className="space-y-4">
        <LeagueChips leagues={data.leagues.map((l) => l.league)} selected={league} path="/fixtures" params={params} />
        <WeekNav
          season={data.season}
          weeks={data.weeks}
          selected={week}
          current={thisWeek}
          path="/fixtures"
          params={params}
        />
        {league ? (
          <FixtureList fixtures={fixtures} group="date" showLeague={false} empty={`No fixtures in week ${week} for this league.`} />
        ) : (
          <FixtureGrid fixtures={fixtures} empty={`No fixtures in week ${week}.`} />
        )}
      </div>
    </>
  );
}
