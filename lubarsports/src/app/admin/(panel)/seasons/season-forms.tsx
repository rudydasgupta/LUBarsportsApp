"use client";

import { createSeason, makeCurrent, setSeasonStatus, updateSeason } from "@/app/admin/actions/seasons";
import { ActionForm, ConfirmAction, FieldError, SubmitButton } from "@/components/admin/form-bits";

export type SeasonRow = {
  id: number;
  name: string;
  status: string;
  isCurrent: boolean;
  michaelmasStart: string;
  lentStart: string;
  winBonus: number;
  drawBonus: number;
  notes: string | null;
};

function DateFields({ errors, michaelmas, lent, idPrefix }: { errors?: Record<string, string>; michaelmas?: string; lent?: string; idPrefix: string }) {
  return (
    <>
      <div>
        <label className="label" htmlFor={`${idPrefix}-mich`}>
          Michaelmas week 1 <span className="font-normal text-muted">(Monday)</span>
        </label>
        <input id={`${idPrefix}-mich`} name="michaelmasStart" type="date" defaultValue={michaelmas} className="input" required aria-invalid={Boolean(errors?.michaelmasStart)} />
        <FieldError message={errors?.michaelmasStart} />
      </div>
      <div>
        <label className="label" htmlFor={`${idPrefix}-lent`}>
          Lent week 11 <span className="font-normal text-muted">(Monday)</span>
        </label>
        <input id={`${idPrefix}-lent`} name="lentStart" type="date" defaultValue={lent} className="input" required aria-invalid={Boolean(errors?.lentStart)} />
        <FieldError message={errors?.lentStart} />
      </div>
    </>
  );
}

function PointsFields({ errors, win = 2, draw = 0, idPrefix }: { errors?: Record<string, string>; win?: number; draw?: number; idPrefix: string }) {
  return (
    <>
      <div>
        <label className="label" htmlFor={`${idPrefix}-win`}>
          Win bonus
        </label>
        <input id={`${idPrefix}-win`} name="winBonus" inputMode="numeric" defaultValue={win} className="input" aria-invalid={Boolean(errors?.winBonus)} />
        <FieldError message={errors?.winBonus} />
      </div>
      <div>
        <label className="label" htmlFor={`${idPrefix}-draw`}>
          Draw bonus
        </label>
        <input id={`${idPrefix}-draw`} name="drawBonus" inputMode="numeric" defaultValue={draw} className="input" aria-invalid={Boolean(errors?.drawBonus)} />
        <FieldError message={errors?.drawBonus} />
      </div>
    </>
  );
}

export function NewSeasonForm({
  suggestion,
  leagues,
}: {
  suggestion: { name: string; michaelmas: string; lent: string };
  leagues: { id: number; name: string; active: boolean }[];
}) {
  return (
    <ActionForm action={createSeason} className="space-y-4">
      {(state) => (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="label" htmlFor="new-name">
                Season
              </label>
              <input id="new-name" name="name" defaultValue={suggestion.name} placeholder="2027/28" className="input" required aria-invalid={Boolean(state.errors?.name)} />
              <FieldError message={state.errors?.name} />
            </div>
            <DateFields errors={state.errors} michaelmas={suggestion.michaelmas} lent={suggestion.lent} idPrefix="new" />
            <PointsFields errors={state.errors} idPrefix="new" />
          </div>
          <fieldset>
            <legend className="label">Leagues</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {leagues.map((l) => (
                <label key={l.id} className="flex items-center gap-2 text-[0.9375rem]">
                  <input type="checkbox" name="divisionIds" value={l.id} defaultChecked={l.active} className="size-4 accent-[var(--cloth)]" />
                  {l.name}
                </label>
              ))}
            </div>
            <FieldError message={state.errors?.divisionIds} />
          </fieldset>
          <div className="space-y-2 text-[0.9375rem]">
            <label className="flex items-start gap-2">
              <input type="checkbox" name="generateFixtures" defaultChecked className="mt-1 size-4 accent-[var(--cloth)]" />
              <span>
                Generate fixtures from the standard template
                <span className="block text-[0.8125rem] text-muted">
                  The double round robin used in 2025/26: weeks 2–9 and 11–20, four matches a week, on each league&apos;s match night.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" name="swapHomeAway" className="mt-1 size-4 accent-[var(--cloth)]" />
              <span>Swap home and away compared with the template</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" name="makeCurrent" defaultChecked className="mt-1 size-4 accent-[var(--cloth)]" />
              <span>
                Make it the current season now
                <span className="block text-[0.8125rem] text-muted">The public site switches to it, and the current season moves to the archive.</span>
              </span>
            </label>
          </div>
          <SubmitButton pendingLabel="Creating…">Create season</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function EditSeasonForm({ season }: { season: SeasonRow }) {
  return (
    <ActionForm action={updateSeason} className="space-y-3">
      {(state) => (
        <>
          <input type="hidden" name="id" value={season.id} />
          {season.status === "ARCHIVED" ? (
            <p className="rounded-md border-l-4 border-cue bg-cue-wash px-3 py-2 text-[0.875rem]">
              This season is archived. Changing its points rule changes its final tables in the archive.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DateFields errors={state.errors} michaelmas={season.michaelmasStart} lent={season.lentStart} idPrefix={`s${season.id}`} />
            <PointsFields errors={state.errors} win={season.winBonus} draw={season.drawBonus} idPrefix={`s${season.id}`} />
          </div>
          <div>
            <label className="label" htmlFor={`notes-${season.id}`}>
              Notes <span className="font-normal text-muted">(admins only)</span>
            </label>
            <input id={`notes-${season.id}`} name="notes" defaultValue={season.notes ?? ""} maxLength={500} className="input" />
          </div>
          <label className="flex items-start gap-2 text-[0.9375rem]">
            <input type="checkbox" name="moveFixtures" defaultChecked={season.status !== "ARCHIVED"} className="mt-1 size-4 accent-[var(--cloth)]" />
            <span>
              If the term dates change, move every fixture to match
              <span className="block text-[0.8125rem] text-muted">Each fixture keeps its week number and league night.</span>
            </span>
          </label>
          <SubmitButton className="btn btn-sm btn-primary">Save season</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function SeasonActions({ season }: { season: SeasonRow }) {
  return (
    <div className="flex flex-wrap gap-2">
      {!season.isCurrent ? (
        <ConfirmAction
          action={makeCurrent}
          fields={{ id: String(season.id) }}
          trigger="Make current"
          tone="primary"
          title={`Make ${season.name} the current season?`}
          confirmLabel="Make current"
        >
          The public site&apos;s tables, fixtures and results switch to {season.name}. The season that&apos;s current now moves to the archive.
        </ConfirmAction>
      ) : null}
      {!season.isCurrent && season.status !== "ARCHIVED" ? (
        <ConfirmAction
          action={setSeasonStatus}
          fields={{ id: String(season.id), status: "ARCHIVED" }}
          trigger="Archive"
          tone="primary"
          title={`Archive ${season.name}?`}
          confirmLabel="Archive"
        >
          It appears in the public archive. Only super admins can change archived results.
        </ConfirmAction>
      ) : null}
      {season.status === "ARCHIVED" ? (
        <ConfirmAction
          action={setSeasonStatus}
          fields={{ id: String(season.id), status: "UPCOMING" }}
          trigger="Hide from archive"
          tone="primary"
          title={`Hide ${season.name} from the archive?`}
          confirmLabel="Hide"
        >
          Nothing is deleted. It is marked as upcoming and disappears from the public archive until you archive it again.
        </ConfirmAction>
      ) : null}
    </div>
  );
}
