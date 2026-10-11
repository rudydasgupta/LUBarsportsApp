import type { Metadata } from "next";
import Link from "next/link";
import { Crest } from "@/components/crest";
import { RankBall } from "@/components/rank-ball";
import { PageHeading } from "@/components/states";
import { COLLEGES } from "@/lib/config";
import { loadCurrentSeason } from "@/lib/season-data";

export const metadata: Metadata = { title: "Colleges" };

export default async function CollegesPage() {
  const data = await loadCurrentSeason();
  return (
    <>
      <PageHeading
        eyebrow={data ? `Season ${data.season.name}` : undefined}
        title="Colleges"
        lead="Nine colleges, six leagues. Choose a college for its positions, fixtures and results."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COLLEGES.map((c) => {
          const rows = (data?.leagues ?? [])
            .map((l) => ({ league: l.league, row: l.standings.find((r) => r.team === c.name) }))
            .filter((x) => x.row);
          const points = rows.reduce((n, x) => n + (x.row?.points ?? 0), 0);
          const played = rows.reduce((n, x) => n + (x.row?.played ?? 0), 0);
          const best = rows
            .filter((x) => x.row?.position)
            .sort((a, b) => (a.row!.position ?? 99) - (b.row!.position ?? 99))[0];
          return (
            <li key={c.slug}>
              <Link
                href={`/colleges/${c.slug}`}
                className="card group relative flex h-full items-center gap-4 overflow-hidden p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong sm:p-5"
              >
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: c.color }} />
                <Crest college={c.name} size="lg" className="transition-transform duration-300 group-hover:scale-105" />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold">{c.name}</p>
                  <p className="text-[0.8125rem] text-muted">
                    {played} {played === 1 ? "match" : "matches"} &middot; <span className="num">{points}</span> points
                  </p>
                  {best?.row?.position ? (
                    <p className="mt-2 flex items-center gap-2 text-[0.8125rem] text-muted">
                      <RankBall rank={best.row.position} />
                      <span className="truncate">Best: {best.league.name}</span>
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
