/**
 * Creates an admin account, or updates an existing one, from a terminal.
 * Use it to set up the first super admin, or to get back in if every super
 * admin is locked out.
 *
 *   npx tsx scripts/set-admin.ts --email you@lancaster.ac.uk --name "Your Name" --role SUPER
 *
 * You'll be asked for the password (typing is hidden). Or pass --generate to
 * create a temporary one, which must be changed at first sign-in.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { createInterface } from "node:readline";
import { ROLES } from "../src/lib/permissions";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput.bind(rl);
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      write(s.startsWith(question) ? question : s.replace(/[^\r\n]/g, ""));
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function temporaryPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const group = () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join("");
  return [group(), group(), group(), group()].join("-");
}

async function main() {
  const email = arg("email")?.toLowerCase();
  const name = arg("name");
  const role = (arg("role") ?? "SUPER").toUpperCase();
  const college = arg("college") ?? null;
  if (!email) throw new Error("Pass --email.");
  if (!(ROLES as readonly string[]).includes(role)) throw new Error(`--role must be one of ${ROLES.join(", ")}.`);

  let password: string;
  let mustChangePassword = false;
  if (process.argv.includes("--generate")) {
    password = temporaryPassword();
    mustChangePassword = true;
  } else {
    if (!process.stdin.isTTY) throw new Error("Run this in a terminal to type a password, or pass --generate.");
    password = await askHidden("New password (10+ characters): ");
    if (password.length < 10) throw new Error("Use at least 10 characters.");
    if ((await askHidden("Type it again: ")) !== password) throw new Error("The passwords don't match.");
  }

  const db = new PrismaClient();
  try {
    const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/[/?].*$/, "");
    const hash = await bcrypt.hash(password, 12);
    const existing = await db.admin.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    const data = { adminType: role, college, active: true, password: hash, mustChangePassword };
    if (existing) {
      await db.admin.update({
        where: { id: existing.id },
        data: { ...data, ...(name ? { fullName: name } : {}), tokenVersion: { increment: 1 } },
      });
    } else {
      await db.admin.create({ data: { ...data, email, fullName: name ?? null } });
    }
    await db.auditLog.create({
      data: { actorName: "Script", action: existing ? "user.update" : "user.create", summary: `${existing ? "Updated" : "Created"} ${email} as ${role} from the command line` },
    });
    console.log(`${existing ? "Updated" : "Created"} ${email} (${role}) on ${host}.`);
    if (mustChangePassword) console.log(`Temporary password: ${password}\nIt must be changed at first sign-in.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
