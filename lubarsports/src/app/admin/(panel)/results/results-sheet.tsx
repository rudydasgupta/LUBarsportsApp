"use client";

import { useState } from "react";
import { saveResults } from "@/app/admin/actions/results";
import { FormMessages, SubmitButton, useActionForm } from "@/components/admin/form-bits";
import { Crest } from "@/components/crest";

export type SheetRow = {
  id: number;
  date: string;
  dateLabel: string;
  home: string;
  away: string;
  status: string;
  editable: boolean;
  result: { home: number; away: number; details: string | null; enteredBy: string | null; updatedLabel: string } | null;
};

type Draft = { home: string; away: string; notes: string };

export function ResultsSheet({ rows, framesPerMatch, leagueName }: { rows: SheetRow[]; framesPerMatch: number | null; leagueName: string }) {
  // Re-start from the saved values whenever the server sends new ones.
  // The action state lives out here so its messages survive that restart.
  const key = rows.map((r) => `${r.id}:${r.result?.home ?? ""}-${r.result?.away ?? ""}-${r.result?.details ?? ""}`).join("|");
  const form = useActionForm(saveResults);
  return <Sheet key={key} form={form} rows={rows} framesPerMatch={framesPerMatch} leagueName={leagueName} />;
}

function Sheet({
  form,
  rows,
  framesPerMatch,
  leagueName,
}: {
  form: ReturnType<typeof useActionForm>;
  rows: SheetRow[];
  framesPerMatch: number | null;
  leagueName: string;
}) {
  const { state, onSubmit, Provider, ctx } = form;
  const [drafts, setDrafts] = useState<Record<number, Draft>>(() =>
    Object.fromEntries(
      rows.map((r) => [r.id, { home: r.result ? String(r.result.home) : "", away: r.result ? String(r.result.away) : "", notes: r.result?.details ?? "" }]),
    ),
  );
  const set = (id: number, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const dirty = rows.filter((r) => {
    const d = drafts[r.id];
    const saved = { home: r.result ? String(r.result.home) : "", away: r.result ? String(r.result.away) : "", notes: r.result?.details ?? "" };
    return r.editable && (d.home !== saved.home || d.away !== saved.away || d.notes.trim() !== saved.notes);
  }).length;

  return (
    <Provider value={ctx}>
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Pressing Enter in a score box uses the first submit button: make it Save, never Clear. */}
      <button type="submit" name="intent" value="save" className="sr-only" tabIndex={-1} aria-hidden="true" />
      <input type="hidden" name="ids" value={rows.filter((r) => r.editable).map((r) => r.id).join(",")} />
      <FormMessages state={state} />

      <ul className="card divide-y divide-line">
        {rows.map((r) => {
          const d = drafts[r.id];
          const error = state.errors?.[`row_${r.id}`];
          const h = d.home === "" ? null : Number(d.home);
          const a = d.away === "" ? null : Number(d.away);
          const total = h !== null && a !== null && !Number.isNaN(h + a) ? h + a : null;
          const offTotal = framesPerMatch && total !== null && total !== framesPerMatch;
          const label = `${r.home} v ${r.away}`;
          return (
            <li key={r.id} className={`px-3 py-4 sm:px-5 ${error ? "bg-loss-wash" : ""}`}>
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-muted">
                <span className="font-semibold text-ink">{r.dateLabel}</span>
                {r.status !== "SCHEDULED" ? <span className="tag border-cue text-cue">{r.status.toLowerCase()}</span> : null}
                {r.result ? (
                  <span>
                    Saved{r.result.enteredBy ? ` by ${r.result.enteredBy}` : ""} &middot; {r.result.updatedLabel}
                  </span>
                ) : (
                  <span>No result yet</span>
                )}
                {!r.editable ? <span className="tag">View only</span> : null}
              </div>

              {/* Phones: a two-line scoreboard, home then away. Wider: home – away side by side. */}
              <fieldset
                disabled={!r.editable}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] sm:gap-x-3"
              >
                <legend className="sr-only">{label}</legend>
                <label htmlFor={`home_${r.id}`} className="order-1 flex min-w-0 items-center gap-2.5 sm:order-none sm:flex-row-reverse sm:text-right">
                  <Crest college={r.home} size="sm" />
                  <span className="truncate font-semibold">{r.home}</span>
                </label>
                <input
                  id={`home_${r.id}`}
                  name={`home_${r.id}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  autoComplete="off"
                  aria-label={`${r.home} score, ${label}`}
                  className="score-input order-2 sm:order-none"
                  value={d.home}
                  onChange={(e) => set(r.id, { home: e.target.value.replace(/\D/g, "") })}
                />
                <span aria-hidden="true" className="hidden text-muted sm:block">
                  &ndash;
                </span>
                <input
                  id={`away_${r.id}`}
                  name={`away_${r.id}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  autoComplete="off"
                  aria-label={`${r.away} score, ${label}`}
                  className="score-input order-4 sm:order-none"
                  value={d.away}
                  onChange={(e) => set(r.id, { away: e.target.value.replace(/\D/g, "") })}
                />
                <label htmlFor={`away_${r.id}`} className="order-3 flex min-w-0 items-center gap-2.5 sm:order-none">
                  <Crest college={r.away} size="sm" />
                  <span className="truncate font-semibold">{r.away}</span>
                </label>

                <div className="order-5 col-span-full mt-1 flex flex-wrap items-start gap-3 sm:order-none">
                  {r.editable || d.notes ? (
                  <details className="group min-w-0 flex-1" open={Boolean(d.notes)}>
                    <summary className="cursor-pointer list-none text-[0.8125rem] font-semibold text-chalk hover:underline">
                      {d.notes ? "Match notes" : "+ Add match notes"}
                    </summary>
                    <textarea
                      name={`notes_${r.id}`}
                      rows={2}
                      maxLength={1000}
                      className="input mt-2 text-[0.875rem]"
                      placeholder="Highlights, shown on the public site. E.g. Sam Roach 180, 18-dart leg"
                      value={d.notes}
                      onChange={(e) => set(r.id, { notes: e.target.value })}
                    />
                  </details>
                  ) : null}
                  {r.result && r.editable ? (
                    <button
                      type="submit"
                      name="intent"
                      value={`clear:${r.id}`}
                      className="btn btn-sm btn-quiet text-loss"
                      onClick={(e) => {
                        if (!confirm(`Clear the result for ${label}? Its points come off the table.`)) e.preventDefault();
                      }}
                    >
                      Clear result
                    </button>
                  ) : null}
                </div>
              </fieldset>
              {offTotal ? (
                <p className="mt-2 text-center text-[0.8125rem] font-medium text-cue">
                  Adds up to {total}; a full {leagueName} match is {framesPerMatch}. Fine if a match was conceded or cut short.
                </p>
              ) : null}
              {error ? <p className="field-error text-center">{error}</p> : null}
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-strong bg-[var(--glass)] px-4 py-3 shadow-xl backdrop-blur-xl">
        <p className="text-[0.875rem] text-muted">
          {dirty ? (
            <>
              <span className="font-semibold text-ink">{dirty}</span> unsaved {dirty === 1 ? "change" : "changes"}
            </>
          ) : (
            "All saved"
          )}
        </p>
        <SubmitButton name="intent" value="save" className="btn btn-primary min-w-36" pendingLabel="Saving…" disabled={dirty === 0}>
          Save results
        </SubmitButton>
      </div>
    </form>
    </Provider>
  );
}
