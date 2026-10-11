import type { Metadata } from "next";
import { MiniTable } from "@/components/standings-table";
import { EmptyState } from "@/components/states";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { getLeagues, loadCurrentSeason } from "@/lib/season-data";
import { AddAdjustmentForm, LeagueSettingsForm, RemoveAdjustment } from "./league-forms";

export const metadata: Metadata = { title: "Leagues & points" };

export default async function AdminLeaguesPage() {
  await requireUser({ roles: ["SUPER", "GENERAL"] });
  const [data, allLeagues] = await Promise.all([loadCurrentSeason(), getLeagues()]);
  if (!data) return <EmptyState title="No season yet" />;
  const adjustments = data.leagues.flatMap((l) => l.adjustments.map((a) => ({ ...a, league: l.league.name })));

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-chalk">Season {data.season.name}</p>
        <h1 className="display mt-2 text-4xl">Leagues &amp; points</h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] text-muted">
          Points are worked out from results: 1 per frame won, +{data.season.winBonus} for a win
          {data.season.drawBonus ? `, +${data.season.drawBonus} for a draw` : ""}. Change the rule on the Seasons page. Use
          adjustments for deductions or bonuses.
        </p>
      </div>

      <section aria-labelledby="adj-heading" className="space-y-3">
        <h2 id="adj-heading" className="text-xl font-bold">
          Points adjustments
        </h2>
        <div className="card p-4 sm:p-5">
          <AddAdjustmentForm
            seasonId={data.season.id}
            leagues={data.leagues.map((l) => ({ id: l.league.id, name: l.league.name, teams: l.teams }))}
          />
        </div>
        {adjustments.length === 0 ? (
          <p className="text-[0.9375rem] text-muted">No adjustments this season.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="table min-w-[40rem]">
              <thead>
                <tr>
                  <th scope="col">League</th>
                  <th scope="col">College</th>
                  <th scope="col" className="text-right">
                    Points
                  </th>
                  <th scope="col">Reason</th>
                  <th scope="col">Added</th>
                  <th scope="col">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.league}</td>
                    <th scope="row" className="font-semibold">
                      {a.team}
                    </th>
                    <td className={`num text-right font-bold ${a.points < 0 ? "text-loss" : "text-win"}`}>
                      {a.points > 0 ? "+" : ""}
                      {a.points}
                    </td>
                    <td className="text-muted">{a.reason}</td>
                    <td className="text-[0.8125rem] text-muted">
                      {formatDate(a.createdAt)}
                      {a.createdBy ? `, ${a.createdBy}` : ""}
                    </td>
                    <td className="text-right">
                      <RemoveAdjustment id={a.id} label={`${a.team} ${a.points > 0 ? "+" : ""}${a.points} in ${a.league}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="settings-heading" className="space-y-3">
        <h2 id="settings-heading" className="text-xl font-bold">
          League settings
        </h2>
        <ul className="grid gap-4 lg:grid-cols-2">
          {allLeagues.map((league) => {
            const current = data.leagues.find((l) => l.league.id === league.id);
            return (
              <li key={league.id} className="card flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="eyebrow text-[0.5625rem] text-chalk">{league.sport}</p>
                    <h3 className="text-lg font-bold">{league.name}</h3>
                  </div>
                  {!league.active ? <span className="tag">Inactive</span> : null}
                </div>
                <LeagueSettingsForm league={league} />
                {current ? (
                  <details>
                    <summary className="cursor-pointer text-[0.875rem] font-semibold text-chalk">Current top four</summary>
                    <div className="mt-2">
                      <MiniTable rows={current.standings} links={false} />
                    </div>
                  </details>
                ) : (
                  <p className="text-[0.8125rem] text-muted">No fixtures this season.</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
