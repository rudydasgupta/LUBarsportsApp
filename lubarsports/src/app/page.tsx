import Link from "next/link";
import type { ReactNode } from "react";
import { Announcements } from "@/components/announcements";
import { Crest } from "@/components/crest";
import { FixtureGrid, FixtureList } from "@/components/fixture-list";
import { LogoMark } from "@/components/logo";
import { MiniTable } from "@/components/standings-table";
import { Arrow, EmptyState, SectionHeading } from "@/components/states";
import { getLiveAnnouncements } from "@/lib/announcements";
import { COLLEGES, site } from "@/lib/config";
import { formatLongDay, formatShortDay, formatWeekRange, todayIso, weekStartIso } from "@/lib/dates";
import {
  defaultWeek,
  getArchivedSeasons,
  loadCurrentSeason,
  loadSeason,
  seasonPhase,
  type SeasonData,
  type SeasonPhase,
} from "@/lib/season-data";
import { championLabel, champions, latestResults, resultCounts } from "@/lib/summary";

export default async function HomePage() {
  const [data, announcements, archived] = await Promise.all([
    loadCurrentSeason(),
    getLiveAnnouncements(),
    getArchivedSeasons(),
  ]);

  if (!data) {
    return (
      <EmptyState title="No season yet">
        <p>Once an admin creates a season, league tables and fixtures will appear here.</p>
      </EmptyState>
    );
  }

  const today = todayIso();
  const phase = seasonPhase(data, today);
  const week = defaultWeek(data, today);
  const weekFixtures = week ? data.fixtures.filter((f) => f.week === week) : [];
  const latest = latestResults(data, 6);
  const previous = archived[0] ? await loadSeason(archived[0].id) : null;
  const pastChampions = previous ? champions(previous) : [];

  return (
    <div className="space-y-12">
      <Hero data={data} phase={phase} week={week} weekFixtures={weekFixtures.length} />

      <Announcements items={announcements} />

      <section aria-labelledby="week-heading">
        <SectionHeading
          id="week-heading"
          eyebrow={week ? `Week ${week} · ${formatWeekRange(weekStartIso(data.season, week))}` : "Fixtures"}
          title={phase.kind === "during" ? "This week" : phase.kind === "after" ? "Final week" : "Up next"}
          action={
            <Link href="/fixtures" className="btn">
              All fixtures
              <Arrow />
            </Link>
          }
        />
        <FixtureGrid
          fixtures={weekFixtures}
          empty={data.fixtures.length === 0 ? `The ${data.season.name} fixture list will be published here soon.` : "No fixtures this week."}
        />
      </section>

      <section aria-labelledby="tables-heading">
        <SectionHeading
          id="tables-heading"
          eyebrow={`${data.leagues.length} leagues · ${data.season.name}`}
          title="League tables"
          action={
            <Link href="/leagues" className="btn">
              Full tables
              <Arrow />
            </Link>
          }
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.leagues.map((l) => {
            const played = l.fixtures.filter((f) => f.result).length;
            return (
              <li key={l.league.id}>
                <Link
                  href={`/leagues/${l.league.slug}`}
                  className="card group flex h-full flex-col p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow text-[0.5625rem] text-chalk">{l.league.sport}</p>
                      <h3 className="mt-1 text-lg font-bold leading-tight">{l.league.name}</h3>
                    </div>
                    <span className="num rounded-md border border-line px-2 py-0.5 text-[0.75rem] text-muted">
                      {played}/{l.fixtures.length}
                      <span className="sr-only"> results</span>
                    </span>
                  </div>
                  <div className="mt-3 flex-1">
                    <MiniTable rows={l.standings} links={false} />
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-chalk">
                    Table and fixtures <Arrow className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="results-heading" className="min-w-0">
          <SectionHeading
            id="results-heading"
            eyebrow="Latest results"
            title="Off the table"
            action={
              <Link href="/results" className="link text-sm font-semibold">
                All results
              </Link>
            }
          />
          <FixtureList
            fixtures={latest}
            group="none"
            empty={
              phase.kind === "before" && phase.firstDate
                ? `No results yet. The season starts ${formatLongDay(phase.firstDate)}.`
                : "No results yet."
            }
          />
        </section>

        <section aria-labelledby="champions-heading" className="min-w-0">
          <SectionHeading
            id="champions-heading"
            eyebrow={previous ? `${previous.season.name} season` : "Archive"}
            title="Reigning champions"
            action={
              previous ? (
                <Link href={`/archive/${previous.season.slug}`} className="link text-sm font-semibold">
                  Final tables
                </Link>
              ) : undefined
            }
          />
          {pastChampions.length === 0 ? (
            <p className="card px-5 py-6 text-muted">Champions appear here once a season has been archived.</p>
          ) : (
            <ul className="card divide-y divide-line">
              {pastChampions.map((c) => (
                <li key={c.leagueSlug} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  {c.complete ? <Trophy /> : <span aria-hidden="true" className="size-9 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.team}</p>
                    <p className="truncate text-[0.8125rem] text-muted">{championLabel(c, true)}</p>
                  </div>
                  <Crest college={c.team} size="sm" />
                  <span className="num w-12 text-right text-[0.8125rem] text-muted">
                    {c.points}
                    <span className="sr-only"> points</span> pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="colleges-heading">
        <SectionHeading
          id="colleges-heading"
          eyebrow="Nine colleges"
          title="Pick your college"
          action={<p className="max-w-sm text-sm text-muted">League positions, fixtures and results for every team.</p>}
        />
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {COLLEGES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/colleges/${c.slug}`}
                className="card group relative flex h-full flex-col items-center gap-2 overflow-hidden px-2 pb-3 pt-4 text-center transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: c.color }} />
                <Crest college={c.name} size="lg" className="transition-transform duration-300 group-hover:scale-105" />
                <span className="text-sm font-bold">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Hero({ data, phase, week, weekFixtures }: { data: SeasonData; phase: SeasonPhase; week: number | null; weekFixtures: number }) {
  const counts = resultCounts(data);
  const status =
    phase.kind === "during"
      ? { label: "Live", value: `Week ${phase.week}` }
      : phase.kind === "before"
        ? { label: "Season starts", value: phase.firstDate ? formatShortDay(phase.firstDate) : "Soon" }
        : phase.kind === "break"
          ? { label: "Christmas break", value: phase.nextWeek ? `Back week ${phase.nextWeek}` : "Back soon" }
          : { label: "Season", value: "Complete" };

  return (
    <section aria-labelledby="hero-heading" className="card-glow sweep overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--grid)_1px,transparent_1px),linear-gradient(90deg,var(--grid)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]"
      />
      <div className="relative grid items-center gap-8 px-5 pb-6 pt-8 sm:px-10 sm:pt-12 md:grid-cols-[1fr_auto]">
        <div className="max-w-xl">
          <p className="eyebrow flex items-center gap-2 text-chalk">
            <span aria-hidden="true" className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#ff3b52] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#ff3b52]" />
            </span>
            Lancaster University &middot; {status.label}
          </p>
          <h1 id="hero-heading" className="display mt-4 text-[3rem] sm:text-7xl">
            {site.name}
            <span className="block bg-[linear-gradient(95deg,#ff3b52,#c8102e_55%,#8f0f18)] bg-clip-text pb-1 text-transparent">
              {data.season.name}
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-muted">
            Pool, darts and dominoes across all nine colleges. Every league table, fixture and result in one place,
            updated the moment the scores come in.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/leagues" className="btn btn-primary min-h-11 px-5 text-[0.9375rem]">
              League tables
              <Arrow />
            </Link>
            <Link href="/fixtures" className="btn min-h-11 px-5 text-[0.9375rem]">
              {phase.kind === "during" ? "This week's fixtures" : "Fixtures"}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto hidden size-64 items-center justify-center md:flex lg:size-72" aria-hidden="true">
          <div className="halo absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(232,24,52,0.5),transparent_68%)] blur-2xl" />
          <svg viewBox="0 0 200 200" className="orbit absolute inset-0 size-full text-[#ff3b52]">
            <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.6" strokeDasharray="2 6" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.8" strokeDasharray="40 18 4 18" />
          </svg>
          <svg viewBox="0 0 200 200" className="orbit-reverse absolute inset-0 size-full text-ink">
            <circle cx="100" cy="100" r="83" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.6" />
            {[0, 90, 180, 270].map((a) => (
              <rect key={a} x="99" y="14" width="2" height="7" rx="1" fill="#ff3b52" transform={`rotate(${a} 100 100)`} />
            ))}
          </svg>
          <LogoMark priority className="relative h-[74%] w-auto drop-shadow-[0_12px_30px_rgba(0,0,0,0.5)]" />
        </div>
      </div>

      <dl className="relative grid grid-cols-2 border-t border-line sm:grid-cols-4 sm:divide-x sm:divide-line [&>div:nth-child(-n+2)]:border-b [&>div:nth-child(-n+2)]:border-line sm:[&>div:nth-child(-n+2)]:border-b-0">
        <Stat label={status.label} value={status.value} />
        <Stat label={week ? `Week ${week} fixtures` : "Fixtures"} value={String(weekFixtures)} />
        <Stat
          label="Results in"
          value={String(counts.played)}
          sub={`of ${counts.total} fixtures`}
        />
        <Stat label="Leagues" value={String(data.leagues.length)} sub="Pool · Darts · Dominoes" />
      </dl>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="px-5 py-4 sm:px-6">
      <dt className="eyebrow text-[0.625rem] text-muted">{label}</dt>
      <dd className="num mt-1.5 truncate text-[1.5rem] font-semibold leading-none sm:text-[1.75rem]">{value}</dd>
      {sub ? <dd className="mt-1.5 truncate text-[0.8125rem] text-muted">{sub}</dd> : null}
    </div>
  );
}

function Trophy() {
  return (
    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(160deg,#ff3b52,#b8141f_60%,#7a0b14)] text-white shadow-[0_6px_18px_-6px_rgba(232,24,52,0.7)]">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a2 2 0 0 0 2 4h1M16 6h3a2 2 0 0 1-2 4h-1M12 13v4M8.5 20h7M10 17h4" />
      </svg>
    </span>
  );
}
