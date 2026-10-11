import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDaysIso, formatDate, weekStartIso } from "@/lib/dates";
import { getLeagues, getSeasons } from "@/lib/season-data";
import { EditSeasonForm, NewSeasonForm, SeasonActions } from "./season-forms";

export const metadata: Metadata = { title: "Seasons" };

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "border-win text-win",
  ARCHIVED: "",
  UPCOMING: "border-cue text-cue",
};

export default async function AdminSeasonsPage() {
  await requireUser({ roles: ["SUPER"] });
  const [seasons, leagues, counts] = await Promise.all([
    getSeasons(),
    getLeagues(),
    db.fixture.groupBy({ by: ["seasonId"], where: { status: { not: "VOID" } }, _count: { _all: true } }),
  ]);
  const results = await db.result.findMany({ select: { fixture: { select: { seasonId: true } } } });
  const resultsBySeason = new Map<number, number>();
  for (const r of results) resultsBySeason.set(r.fixture.seasonId, (resultsBySeason.get(r.fixture.seasonId) ?? 0) + 1);

  // Suggest next year: 52 weeks on from the latest season, so still Mondays.
  const latest = seasons[0];
  const nextYear = latest ? Number(latest.name.slice(0, 4)) + 1 : new Date().getFullYear();
  const suggestion = {
    name: `${nextYear}/${String(nextYear + 1).slice(2)}`,
    michaelmas: latest ? addDaysIso(latest.michaelmasStart, 364) : "",
    lent: latest ? addDaysIso(latest.lentStart, 364) : "",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display text-4xl">Seasons</h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] text-muted">
          The current season is the one the public site shows. Archived seasons keep their tables and results, viewable under{" "}
          <Link href="/archive" className="link">
            Archive
          </Link>
          . Nothing here deletes results.
        </p>
      </div>

      <ul className="space-y-4">
        {seasons.map((s) => (
          <li key={s.id} className={s.isCurrent ? "card-glow p-4 sm:p-5" : "card p-4 sm:p-5"}>
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex flex-wrap items-center gap-2 text-2xl font-bold">
                  {s.name}
                  {s.isCurrent ? <span className="tag border-chalk text-chalk">Current</span> : null}
                  <span className={`tag ${STATUS_TONE[s.status] ?? ""}`}>{s.status.toLowerCase()}</span>
                </h2>
                <p className="mt-1 text-[0.875rem] text-muted">
                  Week 1 {formatDate(s.michaelmasStart)} &middot; Week 11 {formatDate(s.lentStart)} &middot; Week 20 ends{" "}
                  {formatDate(addDaysIso(weekStartIso(s, 20), 6))}
                </p>
                <p className="text-[0.875rem] text-muted">
                  <span className="num font-semibold text-ink">{counts.find((c) => c.seasonId === s.id)?._count._all ?? 0}</span> fixtures &middot;{" "}
                  <span className="num font-semibold text-ink">{resultsBySeason.get(s.id) ?? 0}</span> results &middot; win +{s.winBonus}
                  {s.drawBonus ? `, draw +${s.drawBonus}` : ""}
                </p>
              </div>
              <SeasonActions season={s} />
            </div>
            <details className="relative mt-3">
              <summary className="cursor-pointer text-[0.875rem] font-semibold text-chalk">Edit dates and points rule</summary>
              <div className="mt-3">
                <EditSeasonForm season={s} />
              </div>
            </details>
          </li>
        ))}
      </ul>

      <section className="card p-4 sm:p-5" aria-labelledby="new-heading">
        <h2 id="new-heading" className="text-xl font-bold">
          Start a new season
        </h2>
        <p className="mb-4 mt-1 text-[0.875rem] text-muted">
          Dates are suggested from the latest season, a year on. Check them against the university calendar.
        </p>
        <NewSeasonForm suggestion={suggestion} leagues={leagues.map((l) => ({ id: l.id, name: l.name, active: l.active }))} />
      </section>
    </div>
  );
}
