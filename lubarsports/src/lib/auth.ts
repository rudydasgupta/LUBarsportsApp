import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { asRole, type Actor, type Role } from "./permissions";

/**
 * Admin sessions: an HMAC-signed cookie naming the account and its token
 * version. Changing a password (or "sign out everywhere") bumps the version,
 * which invalidates every session for that account. The account is re-read on
 * every request, so a deactivated account loses access straight away.
 */

const COOKIE = "lubs_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret(): Buffer {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 32) return Buffer.from(configured);
  // Fall back to a key derived from the database URL, which is already a
  // server-only secret, so sessions work without extra configuration.
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("Set SESSION_SECRET (32+ characters) or DATABASE_URL.");
  return createHash("sha256").update(`lubarsports-session:${dbUrl}`).digest();
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

type Payload = { sub: number; v: number; exp: number };

function encode(p: Payload): string {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string | undefined): Payload | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (typeof p.sub !== "number" || typeof p.v !== "number" || typeof p.exp !== "number") return null;
    if (p.exp < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

export type SessionUser = Actor & {
  name: string;
  email: string;
  mustChangePassword: boolean;
};

export async function startSession(admin: { id: number; tokenVersion: number }) {
  const store = await cookies();
  store.set(COOKIE, encode({ sub: admin.id, v: admin.tokenVersion, exp: Math.floor(Date.now() / 1000) + MAX_AGE }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  // Remove the old, unsigned cookie from before the overhaul.
  store.delete("admin_session");
}

export async function endSession() {
  const store = await cookies();
  store.delete(COOKIE);
  store.delete("admin_session");
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const payload = decode(store.get(COOKIE)?.value);
  if (!payload) return null;
  const admin = await db.admin.findUnique({ where: { id: payload.sub } });
  if (!admin || !admin.active || admin.tokenVersion !== payload.v) return null;
  return {
    id: admin.id,
    role: asRole(admin.adminType),
    college: admin.college,
    name: admin.fullName?.trim() || admin.email,
    email: admin.email,
    mustChangePassword: admin.mustChangePassword,
  };
});

/**
 * For admin pages and actions. Sends visitors to sign in, users without the
 * right role to the overview, and users with a temporary password to set a
 * new one first.
 */
export async function requireUser(options: { roles?: readonly Role[]; allowPasswordChange?: boolean } = {}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.mustChangePassword && !options.allowPasswordChange) redirect("/admin/account?first=1");
  if (options.roles && !options.roles.includes(user.role)) redirect("/admin?denied=1");
  return user;
}
