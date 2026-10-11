"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, str, type ActionState } from "@/lib/action-state";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEnterResult } from "@/lib/permissions";

const MAX_SCORE = 99;

function parseScore(raw: string): number | null | "bad" {
  if (raw === "") return null;
  if (!/^\d{1,2}$/.test(raw)) return "bad";
  const n = Number(raw);
  return n > MAX_SCORE ? "bad" : n;
}

async function loadFixtures(ids: number[]) {
  return db.fixture.findMany({
    where: { id: { in: ids } },
    include: { division: true, homeTeam: true, awayTeam: true, result: true, season: true },
  });
}

/**
 * Saves every changed score on the results sheet in one go. Rows left blank
 * are skipped; clearing a result is a separate, deliberate action.
 */
export async function saveResults(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const intent = str(form, "intent");
  if (intent.startsWith("clear:")) return clearResult(user, Number(intent.slice(6)));

  const ids = str(form, "ids")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) return fail("There are no fixtures on this sheet.");

  const fixtures = await loadFixtures(ids);
  const errors: Record<string, string> = {};
  const changes: { fixture: (typeof fixtures)[number]; home: number; away: number; details: string | null }[] = [];

  for (const f of fixtures) {
    // Read-only rows (disabled inputs) aren't submitted.
    if (!form.has(`home_${f.id}`)) continue;
    const home = parseScore(str(form, `home_${f.id}`));
    const away = parseScore(str(form, `away_${f.id}`));
    const details = str(form, `notes_${f.id}`).slice(0, 1000) || null;
    const label = `${f.homeTeam.name} v ${f.awayTeam.name}`;
    if (home === null && away === null) {
      if (f.result && details !== (f.result.details?.trim() || null)) errors[`row_${f.id}`] = "Enter both scores to save the notes.";
      continue;
    }
    if (home === "bad" || away === "bad") {
      errors[`row_${f.id}`] = `Scores must be whole numbers from 0 to ${MAX_SCORE}.`;
      continue;
    }
    if (home === null || away === null) {
      errors[`row_${f.id}`] = "Enter both scores, or leave both blank.";
      continue;
    }
    const unchanged =
      f.result && f.result.homeScore === home && f.result.awayScore === away && (f.result.details?.trim() || null) === details;
    if (unchanged) continue;
    if (!canEnterResult(user, { sport: f.division.sport, home: f.homeTeam.name, away: f.awayTeam.name })) {
      errors[`row_${f.id}`] = `You can't enter results for ${label}.`;
      continue;
    }
    if (f.season.status === "ARCHIVED" && user.role !== "SUPER") {
      errors[`row_${f.id}`] = "That season is archived. Only a super admin can change its results.";
      continue;
    }
    changes.push({ fixture: f, home, away, details });
  }

  if (Object.keys(errors).length) {
    return fail(
      `Nothing was saved. Fix the ${Object.keys(errors).length === 1 ? "highlighted row" : `${Object.keys(errors).length} highlighted rows`} and try again.`,
      errors,
    );
  }
  if (changes.length === 0) return ok("No changes to save.");

  await db.$transaction(
    changes.flatMap(({ fixture, home, away, details }) => [
      db.result.upsert({
        where: { fixtureId: fixture.id },
        update: { homeScore: home, awayScore: away, details, enteredBy: user.name },
        create: { fixtureId: fixture.id, homeScore: home, awayScore: away, details, enteredBy: user.name },
      }),
      // A score means the match happened, whatever it was marked as before.
      ...(fixture.status !== "SCHEDULED" ? [db.fixture.update({ where: { id: fixture.id }, data: { status: "SCHEDULED" } })] : []),
    ]),
  );

  const odd: string[] = [];
  for (const { fixture, home, away } of changes) {
    const was = fixture.result ? ` (was ${fixture.result.homeScore}–${fixture.result.awayScore})` : "";
    await audit(
      user,
      "result.save",
      `${fixture.division.name}, week ${fixture.week ?? "?"}: ${fixture.homeTeam.name} ${home}–${away} ${fixture.awayTeam.name}${was}`,
    );
    const frames = fixture.division.framesPerMatch;
    if (frames && home + away !== frames) odd.push(`${fixture.homeTeam.name} v ${fixture.awayTeam.name} (${home + away} of ${frames})`);
  }

  revalidatePath("/", "layout");
  return ok(`Saved ${changes.length} ${changes.length === 1 ? "result" : "results"}. Tables are updated.`, {
    warning: odd.length
      ? `Check ${odd.length === 1 ? "this score" : "these scores"}: the frames don't add up to a full match. ${odd.join("; ")}. Saved anyway, in case a match was conceded or cut short.`
      : undefined,
  });
}

async function clearResult(user: Awaited<ReturnType<typeof requireUser>>, fixtureId: number): Promise<ActionState> {
  const [f] = await loadFixtures([fixtureId]);
  if (!f) return fail("That fixture no longer exists.");
  if (!f.result) return ok("That fixture has no result to clear.");
  if (!canEnterResult(user, { sport: f.division.sport, home: f.homeTeam.name, away: f.awayTeam.name })) {
    return fail("You can't change results for that fixture.");
  }
  if (f.season.status === "ARCHIVED" && user.role !== "SUPER") return fail("That season is archived.");
  await db.result.delete({ where: { fixtureId } });
  await audit(
    user,
    "result.clear",
    `${f.division.name}, week ${f.week ?? "?"}: cleared ${f.homeTeam.name} ${f.result.homeScore}–${f.result.awayScore} ${f.awayTeam.name}`,
  );
  revalidatePath("/", "layout");
  return ok(`Cleared ${f.homeTeam.name} v ${f.awayTeam.name}. Points have been taken off the table.`);
}
