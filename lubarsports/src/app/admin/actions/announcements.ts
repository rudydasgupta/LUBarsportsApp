"use server";

import { revalidatePath } from "next/cache";
import { fail, int, ok, str, type ActionState } from "@/lib/action-state";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isValidIso } from "@/lib/dates";

function read(form: FormData) {
  const title = str(form, "title").slice(0, 120);
  const body = str(form, "body").slice(0, 2000);
  const tone = ["info", "success", "warning"].includes(str(form, "tone")) ? str(form, "tone") : "info";
  const pinned = form.get("pinned") === "on";
  const expires = str(form, "expiresAt");
  const errors: Record<string, string> = {};
  if (!title) errors.title = "Give it a title.";
  if (!body) errors.body = "Write the announcement.";
  if (expires && !isValidIso(expires)) errors.expiresAt = "Choose a date, or leave blank.";
  // Shown until the end of the chosen day.
  const expiresAt = expires && isValidIso(expires) ? new Date(`${expires}T23:59:59Z`) : null;
  return { data: { title, body, tone, pinned, expiresAt }, errors };
}

export async function createAnnouncement(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser({ roles: ["SUPER", "GENERAL"] });
  const { data, errors } = read(form);
  if (Object.keys(errors).length) return fail("Fix the highlighted fields.", errors);
  await db.announcement.create({ data: { ...data, createdBy: user.name } });
  await audit(user, "announcement.create", `Posted “${data.title}”`);
  revalidatePath("/", "layout");
  return ok("Posted. It's on the homepage now.");
}

export async function updateAnnouncement(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser({ roles: ["SUPER", "GENERAL"] });
  const id = int(form, "id");
  const { data, errors } = read(form);
  if (!id) return fail("Announcement not found.");
  if (Object.keys(errors).length) return fail("Fix the highlighted fields.", errors);
  await db.announcement.update({ where: { id }, data });
  await audit(user, "announcement.update", `Edited “${data.title}”`);
  revalidatePath("/", "layout");
  return ok("Saved.");
}

export async function deleteAnnouncement(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser({ roles: ["SUPER", "GENERAL"] });
  const id = int(form, "id");
  const a = id ? await db.announcement.findUnique({ where: { id } }) : null;
  if (!a) return fail("Announcement not found.");
  await db.announcement.delete({ where: { id: a.id } });
  await audit(user, "announcement.delete", `Removed “${a.title}”`);
  revalidatePath("/", "layout");
  return ok("Removed.");
}
