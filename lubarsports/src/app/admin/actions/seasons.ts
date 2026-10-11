"use server";

import { revalidatePath } from "next/cache";
import { fail, int, ok, str, type ActionState } from "@/lib/action-state";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDaysIso, isoToStored, isValidIso, londonIso, weekdayIndex, weekStartIso } from "@/lib/dates";
import { createSeason as create, slugForSeason } from "@/lib/season-admin";

const supers = () => requireUser({ roles: ["SUPER"] });

function validateDates(errors: Record<string, string>, michaelmasStart: string, lentStart: string) {
  if (!isValidIso(michaelmasStart) || weekdayIndex(michaelmasStart) !== 0) errors.michaelmasStart = "Choose the Monday of Michaelmas week 1.";
  if (!isValidIso(lentStart) || weekdayIndex(lentStart) !== 0) errors.lentStart = "Choose the Monday of Lent week 11.";
  else if (isValidIso(michaelmasStart) && lentStart <= addDaysIso(michaelmasStart, 9 * 7)) errors.lentStart = "Lent week 11 must come after Michaelmas week 10.";
}

export async function createSeason(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await supers();
  const name = str(form, "name");
  const michaelmasStart = str(form, "michaelmasStart");
  const lentStart = str(form, "lentStart");
  const winBonus = int(form, "winBonus") ?? 2;
  const drawBonus = int(form, "drawBonus") ?? 0;
  const divisionIds = form.getAll("divisionIds").map(Number).filter(Boolean);
  const generateFixtures = form.get("generateFixtures") === "on";
  const swapHomeAway = form.get("swapHomeAway") === "on";
  const makeCurrent = form.get("makeCurrent") === "on";

  const errors: Record<string, string> = {};
  const slug = slugForSeason(name);
  if (!/^\d{4}\/\d{2}$/.test(name)) errors.name = "Use the form 2027/28.";
  validateDates(errors, michaelmasStart, lentStart);
  if (winBonus < 0 || winBonus > 10) errors.winBonus = "0 to 10.";
  if (drawBonus < 0 || drawBonus > 10) errors.drawBonus = "0 to 10.";
  if (generateFixtures && divisionIds.length === 0) errors.divisionIds = "Choose at least one league.";
  if (!errors.name && (await db.season.findFirst({ where: { OR: [{ name }, { slug }] } }))) errors.name = "That season already exists.";
  if (Object.keys(errors).length) return fail("Fix the highlighted fields.", errors);

  const result = await db.$transaction((tx) =>
    create(tx, { name, slug, michaelmasStart, lentStart, winBonus, drawBonus, divisionIds, generateFixtures, swapHomeAway, makeCurrent }),
  );
  await audit(
    user,
    "season.create",
    `Created ${name}${result.created ? ` with ${result.created} fixtures` : ""}${swapHomeAway ? " (home and away swapped)" : ""}${makeCurrent ? " and made it current" : ""}`,
  );
  revalidatePath("/", "layout");
  return ok(`Created ${name}${result.created ? ` with ${result.created} fixtures` : ""}.`, {
    warning: result.missing.length ? `Some fixtures were skipped because these teams are missing: ${result.missing.join("; ")}.` : undefined,
  });
}

export async function updateSeason(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await supers();
  const id = int(form, "id");
  const season = id ? await db.season.findUnique({ where: { id } }) : null;
  if (!season) return fail("Season not found.");
  const michaelmasStart = str(form, "michaelmasStart");
  const lentStart = str(form, "lentStart");
  const winBonus = int(form, "winBonus") ?? season.winBonus;
  const drawBonus = int(form, "drawBonus") ?? season.drawBonus;
  const notes = str(form, "notes").slice(0, 500) || null;
  const moveFixtures = form.get("moveFixtures") === "on";

  const errors: Record<string, string> = {};
  validateDates(errors, michaelmasStart, lentStart);
  if (winBonus < 0 || winBonus > 10) errors.winBonus = "0 to 10.";
  if (drawBonus < 0 || drawBonus > 10) errors.drawBonus = "0 to 10.";
  if (Object.keys(errors).length) return fail("Fix the highlighted fields.", errors);

  const datesChanged = londonIso(season.michaelmasStart) !== michaelmasStart || londonIso(season.lentStart) !== lentStart;
  const updated = { michaelmasStart, lentStart };
  let moved = 0;
  await db.$transaction(async (tx) => {
    await tx.season.update({
      where: { id: season.id },
      data: { michaelmasStart: isoToStored(michaelmasStart), lentStart: isoToStored(lentStart), winBonus, drawBonus, notes },
    });
    if (datesChanged && moveFixtures) {
      const fixtures = await tx.fixture.findMany({ where: { seasonId: season.id, week: { not: null } }, include: { division: true } });
      for (const f of fixtures) {
        const date = isoToStored(addDaysIso(weekStartIso(updated, f.week!), f.division.matchDay));
        if (date.getTime() !== f.date.getTime()) {
          await tx.fixture.update({ where: { id: f.id }, data: { date } });
          moved++;
        }
      }
    }
  });
  const bits = [
    datesChanged ? `term dates ${michaelmasStart} / ${lentStart}` : null,
    season.winBonus !== winBonus || season.drawBonus !== drawBonus ? `points rule +${winBonus} win, +${drawBonus} draw` : null,
    moved ? `moved ${moved} fixtures` : null,
  ].filter(Boolean);
  await audit(user, "season.update", `${season.name}: ${bits.join(", ") || "saved"}`);
  revalidatePath("/", "layout");
  return ok(`${season.name} saved${moved ? `, and ${moved} fixtures moved to match the new dates` : ""}.`);
}

export async function makeCurrent(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await supers();
  const id = int(form, "id");
  const season = id ? await db.season.findUnique({ where: { id } }) : null;
  if (!season) return fail("Season not found.");
  const archiveOthers = form.get("archiveOthers") !== "off";
  await db.$transaction([
    ...(archiveOthers ? [db.season.updateMany({ where: { status: "ACTIVE", id: { not: season.id } }, data: { status: "ARCHIVED" } })] : []),
    db.season.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } }),
    db.season.update({ where: { id: season.id }, data: { isCurrent: true, status: "ACTIVE" } }),
  ]);
  await audit(user, "season.current", `${season.name} is now the current season`);
  revalidatePath("/", "layout");
  return ok(`${season.name} is now the current season.`);
}

export async function setSeasonStatus(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await supers();
  const id = int(form, "id");
  const status = str(form, "status");
  if (!["UPCOMING", "ACTIVE", "ARCHIVED"].includes(status)) return fail("Unknown status.");
  const season = id ? await db.season.findUnique({ where: { id } }) : null;
  if (!season) return fail("Season not found.");
  if (season.isCurrent && status !== "ACTIVE") return fail("Make another season current first.");
  await db.season.update({ where: { id: season.id }, data: { status } });
  await audit(user, status === "ARCHIVED" ? "season.archive" : "season.update", `${season.name}: status ${status.toLowerCase()}`);
  revalidatePath("/", "layout");
  return ok(`${season.name} is now ${status.toLowerCase()}.`);
}
