import Link from "next/link";
import { formatWeekRange, weekStartIso } from "@/lib/dates";
import type { LeagueInfo, SeasonInfo } from "@/lib/season-data";

type Params = Record<string, string | undefined>;

export function hrefWith(path: string, params: Params, change: Params): string {
  const merged = { ...params, ...change };
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

/** League filter as a row of chips. "All" clears the filter. */
export function LeagueChips({
  leagues,
  selected,
  path,
  params,
  allLabel = "All leagues",
}: {
  leagues: LeagueInfo[];
  selected: string | undefined;
  path: string;
  params: Params;
  allLabel?: string | null;
}) {
  return (
    <nav aria-label="League" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:px-0">
      {allLabel ? (
        <Link href={hrefWith(path, params, { league: undefined })} className="chip" aria-current={!selected ? "page" : undefined}>
          {allLabel}
        </Link>
      ) : null}
      {leagues.map((l) => (
        <Link
          key={l.slug}
          href={hrefWith(path, params, { league: l.slug })}
          className="chip"
          aria-current={selected === l.slug ? "page" : undefined}
        >
          {l.name}
        </Link>
      ))}
    </nav>
  );
}

/** Previous / next week buttons and a strip of every week in the season. */
export function WeekNav({
  season,
  weeks,
  selected,
  current,
  path,
  params,
}: {
  season: SeasonInfo;
  weeks: number[];
  selected: number;
  current: number | null;
  path: string;
  params: Params;
}) {
  const i = weeks.indexOf(selected);
  const prev = i > 0 ? weeks[i - 1] : null;
  const next = i >= 0 && i < weeks.length - 1 ? weeks[i + 1] : null;
  return (
    <div className="card flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        {prev !== null ? (
          <Link href={hrefWith(path, params, { week: String(prev) })} className="btn btn-sm" aria-label={`Week ${prev}`}>
            <span aria-hidden="true">&larr;</span> <span className="hidden sm:inline">Week {prev}</span>
          </Link>
        ) : (
          <span className="btn btn-sm invisible" aria-hidden="true">
            &larr;
          </span>
        )}
        <div className="text-center">
          <p className="display text-2xl">
            Week {selected}
            {current === selected ? (
              <span className="eyebrow ml-2 align-middle text-[0.5625rem] text-chalk">This week</span>
            ) : null}
          </p>
          <p className="num text-[0.8125rem] text-muted">{formatWeekRange(weekStartIso(season, selected))}</p>
        </div>
        {next !== null ? (
          <Link href={hrefWith(path, params, { week: String(next) })} className="btn btn-sm" aria-label={`Week ${next}`}>
            <span className="hidden sm:inline">Week {next}</span> <span aria-hidden="true">&rarr;</span>
          </Link>
        ) : (
          <span className="btn btn-sm invisible" aria-hidden="true">
            &rarr;
          </span>
        )}
      </div>
      <nav aria-label="Weeks" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {weeks.map((w) => (
          <Link
            key={w}
            href={hrefWith(path, params, { week: String(w) })}
            aria-current={w === selected ? "page" : undefined}
            aria-label={`Week ${w}${w === current ? " (this week)" : ""}`}
            className={`num relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
              w === selected
                ? "bg-cloth text-on-cloth"
                : w === current
                  ? "border border-chalk text-chalk hover:bg-raised"
                  : "text-muted hover:bg-raised hover:text-ink"
            }`}
          >
            {w}
          </Link>
        ))}
      </nav>
    </div>
  );
}
