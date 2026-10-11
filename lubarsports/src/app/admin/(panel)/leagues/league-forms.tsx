"use client";

import { useState } from "react";
import { addAdjustment, deleteAdjustment, updateLeague } from "@/app/admin/actions/leagues";
import { ActionForm, ConfirmAction, FieldError, SubmitButton } from "@/components/admin/form-bits";
import { DAY_NAMES } from "@/lib/config";

export type LeagueSettings = {
  id: number;
  name: string;
  sport: string;
  matchDay: number;
  framesPerMatch: number | null;
  sortOrder: number;
  active: boolean;
};

export function LeagueSettingsForm({ league }: { league: LeagueSettings }) {
  return (
    <ActionForm action={updateLeague} className="grid gap-3 sm:grid-cols-[1fr_8rem_6rem] sm:items-end">
      {(state) => (
        <>
          <input type="hidden" name="id" value={league.id} />
          <div>
            <label className="label" htmlFor={`day-${league.id}`}>
              Match night
            </label>
            <select id={`day-${league.id}`} name="matchDay" defaultValue={league.matchDay} className="input select">
              {DAY_NAMES.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`frames-${league.id}`}>
              Frames a match
            </label>
            <input
              id={`frames-${league.id}`}
              name="framesPerMatch"
              inputMode="numeric"
              defaultValue={league.framesPerMatch ?? ""}
              className="input"
              aria-invalid={Boolean(state.errors?.framesPerMatch)}
            />
            <FieldError message={state.errors?.framesPerMatch} />
          </div>
          <div>
            <label className="label" htmlFor={`order-${league.id}`}>
              Order
            </label>
            <input id={`order-${league.id}`} name="sortOrder" inputMode="numeric" defaultValue={league.sortOrder} className="input" />
          </div>
          <label className="flex items-center gap-2 text-[0.9375rem] sm:col-span-2">
            <input type="checkbox" name="active" defaultChecked={league.active} className="size-4 accent-[var(--cloth)]" />
            Active (included when a new season&apos;s fixtures are generated)
          </label>
          <SubmitButton className="btn btn-sm justify-self-start sm:justify-self-end">Save</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function AddAdjustmentForm({
  seasonId,
  leagues,
}: {
  seasonId: number;
  leagues: { id: number; name: string; teams: { id: number; name: string }[] }[];
}) {
  const [leagueId, setLeagueId] = useState(leagues[0]?.id ?? 0);
  const teams = leagues.find((l) => l.id === leagueId)?.teams ?? [];
  return (
    <ActionForm action={addAdjustment} resetOnSuccess className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_7rem_2fr_auto] lg:items-end">
      {(state) => (
        <>
          <input type="hidden" name="seasonId" value={seasonId} />
          <div>
            <label className="label" htmlFor="adj-league">
              League
            </label>
            <select id="adj-league" value={leagueId} onChange={(e) => setLeagueId(Number(e.target.value))} className="input select">
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="adj-team">
              College
            </label>
            <select key={leagueId} id="adj-team" name="teamId" defaultValue="" className="input select" required aria-invalid={Boolean(state.errors?.teamId)}>
              <option value="" disabled>
                Choose…
              </option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <FieldError message={state.errors?.teamId} />
          </div>
          <div>
            <label className="label" htmlFor="adj-points">
              Points
            </label>
            <input id="adj-points" name="points" inputMode="numeric" placeholder="-3" className="input" required aria-invalid={Boolean(state.errors?.points)} />
            <FieldError message={state.errors?.points} />
          </div>
          <div>
            <label className="label" htmlFor="adj-reason">
              Reason <span className="font-normal text-muted">(shown under the table)</span>
            </label>
            <input id="adj-reason" name="reason" maxLength={200} className="input" placeholder="Failed to field a team, week 4" required aria-invalid={Boolean(state.errors?.reason)} />
            <FieldError message={state.errors?.reason} />
          </div>
          <SubmitButton className="btn btn-primary">Apply</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function RemoveAdjustment({ id, label }: { id: number; label: string }) {
  return (
    <ConfirmAction
      action={deleteAdjustment}
      fields={{ id: String(id) }}
      trigger="Remove"
      triggerClassName="btn btn-sm btn-quiet text-loss"
      title="Remove this adjustment?"
      confirmLabel="Remove"
    >
      {label}. The table goes back to points from results only.
    </ConfirmAction>
  );
}
