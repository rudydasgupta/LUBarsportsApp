import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/states";
import { overdueFixtures, resultLeagues } from "@/lib/admin-data";
import { auditLabel } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatShortDay, formatWeekRange, todayIso, weekForIso, weekStartIso } from "@/lib/dates";
import { canEnterResult, canManageLeagues, canViewAudit } from "@/lib/permissions";
import { defaultWeek, loadCurrentSeason, seasonPhase } from "@/lib/season-data";

export const metadata: Metadata = { title: "Admin" };

type Props = { searchParams: Promise<{ denied?: string }> };

export default async function AdminOverviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await requireUser();
  const data = await loadCurrentSeason();
  const today = todayIso();

  const [admins, announcements, recent] = await Promise.all([
    db.admin.count({ where: { active: true } }),
    db.announcement.count({ where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
    canViewAudit(user) ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }) : Promise.resolve([]),
  ]);

  if (!data) {
    return (
      <Notice tone="warning">
        There is no season yet.{" "}
        {user.role === "SUPER" ? (
          <Link href="/admin/seasons" className="link">
            Create one
          </Link>
        ) : (
          "Ask a super admin to create one."
        )}
      </Notice>
    );
  }

  const phase = seasonPhase(data, today);
  const week = defaultWeek(data, today);
  const thisWeek = weekForIso(data.season, today);
  const leagues = resultLeagues(data, user);
  const overdue = overdueFixtures(data, user, today);
  const mineAll = data.fixtures.filter((f) => canEnterResult(user, f));
  const dueSoFar = mineAll.filter((f) => f.date < today && f.status !== "CANCELLED");
  const entered = mineAll.filter((f) => f.result).length;
  const progress = dueSoFar.length ? Math.round((dueSoFar.filter((f) => f.result).length / dueSoFar.length) * 100) : 100;

  const overdueByLeague = new Map<string, { name: string; slug: string; weeks: Set<number>; count: number }>();
  for (const f of overdue) {
    const g = overdueByLeague.get(f.leagueSlug) ?? { name: f.leagueName, slug: f.leagueSlug, weeks: new Set(), count: 0 };
    g.count++;
    if (f.week) g.weeks.add(f.week);
    overdueByLeague.set(f.leagueSlug, g);
  }

  const phaseTile =
    phase.kind === "during"
      ? { label: "Season live", value: `Week ${phase.week}` }
      : phase.kind === "before"
        ? { label: "Season starts", value: phase.firstDate ? formatShortDay(phase.firstDate) : "Soon" }
        : phase.kind === "break"
          ? { label: "Season", value: "Christmas break" }
          : { label: "Season", value: "Finished" };

  return (
    <div className="space-y-6">
      {sp.denied ? <Notice tone="warning">Your account doesn&apos;t have access to that page.</Notice> : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-chalk">Season {data.season.name}</p>
          <h1 className="display mt-2 text-4xl">Hi, {user.name.split(" ")[0]}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/results${week ? `?week=${week}` : ""}`} className="btn btn-primary">
            Enter results
          </Link>
          {canManageLeagues(user) ? (
            <>
              <Link href="/admin/fixtures" className="btn">
                Fixtures
              </Link>
              <Link href="/admin/announcements" className="btn">
                Post announcement
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label={phaseTile.label} value={phaseTile.value} sub={`${data.season.name}${data.season.isCurrent ? ", shown on the site" : ""}`} />
        <Tile
          label="Results entered"
          value={`${entered}`}
          sub={`of ${mineAll.length} fixtures${user.college ? ` involving ${user.college}` : ""}`}
        />
        <Tile
          label="Awaiting results"
          value={String(overdue.length)}
          sub={overdue.length ? "matches already played" : "All up to date"}
          tone={overdue.length ? "warn" : "ok"}
        />
        {canManageLeagues(user) ? (
          <Tile label="Admins · Announcements" value={`${admins} · ${announcements}`} sub="active accounts · live posts" />
        ) : (
          <Tile label="Your leagues" value={String(leagues.length)} sub={leagues.map((l) => l.league.name).join(", ")} />
        )}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="card p-4 sm:p-5" aria-labelledby="attention-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="attention-heading" className="text-xl font-bold">
                Needs results
              </h2>
              <span className="text-[0.8125rem] text-muted">{progress}% of played matches reported</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised" aria-hidden="true">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#c8102e,#ff3b52)]" style={{ width: `${progress}%` }} />
            </div>
            {overdueByLeague.size === 0 ? (
              <p className="mt-4 text-muted">Nothing outstanding. Every match played so far has a result.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {[...overdueByLeague.values()].map((g) => {
                  const firstWeek = Math.min(...g.weeks);
                  return (
                    <li key={g.slug} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                      <div>
                        <p className="font-semibold">{g.name}</p>
                        <p className="text-[0.8125rem] text-muted">
                          {g.count} {g.count === 1 ? "match" : "matches"} &middot; week {[...g.weeks].sort((a, b) => a - b).join(", ")}
                        </p>
                      </div>
                      <Link href={`/admin/results?league=${g.slug}&week=${firstWeek}`} className="btn btn-sm">
                        Enter
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {week ? (
            <section className="card p-4 sm:p-5" aria-labelledby="week-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="week-heading" className="text-xl font-bold">
                  Week {week} {week === thisWeek ? <span className="text-chalk">· this week</span> : null}
                </h2>
                <span className="num text-[0.8125rem] text-muted">{formatWeekRange(weekStartIso(data.season, week))}</span>
              </div>
              <table className="table mt-3">
                <thead>
                  <tr>
                    <th scope="col">League</th>
                    <th scope="col">Night</th>
                    <th scope="col" className="text-right">
                      Results
                    </th>
                    <th scope="col">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leagues.map((l) => {
                    const fx = l.fixtures.filter((f) => f.week === week);
                    if (fx.length === 0) return null;
                    const done = fx.filter((f) => f.result).length;
                    const postponed = fx.filter((f) => f.status === "POSTPONED").length;
                    return (
                      <tr key={l.league.id}>
                        <th scope="row" className="font-semibold">
                          {l.league.name}
                        </th>
                        <td className="text-muted">{formatShortDay(fx[0].date)}</td>
                        <td className="text-right">
                          <span
                            className={`num rounded-md px-2 py-0.5 text-[0.8125rem] font-semibold ${
                              done === fx.length ? "bg-win-wash text-win" : "border border-line text-muted"
                            }`}
                          >
                            {done}/{fx.length}
                          </span>
                          {postponed ? <span className="ml-2 text-[0.75rem] text-cue">{postponed} postponed</span> : null}
                        </td>
                        <td className="text-right">
                          <Link href={`/admin/results?league=${l.league.slug}&week=${week}`} className="link text-sm">
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ) : null}
        </div>

        {canViewAudit(user) ? (
          <section className="card p-4 sm:p-5" aria-labelledby="activity-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="activity-heading" className="text-xl font-bold">
                Recent activity
              </h2>
              <Link href="/admin/audit" className="link text-sm font-semibold">
                Full audit log
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="mt-3 text-muted">Nothing yet. Changes made by admins are listed here.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {recent.map((e) => (
                  <li key={e.id} className="py-2.5 text-[0.9375rem]">
                    <span className="font-semibold">{auditLabel(e.action)}</span>
                    <span className="block text-muted">{e.summary}</span>
                    <span className="block text-[0.75rem] text-muted">
                      {e.actorName ?? "System"}, {formatDateTime(e.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="card p-4 sm:p-5">
            <h2 className="text-xl font-bold">How it works</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem] text-muted">
              <li>Open Results, pick the league and week, type both scores and press Save.</li>
              <li>Tables update straight away. Match notes, like 180s or great shots, are shown on the public site.</li>
              <li>Made a mistake? Correct the scores and save again, or clear the result.</li>
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warn" | "ok" }) {
  return (
    <div className={`card min-w-0 px-4 py-3 ${tone === "warn" ? "border-cue" : ""}`}>
      <dt className="eyebrow text-[0.5625rem] text-muted">{label}</dt>
      <dd className={`num mt-1 truncate text-2xl font-semibold ${tone === "warn" ? "text-cue" : tone === "ok" ? "text-win" : ""}`}>{value}</dd>
      {sub ? <dd className="truncate text-[0.8125rem] text-muted">{sub}</dd> : null}
    </div>
  );
}
