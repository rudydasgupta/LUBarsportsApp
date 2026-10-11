import Link from "next/link";
import { FIXTURE_STATUS_LABEL } from "@/lib/config";
import { formatLongDay, formatShortDay } from "@/lib/dates";
import type { FixtureView } from "@/lib/season-data";
import { CollegeName } from "./crest";

/** Score, or what is happening instead of one. */
function Middle({ f, perspective }: { f: FixtureView; perspective?: string }) {
  if (f.result) {
    const { home, away } = f.result;
    let tone = "border-line-strong";
    if (perspective) {
      const own = f.home === perspective ? home : away;
      const other = f.home === perspective ? away : home;
      tone = own > other ? "border-win bg-win-wash" : own < other ? "border-loss bg-loss-wash" : "border-line-strong bg-raised";
    }
    return (
      <span className={`num inline-flex min-w-[4.25rem] items-center justify-center rounded-md border px-2 py-1 text-[1.0625rem] font-bold ${tone}`}>
        <span className={home > away ? "" : "opacity-60"}>{home}</span>
        <span className="mx-1.5 opacity-40">&ndash;</span>
        <span className={away > home ? "" : "opacity-60"}>{away}</span>
        <span className="sr-only">
          {" "}
          ({f.home} {home}, {f.away} {away})
        </span>
      </span>
    );
  }
  if (f.status === "POSTPONED" || f.status === "CANCELLED") {
    return <span className="tag border-cue text-cue">{FIXTURE_STATUS_LABEL[f.status]}</span>;
  }
  return <span className="eyebrow min-w-[4.25rem] text-center text-[0.625rem] text-muted">vs</span>;
}

function FixtureRow({ f, showLeague, showDate, highlight }: { f: FixtureView; showLeague: boolean; showDate: boolean; highlight?: string }) {
  return (
    <li className="px-3 py-3 sm:px-5">
      {showLeague || showDate ? (
        <p className="mb-1.5 flex flex-wrap items-center gap-x-2 text-[0.75rem] text-muted">
          {showLeague ? (
            <Link href={`/leagues/${f.leagueSlug}`} className="font-semibold text-chalk hover:underline">
              {f.leagueName}
            </Link>
          ) : null}
          {showLeague && showDate ? <span aria-hidden="true">&middot;</span> : null}
          {showDate ? <span>{formatShortDay(f.date)}</span> : null}
          {f.week ? (
            <>
              <span aria-hidden="true">&middot;</span>
              <span>Week {f.week}</span>
            </>
          ) : null}
        </p>
      ) : null}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
        <div className="flex min-w-0 justify-end">
          <CollegeName college={f.home} className="flex-row-reverse text-right" bold={highlight === f.home} />
        </div>
        <Middle f={f} perspective={highlight} />
        <div className="flex min-w-0">
          <CollegeName college={f.away} bold={highlight === f.away} />
        </div>
      </div>
      {f.result?.details || f.notes ? (
        <p className="mx-auto mt-2 max-w-xl whitespace-pre-line text-center text-[0.8125rem] text-muted">
          {f.result?.details ?? f.notes}
        </p>
      ) : null}
    </li>
  );
}

/** A week's fixtures as one compact card per league. */
export function FixtureGrid({ fixtures, empty = "No fixtures." }: { fixtures: FixtureView[]; empty?: string }) {
  if (fixtures.length === 0) return <p className="card px-5 py-6 text-muted">{empty}</p>;
  const byLeague = new Map<string, FixtureView[]>();
  for (const f of fixtures) {
    if (!byLeague.has(f.leagueSlug)) byLeague.set(f.leagueSlug, []);
    byLeague.get(f.leagueSlug)!.push(f);
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[...byLeague.entries()].map(([slug, items]) => {
        const dates = [...new Set(items.map((f) => f.date))];
        const done = items.filter((f) => f.result).length;
        return (
          <li key={slug} className="card flex flex-col">
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
              <div className="min-w-0">
                <Link href={`/leagues/${slug}`} className="block truncate font-bold hover:text-chalk">
                  {items[0].leagueName}
                </Link>
                <p className="text-[0.75rem] text-muted">{dates.map((d) => formatShortDay(d)).join(", ")}</p>
              </div>
              <span
                className={`num shrink-0 rounded-md px-2 py-0.5 text-[0.75rem] font-semibold ${
                  done === items.length ? "bg-win-wash text-win" : "border border-line text-muted"
                }`}
              >
                {done}/{items.length}
                <span className="sr-only"> results in</span>
              </span>
            </div>
            <ul className="divide-y divide-line">
              {items.map((f) => (
                <li key={f.id} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2.5">
                  <div className="flex min-w-0 justify-end">
                    <CollegeName college={f.home} size="xs" className="flex-row-reverse text-right text-[0.9375rem]" />
                  </div>
                  <Middle f={f} />
                  <div className="flex min-w-0">
                    <CollegeName college={f.away} size="xs" className="text-[0.9375rem]" />
                  </div>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Fixtures and results. Grouped by match day, by league, or not at all.
 */
export function FixtureList({
  fixtures,
  group = "date",
  showLeague = true,
  highlight,
  empty = "No fixtures.",
  columns = 1,
}: {
  fixtures: FixtureView[];
  group?: "date" | "league" | "none";
  /** Lay groups out in two columns on wide screens. */
  columns?: 1 | 2;
  showLeague?: boolean;
  /** A college whose results are coloured win/loss and whose name is bold. */
  highlight?: string;
  empty?: string;
}) {
  if (fixtures.length === 0) return <p className="card px-5 py-6 text-muted">{empty}</p>;

  if (group === "none") {
    return (
      <ul className="card divide-y divide-line">
        {fixtures.map((f) => (
          <FixtureRow key={f.id} f={f} showLeague={showLeague} showDate highlight={highlight} />
        ))}
      </ul>
    );
  }

  const groups = new Map<string, { title: string; href?: string; items: FixtureView[] }>();
  for (const f of fixtures) {
    const key = group === "date" ? f.date : f.leagueSlug;
    if (!groups.has(key)) {
      groups.set(key, {
        title: group === "date" ? formatLongDay(f.date) : f.leagueName,
        href: group === "league" ? `/leagues/${f.leagueSlug}` : undefined,
        items: [],
      });
    }
    groups.get(key)!.items.push(f);
  }

  return (
    <div className={columns === 2 ? "grid items-start gap-5 lg:grid-cols-2" : "space-y-5"}>
      {[...groups.entries()].map(([key, g]) => (
        <section key={key} aria-label={g.title}>
          <h3 className="eyebrow mb-2 flex items-center gap-2 text-[0.6875rem] text-muted">
            {g.href ? (
              <Link href={g.href} className="hover:text-ink">
                {g.title}
              </Link>
            ) : (
              g.title
            )}
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
            <span className="num normal-case tracking-normal">
              {g.items.filter((f) => f.result).length}/{g.items.length}
              <span className="sr-only"> results in</span>
            </span>
          </h3>
          <ul className="card divide-y divide-line">
            {g.items.map((f) => (
              <FixtureRow
                key={f.id}
                f={f}
                showLeague={showLeague && group !== "league"}
                showDate={group !== "date"}
                highlight={highlight}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
