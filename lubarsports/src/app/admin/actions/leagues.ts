"use server";

import { revalidatePath } from "next/cache";
import { fail, int, ok, str, type ActionState } from "@/lib/action-state";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { DAY_NAMES } from "@/lib/config";
import { db } from "@/lib/db";

export async function updateLeague(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser({ roles: ["SUPER", "GENERAL"] });
  const id = int(form, "id");
  const matchDay = int(form, "matchDay");
  const framesRaw = str(form, "framesPerMatch");
  const framesPerMatch = framesRaw === "" ? null : int(form, "framesPerMatch");
  const sortOrder = int(form, "sortOrder") ?? 0;
  const active = form.get("active") === "on";

  const league = id ? await db.division.findUnique({ where: { id } }) : null;
  if (!league) return fail("League not found.");
  const errors: Record<string, string> = {};
  if (matchDay === null || matchDay < 0 || matchDay > 6) errors.matchDay = "Choose a match night.";
  if (framesRaw !== "" && (framesPerMatch === null || framesPerMatch < 1 || framesPerMatch > 50)) errors.framesPerMatch = "Between 1 and 50, or blank.";
  if (Object.keys(errors).length) return fail("Fix the highlighted fields.", errors);

  await db.division.update({ where: { id: league.id }, data: { matchDay: matchDay!, framesPerMatch, sortOrder, active } });
  const changes = [
    league.matchDay !== matchDay ? `match night ${DAY_NAMES[matchDay!]}` : null,
    league.framesPerMatch !== framesPerMatch ? `${framesPerMatch ?? "no"} frames per match` : null,
    league.sortOrder !== sortOrder ? `order ${sortOrder}` : null,
    league.active !== active ? (active ? "active" : "inactive") : null,
  ].filter(Boolean);
  await audit(user, "league.update", `${league.name}: ${changes.join(", ") || "saved"}`);
  revalidatePath("/", "layout");
  return ok(`${league.name} saved.`);
}

export async function addAdjustment(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser({ roles: ["SUPER", "GENERAL"] });
  const seasonId = int(form, "seasonId");
  const teamId = int(form, "teamId");
  const points = int(form, "points");
  const reason = str(form, "reason").slice(0, 200);

  const errors: Record<string, string> = {};
  if (!teamId) errors.teamId = "Choose a league and college.";
  if (points === null || points === 0 || Math.abs(points) > 100) errors.points = "A whole number, e.g. -3 or 2.";
  if (!reason) errors.reason = "Say why, e.g. “Didn't turn up, week 4”. It's shown under the table.";
  if (Object.keys(errors).length) return fail("Fix the highlighted fields.", errors);

  const [season, team] = await Promise.all([
    seasonId ? db.season.findUnique({ where: { id: seasonId } }) : null,
    db.team.findUnique({ where: { id: teamId! }, include: { division: true } }),
  ]);
  if (!season || !team) return fail("Season or team not found.");
  await db.pointsAdjustment.create({
    data: { seasonId: season.id, divisionId: team.divisionId, teamId: team.id, points: points!, reason, createdBy: user.name },
  });
  await audit(user, "adjustment.create", `${team.division.name}: ${team.name} ${points! > 0 ? "+" : ""}${points} (${reason})`);
  revalidatePath("/", "layout");
  return ok(`${team.name} ${points! > 0 ? "+" : ""}${points} in ${team.division.name}.`);
}

export async function deleteAdjustment(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser({ roles: ["SUPER", "GENERAL"] });
  const id = int(form, "id");
  const a = id ? await db.pointsAdjustment.findUnique({ where: { id }, include: { team: true, division: true } }) : null;
  if (!a) return fail("That adjustment no longer exists.");
  await db.pointsAdjustment.delete({ where: { id: a.id } });
  await audit(user, "adjustment.delete", `${a.division.name}: removed ${a.team.name} ${a.points > 0 ? "+" : ""}${a.points} (${a.reason})`);
  revalidatePath("/", "layout");
  return ok("Adjustment removed.");
}
