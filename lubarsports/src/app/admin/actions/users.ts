"use server";

import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { fail, int, ok, str, type ActionState } from "@/lib/action-state";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { COLLEGE_NAMES } from "@/lib/config";
import { db } from "@/lib/db";
import { ROLE_LABEL, ROLES, type Role } from "@/lib/permissions";

const supers = () => requireUser({ roles: ["SUPER"] });

/** Readable temporary password: four groups of four, no look-alike characters. */
function temporaryPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const group = () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join("");
  return [group(), group(), group(), group()].join("-");
}

function readRole(form: FormData, errors: Record<string, string>) {
  const role = str(form, "role") as Role;
  if (!(ROLES as readonly string[]).includes(role)) errors.role = "Choose a role.";
  const college = str(form, "college") || null;
  if (college && !COLLEGE_NAMES.includes(college)) errors.college = "Choose a college.";
  if ((role === "CPC" || role === "CDC") && !college) errors.college = "Coordinators need a college.";
  return { role, college: role === "CPC" || role === "CDC" ? college : null };
}

async function superCount(excludingId?: number) {
  return db.admin.count({ where: { adminType: "SUPER", active: true, ...(excludingId ? { id: { not: excludingId } } : {}) } });
}

export async function createUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await supers();
  const fullName = str(form, "fullName").slice(0, 80);
  const email = str(form, "email").toLowerCase();
  const errors: Record<string, string> = {};
  if (!fullName) errors.fullName = "Enter their name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  const { role, college } = readRole(form, errors);
  if (!errors.email && (await db.admin.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }))) {
    errors.email = "There's already an account with that email.";
  }
  if (Object.keys(errors).length) return fail("Fix the highlighted fields.", errors);

  const password = temporaryPassword();
  await db.admin.create({
    data: { fullName, email, adminType: role, college, password: await bcrypt.hash(password, 12), mustChangePassword: true },
  });
  await audit(user, "user.create", `Added ${fullName} (${email}) as ${ROLE_LABEL[role]}${college ? `, ${college}` : ""}`);
  revalidatePath("/admin/users");
  return ok(`Added ${fullName}. Their temporary password is below; they'll choose their own when they first sign in.`, { secret: password });
}

export async function updateUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await supers();
  const id = int(form, "id");
  const target = id ? await db.admin.findUnique({ where: { id } }) : null;
  if (!target) return fail("Account not found.");
  const fullName = str(form, "fullName").slice(0, 80);
  const active = form.get("active") === "on";
  const errors: Record<string, string> = {};
  if (!fullName) errors.fullName = "Enter their name.";
  const { role, college } = readRole(form, errors);
  if (Object.keys(errors).length) return fail("Fix the highlighted fields.", errors);
  if (target.adminType === "SUPER" && (role !== "SUPER" || !active) && (await superCount(target.id)) === 0) {
    return fail("This is the only active super admin. Make someone else a super admin first.");
  }
  if (target.id === user.id && !active) return fail("You can't deactivate your own account.");

  await db.admin.update({
    where: { id: target.id },
    data: {
      fullName,
      adminType: role,
      college,
      active,
      // Losing access should take effect straight away.
      ...(!active || role !== target.adminType ? { tokenVersion: { increment: 1 } } : {}),
    },
  });
  const changes = [
    target.adminType !== role ? `role ${ROLE_LABEL[role]}` : null,
    (target.college ?? null) !== college ? `college ${college ?? "none"}` : null,
    target.active !== active ? (active ? "reactivated" : "deactivated") : null,
    (target.fullName ?? "") !== fullName ? `name ${fullName}` : null,
  ].filter(Boolean);
  await audit(user, "user.update", `${fullName} (${target.email}): ${changes.join(", ") || "saved"}`);
  revalidatePath("/admin/users");
  return ok(`${fullName} saved.`);
}

export async function resetPassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await supers();
  const id = int(form, "id");
  const target = id ? await db.admin.findUnique({ where: { id } }) : null;
  if (!target) return fail("Account not found.");
  const password = temporaryPassword();
  await db.admin.update({
    where: { id: target.id },
    data: { password: await bcrypt.hash(password, 12), mustChangePassword: true, tokenVersion: { increment: 1 } },
  });
  await audit(user, "user.reset", `Reset the password for ${target.fullName || target.email}`);
  revalidatePath("/admin/users");
  return ok(`New temporary password for ${target.fullName || target.email}. They've been signed out everywhere.`, { secret: password });
}

export async function deleteUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await supers();
  const id = int(form, "id");
  const target = id ? await db.admin.findUnique({ where: { id } }) : null;
  if (!target) return fail("Account not found.");
  if (target.id === user.id) return fail("You can't remove your own account.");
  if (target.adminType === "SUPER" && (await superCount(target.id)) === 0) return fail("You can't remove the only super admin.");
  await db.admin.delete({ where: { id: target.id } });
  await audit(user, "user.delete", `Removed ${target.fullName || target.email} (${target.email})`);
  revalidatePath("/admin/users");
  return ok(`Removed ${target.fullName || target.email}.`);
}
