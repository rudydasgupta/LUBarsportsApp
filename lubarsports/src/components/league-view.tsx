import Link from "next/link";
import { DAY_NAMES } from "@/lib/config";
import { todayIso } from "@/lib/dates";
import type { LeagueData, SeasonInfo } from "@/lib/season-data";
import { FixtureList } from "./fixture-list";
import { MiniTable, StandingsTable } from "./standings-table";
import { Arrow, PageHeading, SectionHeading } from "./states";

export function pointsRuleText(season: SeasonInfo): string {
  const parts = [`1 point per frame won`, `+${season.winBonus} for a win`];
  if (season.drawBonus) parts.push(`+${season.drawBonus} for a draw`);
  return parts.join(", ");
}

/** One league for one season: the table, then results and fixtures. */
export function LeagueView({ data, season, archived }: { data: LeagueData; season: SeasonInfo; archived: boolean }) {
  const today = todayIso();
  const results = data.fixtures.filter((f) => f.result).reverse();
  const upcoming = data.fixtures.filter((f) => !f.result && f.status !== "CANCELLED" && (archived || f.date >= today));
  const overdue = archived ? [] : data.fixtures.filter((f) => !f.result && f.status === "SCHEDULED" && f.date < today);
  const frames = results.reduce((n, f) => n + f.result!.home + f.result!.away, 0);
  const biggest = results.reduce<(typeof results)[number] | null>((best, f) => {
    const m = Math.abs(f.result!.home - f.result!.away);
    return !best || m > Math.abs(best.result!.home - best.result!.away) ? f : best;
  }, null);

  return (
    <>
      <PageHeading
        eyebrow={`${data.league.sport} · ${season.name}${archived ? " · Archive" : ""}`}
        title={data.league.name}
        lead={
          <>
            {DAY_NAMES[data.league.matchDay]} nights
            {data.league.framesPerMatch ? <> &middot; {data.league.framesPerMatch} per match</> : null} &middot;{" "}
            {pointsRuleText(season)}.
          </>
        }
      >
        <Link href={archived ? `/archive/${season.slug}` : "/leagues"} className="btn">
          {archived ? `All ${season.name} tables` : "All leagues"}
        </Link>
      </PageHeading>

      <dl className="mb-6 grid grid-cols-3 gap-3">
        <div className="card px-4 py-3">
          <dt className="eyebrow text-[0.5625rem] text-muted">Results</dt>
          <dd className="num mt-1 text-2xl font-semibold">
            {results.length}
            <span className="text-base text-muted">/{data.fixtures.length}</span>
          </dd>
        </div>
        <div className="card px-4 py-3">
          <dt className="eyebrow text-[0.5625rem] text-muted">Frames played</dt>
          <dd className="num mt-1 text-2xl font-semibold">{frames}</dd>
        </div>
        <div className="card min-w-0 px-4 py-3">
          <dt className="eyebrow text-[0.5625rem] text-muted">Biggest win</dt>
          <dd className="num mt-1 truncate text-2xl font-semibold">
            {biggest ? `${Math.max(biggest.result!.home, biggest.result!.away)}–${Math.min(biggest.result!.home, biggest.result!.away)}` : "–"}
          </dd>
          {biggest ? (
            <dd className="truncate text-[0.8125rem] text-muted">
              {biggest.result!.home >= biggest.result!.away ? biggest.home : biggest.away} v{" "}
              {biggest.result!.home >= biggest.result!.away ? biggest.away : biggest.home}
            </dd>
          ) : null}
        </div>
      </dl>

      <section aria-labelledby="table-heading" className="mb-12">
        <h2 id="table-heading" className="sr-only">
          Table
        </h2>
        <StandingsTable rows={data.standings} adjustments={data.adjustments} label={`${data.league.name} table, ${season.name}`} />
        <p className="mt-2 text-[0.8125rem] text-muted">
          Ordered by points, then frame difference, then frames won. F and A are frames (or legs, or games) won and lost.
        </p>
      </section>

      {overdue.length > 0 ? (
        <section aria-labelledby="overdue-heading" className="mb-12">
          <SectionHeading id="overdue-heading" eyebrow="Awaiting results" title="Played, not yet reported" />
          <FixtureList fixtures={overdue} group="none" showLeague={false} />
        </section>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="results-heading" className={`min-w-0 ${archived ? "lg:col-span-2" : ""}`}>
          <SectionHeading id="results-heading" eyebrow="Latest first" title="Results" />
          <FixtureList fixtures={results} group="date" showLeague={false} columns={archived ? 2 : 1} empty="No results yet." />
        </section>
        {!archived ? (
          <section aria-labelledby="fixtures-heading" className="min-w-0">
            <SectionHeading id="fixtures-heading" eyebrow="Soonest first" title="Fixtures" />
            <FixtureList fixtures={upcoming} group="date" showLeague={false} empty="No fixtures left this season." />
          </section>
        ) : null}
      </div>
    </>
  );
}

/** Every league's table for a season, as cards linking to the full tables. */
export function LeagueGrid({ leagues, base }: { leagues: LeagueData[]; base: string }) {
  const sports = [...new Set(leagues.map((l) => l.league.sport))];
  return (
    <div className="space-y-10">
      {sports.map((sport) => (
        <section key={sport} id={sport.toLowerCase()} aria-labelledby={`${sport}-heading`} className="scroll-mt-28">
          <SectionHeading id={`${sport}-heading`} eyebrow={sport} title={sport === "Dominoes" ? "Dominoes" : `${sport} leagues`} />
          <ul className="grid gap-4 md:grid-cols-2">
            {leagues
              .filter((l) => l.league.sport === sport)
              .map((l) => (
                <li key={l.league.id} className="card flex flex-col p-4 sm:p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-lg font-bold">{l.league.name}</h3>
                    <span className="text-[0.8125rem] text-muted">
                      {l.fixtures.filter((f) => f.result).length} of {l.fixtures.length} played
                    </span>
                  </div>
                  <div className="mt-2 flex-1">
                    <MiniTable rows={l.standings} limit={9} />
                  </div>
                  <Link href={`${base}/${l.league.slug}`} className="btn mt-4 self-start">
                    Full table and results
                    <Arrow />
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
