"use server";

import { revalidatePath } from "next/cache";
import { fail, int, ok, str, type ActionState } from "@/lib/action-state";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { FIXTURE_STATUS_LABEL } from "@/lib/config";
import { db } from "@/lib/db";
import { addDaysIso, formatShortDay, isoToStored, isValidIso, londonIso, weekdayIndex, weekForIso } from "@/lib/dates";

const STATUSES = ["SCHEDULED", "POSTPONED", "CANCELLED"] as const;

async function managers() {
  return requireUser({ roles: ["SUPER", "GENERAL"] });
}

function done(message: string) {
  revalidatePath("/", "layout");
  return ok(message);
}

export async function updateFixture(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await managers();
  const id = int(form, "id");
  const date = str(form, "date");
  const homeTeamId = int(form, "homeTeamId");
  const awayTeamId = int(form, "awayTeamId");
  const status = str(form, "status");
  const notes = str(form, "notes").slice(0, 500) || null;

  const fixture = id ? await db.fixture.findUnique({ where: { id }, include: { season: true, division: true, homeTeam: true, awayTeam: true, result: true } }) : null;
  if (!fixture) return fail("That fixture no longer exists.");
  const errors: Record<string, string> = {};
  if (!isValidIso(date)) errors.date = "Choose a date.";
  if (!homeTeamId || !awayTeamId) errors.homeTeamId = "Choose both teams.";
  else if (homeTeamId === awayTeamId) errors.awayTeamId = "A team can't play itself.";
  if (!(STATUSES as readonly string[]).includes(status)) errors.status = "Choose a status.";
  if (Object.keys(errors).length) return fail("Fix the highlighted fields.", errors);

  const teams = await db.team.findMany({ where: { id: { in: [homeTeamId!, awayTeamId!] }, divisionId: fixture.divisionId } });
  if (teams.length !== 2) return fail("Both teams must be in this league.");
  if (fixture.result && status === "CANCELLED") return fail("Clear the result before cancelling this fixture.");

  const week = weekForIso(fixture.season, date) ?? fixture.week;
  try {
    await db.fixture.update({
      where: { id: fixture.id },
      data: { date: isoToStored(date), week, homeTeamId: homeTeamId!, awayTeamId: awayTeamId!, status, notes },
    });
  } catch {
    return fail("Those two teams already have a fixture on that date in this league.");
  }

  const name = (tid: number) => teams.find((t) => t.id === tid)!.name;
  const changes: string[] = [];
  if (londonIso(fixture.date) !== date) changes.push(`moved to ${formatShortDay(date)}`);
  if (fixture.homeTeamId !== homeTeamId || fixture.awayTeamId !== awayTeamId) changes.push(`now ${name(homeTeamId!)} v ${name(awayTeamId!)}`);
  if (fixture.status !== status) changes.push(FIXTURE_STATUS_LABEL[status].toLowerCase());
  if ((fixture.notes ?? null) !== notes) changes.push("notes updated");
  await audit(
    user,
    "fixture.update",
    `${fixture.division.name}: ${fixture.homeTeam.name} v ${fixture.awayTeam.name} ${changes.join(", ") || "saved"}`,
  );
  return done("Fixture saved.");
}

export async function createFixture(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await managers();
  const seasonId = int(form, "seasonId");
  const divisionId = int(form, "divisionId");
  const date = str(form, "date");
  const homeTeamId = int(form, "homeTeamId");
  const awayTeamId = int(form, "awayTeamId");

  const errors: Record<string, string> = {};
  if (!divisionId) errors.divisionId = "Choose a league.";
  if (!isValidIso(date)) errors.date = "Choose a date.";
  if (!homeTeamId) errors.homeTeamId = "Choose the home team.";
  if (!awayTeamId) errors.awayTeamId = "Choose the away team.";
  else if (homeTeamId === awayTeamId) errors.awayTeamId = "A team can't play itself.";
  if (Object.keys(errors).length) return fail("Fix the highlighted fields.", errors);

  const [season, division] = await Promise.all([
    seasonId ? db.season.findUnique({ where: { id: seasonId } }) : null,
    db.division.findUnique({ where: { id: divisionId! }, include: { teams: true } }),
  ]);
  if (!season || !division) return fail("Season or league not found.");
  const home = division.teams.find((t) => t.id === homeTeamId);
  const away = division.teams.find((t) => t.id === awayTeamId);
  if (!home || !away) return fail("Both teams must be in the chosen league.");

  try {
    await db.fixture.create({
      data: {
        seasonId: season.id,
        divisionId: division.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        date: isoToStored(date),
        week: weekForIso(season, date),
      },
    });
  } catch {
    return fail("Those two teams already have a fixture on that date in this league.");
  }
  await audit(user, "fixture.create", `${division.name}: added ${home.name} v ${away.name} on ${formatShortDay(date)}`);
  return done(`Added ${home.name} v ${away.name}.`);
}

export async function deleteFixture(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await managers();
  const id = int(form, "id");
  const f = id ? await db.fixture.findUnique({ where: { id }, include: { result: true, division: true, homeTeam: true, awayTeam: true } }) : null;
  if (!f) return fail("That fixture no longer exists.");
  if (f.result) return fail("This fixture has a result. Clear the result first.");
  await db.$transaction([db.poolNomination.deleteMany({ where: { fixtureId: f.id } }), db.fixture.delete({ where: { id: f.id } })]);
  await audit(user, "fixture.delete", `${f.division.name}: deleted ${f.homeTeam.name} v ${f.awayTeam.name} (${formatShortDay(londonIso(f.date))})`);
  return done("Fixture deleted.");
}

/**
 * Moves a whole week (one league or all of them) to the week beginning on a
 * new Monday. Each league keeps its usual match night.
 */
export async function rescheduleWeek(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await managers();
  const seasonId = int(form, "seasonId");
  const week = int(form, "week");
  const divisionId = int(form, "divisionId");
  const monday = str(form, "monday");
  const unplayedOnly = form.get("unplayedOnly") === "on";

  if (!seasonId || !week) return fail("Choose a week.");
  if (!isValidIso(monday) || weekdayIndex(monday) !== 0) return fail("Choose the Monday of the new week.", { monday: "Must be a Monday." });

  const season = await db.season.findUnique({ where: { id: seasonId } });
  if (!season) return fail("Season not found.");
  const fixtures = await db.fixture.findMany({
    where: { seasonId, week, status: { not: "VOID" }, ...(divisionId ? { divisionId } : {}), ...(unplayedOnly ? { result: null } : {}) },
    include: { division: true },
  });
  if (fixtures.length === 0) return fail("There are no fixtures to move in that week.");

  const newWeek = weekForIso(season, monday);
  try {
    await db.$transaction(
      fixtures.map((f) =>
        db.fixture.update({
          where: { id: f.id },
          data: { date: isoToStored(addDaysIso(monday, f.division.matchDay)), week: newWeek ?? f.week, status: f.status === "POSTPONED" ? "SCHEDULED" : f.status },
        }),
      ),
    );
  } catch {
    return fail("Some of those fixtures clash with fixtures already in the new week.");
  }
  const scope = divisionId ? fixtures[0].division.name : "All leagues";
  await audit(user, "fixture.reschedule", `${scope}: moved ${fixtures.length} week ${week} fixtures to the week of ${formatShortDay(monday)}`);
  return done(`Moved ${fixtures.length} ${fixtures.length === 1 ? "fixture" : "fixtures"} to the week of ${formatShortDay(monday)}${newWeek ? ` (week ${newWeek})` : ""}.`);
}

/** Marks every unplayed fixture in a week as postponed, e.g. for a cancelled match night. */
export async function postponeWeek(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await managers();
  const seasonId = int(form, "seasonId");
  const week = int(form, "week");
  const divisionId = int(form, "divisionId");
  if (!seasonId || !week) return fail("Choose a week.");
  const { count } = await db.fixture.updateMany({
    where: { seasonId, week, status: "SCHEDULED", result: null, ...(divisionId ? { divisionId } : {}) },
    data: { status: "POSTPONED" },
  });
  if (count === 0) return fail("There are no unplayed fixtures to postpone in that week.");
  const scope = divisionId ? (await db.division.findUnique({ where: { id: divisionId } }))?.name : "All leagues";
  await audit(user, "fixture.update", `${scope}: postponed ${count} week ${week} fixtures`);
  return done(`Postponed ${count} ${count === 1 ? "fixture" : "fixtures"}.`);
}
