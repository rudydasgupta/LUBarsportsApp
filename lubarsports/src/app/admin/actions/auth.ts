"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fail, ok, str, type ActionState } from "@/lib/action-state";
import { audit } from "@/lib/audit";
import { endSession, requireUser, startSession } from "@/lib/auth";
import { db } from "@/lib/db";

// Compared against when the email is unknown, so a wrong email and a wrong
// password take the same time and give the same answer.
const DUMMY_HASH = bcrypt.hashSync("no-such-account", 10);

export async function signIn(_prev: ActionState, form: FormData): Promise<ActionState> {
  const email = str(form, "email").toLowerCase();
  const password = typeof form.get("password") === "string" ? (form.get("password") as string) : "";
  if (!email || !password) return fail("Enter your email and password.");

  const admin = await db.admin.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  const valid = await bcrypt.compare(password, admin?.password ?? DUMMY_HASH);
  if (!admin || !valid || !admin.active) {
    await new Promise((r) => setTimeout(r, 400));
    return fail("That email and password don't match an active admin account.");
  }

  await db.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await startSession(admin);
  await audit({ id: admin.id, name: admin.fullName || admin.email }, "auth.login", `${admin.fullName || admin.email} signed in`);

  const next = str(form, "next");
  redirect(admin.mustChangePassword ? "/admin/account?first=1" : next.startsWith("/admin") ? next : "/admin");
}

export async function signOut() {
  await endSession();
  redirect("/admin/login?signedout=1");
}

export async function changePassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser({ allowPasswordChange: true });
  const current = (form.get("current") as string) ?? "";
  const next = (form.get("password") as string) ?? "";
  const confirm = (form.get("confirm") as string) ?? "";

  const admin = await db.admin.findUnique({ where: { id: user.id } });
  if (!admin) return fail("Account not found.");
  const errors: Record<string, string> = {};
  if (!(await bcrypt.compare(current, admin.password))) errors.current = "That isn't your current password.";
  if (next.length < 10) errors.password = "Use at least 10 characters.";
  else if (next === current) errors.password = "Choose a password you haven't used here before.";
  if (next !== confirm) errors.confirm = "The two passwords don't match.";
  if (Object.keys(errors).length) return fail("Your password wasn't changed.", errors);

  const updated = await db.admin.update({
    where: { id: admin.id },
    data: { password: await bcrypt.hash(next, 12), mustChangePassword: false, tokenVersion: { increment: 1 } },
  });
  // Every other session is now signed out; keep this one.
  await startSession(updated);
  await audit(user, "auth.password", `${user.name} changed their password`);
  revalidatePath("/admin", "layout");
  return ok("Password changed. Any other devices you were signed in on have been signed out.");
}

export async function updateProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser({ allowPasswordChange: true });
  const fullName = str(form, "fullName");
  if (!fullName) return fail("Enter your name.", { fullName: "Enter your name." });
  await db.admin.update({ where: { id: user.id }, data: { fullName: fullName.slice(0, 80) } });
  revalidatePath("/admin", "layout");
  return ok("Name saved.");
}

export async function signOutEverywhere(): Promise<void> {
  const user = await requireUser({ allowPasswordChange: true });
  await db.admin.update({ where: { id: user.id }, data: { tokenVersion: { increment: 1 } } });
  await endSession();
  redirect("/admin/login?signedout=1");
}
