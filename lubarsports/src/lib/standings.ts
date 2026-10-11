/**
 * League tables, worked out from results. One point per frame, leg or game
 * won, plus the season's bonus for winning (and, optionally, drawing) the
 * match, plus any points adjustments.
 */

export type Outcome = "W" | "D" | "L";

export type TableFixture = {
  homeTeamId: number;
  awayTeamId: number;
  date: string;
  status: string;
  result: { home: number; away: number } | null;
};

export type StandingRow = {
  teamId: number;
  team: string;
  /** Shared when teams are level on points, frame difference and frames won. Null before anyone has played. */
  position: number | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  for: number;
  against: number;
  diff: number;
  adjustment: number;
  points: number;
  /** Most recent first, up to five. */
  form: Outcome[];
};

export type PointsRule = { winBonus: number; drawBonus: number };

export function matchPoints(own: number, other: number, rule: PointsRule): number {
  return own + (own > other ? rule.winBonus : own === other ? rule.drawBonus : 0);
}

export function isCounted(f: { status: string; result: unknown }): boolean {
  return f.result !== null && f.status !== "VOID" && f.status !== "CANCELLED";
}

export function computeStandings({
  teams,
  fixtures,
  adjustments = [],
  rule,
}: {
  teams: { id: number; name: string }[];
  fixtures: TableFixture[];
  adjustments?: { teamId: number; points: number }[];
  rule: PointsRule;
}): StandingRow[] {
  const rows = new Map<number, StandingRow & { history: { date: string; outcome: Outcome }[] }>();
  for (const t of teams) {
    rows.set(t.id, {
      teamId: t.id,
      team: t.name,
      position: null,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      for: 0,
      against: 0,
      diff: 0,
      adjustment: 0,
      points: 0,
      form: [],
      history: [],
    });
  }

  for (const f of fixtures) {
    if (!isCounted(f) || !f.result) continue;
    const home = rows.get(f.homeTeamId);
    const away = rows.get(f.awayTeamId);
    const { home: hs, away: as } = f.result;
    for (const [row, own, other] of [
      [home, hs, as],
      [away, as, hs],
    ] as const) {
      if (!row) continue;
      row.played += 1;
      row.for += own;
      row.against += other;
      row.points += matchPoints(own, other, rule);
      const outcome: Outcome = own > other ? "W" : own < other ? "L" : "D";
      if (outcome === "W") row.won += 1;
      else if (outcome === "L") row.lost += 1;
      else row.drawn += 1;
      row.history.push({ date: f.date, outcome });
    }
  }

  for (const a of adjustments) {
    const row = rows.get(a.teamId);
    if (!row) continue;
    row.adjustment += a.points;
    row.points += a.points;
  }

  const list = [...rows.values()].map(({ history, ...row }) => ({
    ...row,
    diff: row.for - row.against,
    form: history
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 5)
      .map((h) => h.outcome),
  }));

  list.sort(
    (a, b) =>
      b.points - a.points || b.diff - a.diff || b.for - a.for || b.won - a.won || a.team.localeCompare(b.team),
  );

  const anyoneScored = list.some((r) => r.played > 0 || r.adjustment !== 0);
  if (anyoneScored) {
    list.forEach((row, i) => {
      const prev = list[i - 1];
      row.position =
        prev && prev.points === row.points && prev.diff === row.diff && prev.for === row.for ? prev.position : i + 1;
    });
  }
  return list;
}
