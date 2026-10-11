import type { Metadata } from "next";
import Link from "next/link";
import { Crest } from "@/components/crest";
import { Arrow, EmptyState, PageHeading } from "@/components/states";
import { formatDate } from "@/lib/dates";
import { getArchivedSeasons, loadSeason } from "@/lib/season-data";
import { championLabel, champions, resultCounts } from "@/lib/summary";

export const metadata: Metadata = { title: "Archive" };

export default async function ArchivePage() {
  const seasons = await getArchivedSeasons();
  const loaded = await Promise.all(seasons.map((s) => loadSeason(s.id)));

  return (
    <>
      <PageHeading
        eyebrow="Past seasons"
        title="Archive"
        lead="Final tables, champions and every result from previous seasons, exactly as they finished."
      />
      {loaded.length === 0 ? (
        <EmptyState title="Nothing archived yet">
          <p>When a season ends and a new one starts, its final tables and results are kept here.</p>
        </EmptyState>
      ) : (
        <ul className="space-y-6">
          {loaded.map((data) => {
            if (!data) return null;
            const counts = resultCounts(data);
            const champs = champions(data);
            const first = data.fixtures[0]?.date;
            const last = data.fixtures[data.fixtures.length - 1]?.date;
            return (
              <li key={data.season.id}>
                <article className="card-glow overflow-hidden">
                  <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
                    <div>
                      <p className="eyebrow text-chalk">
                        {first && last ? `${formatDate(first)} – ${formatDate(last)}` : "Season"}
                      </p>
                      <h2 className="display mt-2 text-4xl">{data.season.name}</h2>
                      <p className="mt-1 text-[0.9375rem] text-muted">
                        {data.leagues.length} leagues &middot; {counts.played} results
                      </p>
                    </div>
                    <Link href={`/archive/${data.season.slug}`} className="btn btn-primary">
                      Final tables
                      <Arrow />
                    </Link>
                  </div>
                  {champs.length > 0 ? (
                    <ul className="relative grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
                      {champs.map((c) => (
                        <li key={c.leagueSlug} className="bg-surface">
                          <Link
                            href={`/archive/${data.season.slug}/${c.leagueSlug}`}
                            className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-raised"
                          >
                            <Crest college={c.team} size="md" />
                            <span className="min-w-0">
                              <span className="eyebrow block text-[0.5625rem] text-muted">{championLabel(c, true)}</span>
                              <span className="block truncate text-lg font-bold">{c.team}</span>
                              <span className="num text-[0.8125rem] text-muted">
                                {c.points} pts from {c.played}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
