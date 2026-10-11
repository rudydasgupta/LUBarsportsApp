import type { StandingRow } from "@/lib/standings";
import type { AdjustmentView } from "@/lib/season-data";
import { CollegeName } from "./crest";
import { FormChips } from "./form-chips";
import { RankBall } from "./rank-ball";
import { TableScroll } from "./states";

function signed(n: number) {
  return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0";
}

/** The full league table: position, record, frames, points and form. */
export function StandingsTable({
  rows,
  label,
  adjustments = [],
  highlight,
  compact = false,
}: {
  rows: StandingRow[];
  label: string;
  adjustments?: AdjustmentView[];
  /** A college to pick out, e.g. on its own page. */
  highlight?: string;
  compact?: boolean;
}) {
  return (
    <>
      <TableScroll label={label}>
        <table className="table [&_td]:px-2 [&_th]:px-2 sm:[&_td]:px-3 sm:[&_th]:px-3">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-10 sm:w-12">
                <abbr title="Position" className="no-underline">
                  Pos
                </abbr>
              </th>
              <th scope="col">College</th>
              <Th abbr="Played">P</Th>
              <Th abbr="Won">W</Th>
              <Th abbr="Drawn">D</Th>
              <Th abbr="Lost">L</Th>
              {!compact ? (
                <>
                  <Th abbr="Frames won" className="hidden md:table-cell">
                    F
                  </Th>
                  <Th abbr="Frames lost" className="hidden md:table-cell">
                    A
                  </Th>
                </>
              ) : null}
              <Th abbr="Frame difference" className="hidden sm:table-cell">
                +/−
              </Th>
              <Th abbr="Points" strong>
                Pts
              </Th>
              <th scope="col" className="hidden sm:table-cell">
                Form
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const hl = highlight === r.team;
              return (
                <tr key={r.teamId} className={hl ? "bg-chalk-wash hover:bg-chalk-wash" : undefined}>
                  <td>{r.position ? <RankBall rank={r.position} /> : <span className="num pl-2 text-muted">&ndash;</span>}</td>
                  <th scope="row">
                    <CollegeName college={r.team} bold={hl} />
                  </th>
                  <Td>{r.played}</Td>
                  <Td>{r.won}</Td>
                  <Td>{r.drawn}</Td>
                  <Td>{r.lost}</Td>
                  {!compact ? (
                    <>
                      <Td className="hidden md:table-cell">{r.for}</Td>
                      <Td className="hidden md:table-cell">{r.against}</Td>
                    </>
                  ) : null}
                  <Td className={`hidden sm:table-cell ${r.diff > 0 ? "text-win" : r.diff < 0 ? "text-loss" : "text-muted"}`}>{signed(r.diff)}</Td>
                  <Td className="text-[1.0625rem] font-bold text-ink">
                    {r.points}
                    {r.adjustment !== 0 ? (
                      <sup className="ml-0.5 text-[0.625rem] font-semibold text-cue" title={`Includes ${signed(r.adjustment)} adjustment`}>
                        *
                      </sup>
                    ) : null}
                  </Td>
                  <td className="hidden sm:table-cell">
                    <FormChips form={r.form} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
      {adjustments.length > 0 ? (
        <ul className="mt-2 space-y-0.5 text-[0.8125rem] text-muted">
          {adjustments.map((a) => (
            <li key={a.id}>
              <span className="text-cue">*</span> {a.team} {signed(a.points)} {Math.abs(a.points) === 1 ? "point" : "points"}: {a.reason}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function Th({ children, abbr, strong, className = "" }: { children: React.ReactNode; abbr: string; strong?: boolean; className?: string }) {
  return (
    <th scope="col" className={`w-10 text-right sm:w-12 ${strong ? "text-ink" : ""} ${className}`}>
      <abbr title={abbr} className="no-underline">
        {children}
      </abbr>
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`num text-right tabular-nums text-muted ${className}`}>{children}</td>;
}

/** Top few rows only, for overview cards. */
export function MiniTable({ rows, limit = 4, links = true }: { rows: StandingRow[]; limit?: number; links?: boolean }) {
  return (
    <ol className="divide-y divide-line">
      {rows.slice(0, limit).map((r) => (
        <li key={r.teamId} className="flex items-center gap-3 py-2">
          {r.position ? <RankBall rank={r.position} /> : <span className="num w-7 text-center text-muted">&ndash;</span>}
          <CollegeName college={r.team} size="xs" link={links} className="min-w-0 flex-1" />
          <span className="num text-[0.8125rem] text-muted">
            {r.won}-{r.drawn}-{r.lost}
          </span>
          <span className="num w-9 text-right font-bold">{r.points}</span>
        </li>
      ))}
    </ol>
  );
}
