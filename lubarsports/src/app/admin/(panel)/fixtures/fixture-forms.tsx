"use client";

import { useState } from "react";
import { createFixture, deleteFixture, postponeWeek, rescheduleWeek, updateFixture } from "@/app/admin/actions/fixtures";
import { ActionForm, ConfirmAction, FieldError, SubmitButton } from "@/components/admin/form-bits";

type Team = { id: number; name: string };
type League = { id: number; name: string; teams: Team[] };

export type EditableFixture = {
  id: number;
  date: string;
  dateLabel: string;
  homeTeamId: number;
  awayTeamId: number;
  home: string;
  away: string;
  status: string;
  notes: string | null;
  score: string | null;
  leagueName: string;
};

const STATUS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "POSTPONED", label: "Postponed" },
  { value: "CANCELLED", label: "Cancelled (not counted)" },
];

function TeamSelect({ name, teams, value, label, invalid }: { name: string; teams: Team[]; value?: number; label: string; invalid?: boolean }) {
  return (
    <select name={name} defaultValue={value ?? ""} className="input select" aria-label={label} aria-invalid={invalid} required>
      <option value="" disabled>
        Choose…
      </option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

export function FixtureRow({ f, teams, showLeague }: { f: EditableFixture; teams: Team[]; showLeague: boolean }) {
  const tone =
    f.status === "POSTPONED" ? "border-cue text-cue" : f.status === "CANCELLED" ? "border-loss text-loss" : f.score ? "border-win text-win" : "";
  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-raised/50 sm:px-5">
          <span className="w-28 shrink-0 text-[0.8125rem] text-muted">{f.dateLabel}</span>
          <span className="min-w-0 flex-1 font-semibold">
            {f.home} <span className="font-normal text-muted">v</span> {f.away}
            {showLeague ? <span className="ml-2 text-[0.8125rem] font-normal text-muted">{f.leagueName}</span> : null}
          </span>
          {f.score ? <span className="num rounded-md border border-line-strong px-2 py-0.5 text-sm font-bold">{f.score}</span> : null}
          <span className={`tag ${tone}`}>{f.score ? "Played" : STATUS.find((s) => s.value === f.status)?.label.split(" ")[0]}</span>
          <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-90">
            &rsaquo;
          </span>
        </summary>
        <div className="border-t border-line bg-raised/30 px-4 py-4 sm:px-5">
          <ActionForm action={updateFixture} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[10rem_1fr_1fr_12rem]">
            {(state) => (
              <>
                <input type="hidden" name="id" value={f.id} />
                <div>
                  <label className="label" htmlFor={`date-${f.id}`}>
                    Date
                  </label>
                  <input id={`date-${f.id}`} name="date" type="date" defaultValue={f.date} className="input" required aria-invalid={Boolean(state.errors?.date)} />
                  <FieldError message={state.errors?.date} />
                </div>
                <div>
                  <span className="label">Home</span>
                  <TeamSelect name="homeTeamId" teams={teams} value={f.homeTeamId} label="Home team" invalid={Boolean(state.errors?.homeTeamId)} />
                  <FieldError message={state.errors?.homeTeamId} />
                </div>
                <div>
                  <span className="label">Away</span>
                  <TeamSelect name="awayTeamId" teams={teams} value={f.awayTeamId} label="Away team" invalid={Boolean(state.errors?.awayTeamId)} />
                  <FieldError message={state.errors?.awayTeamId} />
                </div>
                <div>
                  <label className="label" htmlFor={`status-${f.id}`}>
                    Status
                  </label>
                  <select id={`status-${f.id}`} name="status" defaultValue={f.status} className="input select">
                    {STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="label" htmlFor={`notes-${f.id}`}>
                    Fixture note <span className="font-normal text-muted">(shown publicly until a result is entered)</span>
                  </label>
                  <input id={`notes-${f.id}`} name="notes" defaultValue={f.notes ?? ""} maxLength={500} className="input" placeholder="e.g. Moved to Wednesday because of the Roses tournament" />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <SubmitButton className="btn btn-primary btn-sm">Save fixture</SubmitButton>
                </div>
              </>
            )}
          </ActionForm>
          {/* Outside the edit form: the dialog has a form of its own. */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            {!f.score ? (
              <ConfirmAction
                action={deleteFixture}
                fields={{ id: String(f.id) }}
                trigger="Delete fixture"
                triggerClassName="btn btn-sm btn-quiet text-loss"
                title={`Delete ${f.home} v ${f.away}?`}
                confirmLabel="Delete fixture"
              >
                It disappears from the fixture list. To keep it but not count it, set the status to Cancelled instead.
              </ConfirmAction>
            ) : (
              <span className="text-[0.8125rem] text-muted">Has a result, so it can&apos;t be deleted. Clear the result first.</span>
            )}
          </div>
        </div>
      </details>
    </li>
  );
}

export function AddFixtureForm({ seasonId, leagues, defaultLeagueId, defaultDate }: { seasonId: number; leagues: League[]; defaultLeagueId?: number; defaultDate: string }) {
  return (
    <ActionForm action={createFixture} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_10rem_1fr_1fr_auto] lg:items-end">
      {(state) => (
        <>
          <input type="hidden" name="seasonId" value={seasonId} />
          <LeagueTeamPickers leagues={leagues} defaultLeagueId={defaultLeagueId} errors={state.errors} defaultDate={defaultDate} />
          <SubmitButton className="btn btn-primary">Add fixture</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function LeagueTeamPickers({
  leagues,
  defaultLeagueId,
  errors,
  defaultDate,
}: {
  leagues: League[];
  defaultLeagueId?: number;
  errors?: Record<string, string>;
  defaultDate: string;
}) {
  const teamsByName = (leagueId: number) => leagues.find((l) => l.id === leagueId)?.teams ?? [];
  const first = defaultLeagueId ?? leagues[0]?.id;
  return (
    <LeagueAware leagues={leagues} first={first}>
      {(leagueId) => (
        <>
          <div>
            <label className="label" htmlFor="new-date">
              Date
            </label>
            <input id="new-date" name="date" type="date" defaultValue={defaultDate} className="input" required aria-invalid={Boolean(errors?.date)} />
            <FieldError message={errors?.date} />
          </div>
          <div>
            <span className="label">Home</span>
            <TeamSelect key={`h${leagueId}`} name="homeTeamId" teams={teamsByName(leagueId)} label="Home team" invalid={Boolean(errors?.homeTeamId)} />
            <FieldError message={errors?.homeTeamId} />
          </div>
          <div>
            <span className="label">Away</span>
            <TeamSelect key={`a${leagueId}`} name="awayTeamId" teams={teamsByName(leagueId)} label="Away team" invalid={Boolean(errors?.awayTeamId)} />
            <FieldError message={errors?.awayTeamId} />
          </div>
        </>
      )}
    </LeagueAware>
  );
}

function LeagueAware({ leagues, first, children }: { leagues: League[]; first?: number; children: (leagueId: number) => React.ReactNode }) {
  const [leagueId, setLeagueId] = useState(first ?? 0);
  return (
    <>
      <div>
        <label className="label" htmlFor="new-league">
          League
        </label>
        <select id="new-league" name="divisionId" value={leagueId} onChange={(e) => setLeagueId(Number(e.target.value))} className="input select">
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      {children(leagueId)}
    </>
  );
}

export function WeekTools({
  seasonId,
  week,
  leagues,
  selectedLeagueId,
  suggestedMonday,
}: {
  seasonId: number;
  week: number;
  leagues: { id: number; name: string }[];
  selectedLeagueId?: number;
  suggestedMonday: string;
}) {
  const scope = (
    <select name="divisionId" defaultValue={selectedLeagueId ?? ""} className="input select" aria-label="Which leagues">
      <option value="">All leagues</option>
      {leagues.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name}
        </option>
      ))}
    </select>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ActionForm action={rescheduleWeek} className="card space-y-3 p-4">
        {(state) => (
          <>
            <input type="hidden" name="seasonId" value={seasonId} />
            <input type="hidden" name="week" value={week} />
            <div>
              <h3 className="font-bold">Move week {week}</h3>
              <p className="text-[0.8125rem] text-muted">Moves every fixture to the week starting on the Monday you pick. Each league keeps its usual night.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {scope}
              <div>
                <input name="monday" type="date" defaultValue={suggestedMonday} className="input" aria-label="New week starting Monday" aria-invalid={Boolean(state.errors?.monday)} />
                <FieldError message={state.errors?.monday} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[0.875rem]">
              <input type="checkbox" name="unplayedOnly" defaultChecked className="size-4 accent-[var(--cloth)]" />
              Only fixtures without a result
            </label>
            <SubmitButton className="btn btn-sm">Move fixtures</SubmitButton>
          </>
        )}
      </ActionForm>
      <ActionForm action={postponeWeek} className="card space-y-3 p-4">
        <input type="hidden" name="seasonId" value={seasonId} />
        <input type="hidden" name="week" value={week} />
        <div>
          <h3 className="font-bold">Postpone week {week}</h3>
          <p className="text-[0.8125rem] text-muted">
            Marks every unplayed fixture as postponed, e.g. for a cancelled match night. Move them to a new date later.
          </p>
        </div>
        {scope}
        <SubmitButton className="btn btn-sm">Postpone fixtures</SubmitButton>
      </ActionForm>
    </div>
  );
}
