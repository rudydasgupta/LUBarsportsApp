import { db } from "./db";

export const AUDIT_LABEL: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.password": "Changed password",
  "result.save": "Saved result",
  "result.clear": "Cleared result",
  "fixture.update": "Edited fixture",
  "fixture.create": "Added fixture",
  "fixture.delete": "Deleted fixture",
  "fixture.reschedule": "Rescheduled week",
  "league.update": "Edited league",
  "adjustment.create": "Adjusted points",
  "adjustment.delete": "Removed adjustment",
  "season.create": "Created season",
  "season.update": "Edited season",
  "season.current": "Changed current season",
  "season.archive": "Archived season",
  "season.migrate": "Data migration",
  "user.create": "Added admin",
  "user.update": "Edited admin",
  "user.reset": "Reset password",
  "user.delete": "Removed admin",
  "announcement.create": "Posted announcement",
  "announcement.update": "Edited announcement",
  "announcement.delete": "Removed announcement",
};

export function auditLabel(action: string): string {
  return AUDIT_LABEL[action] ?? action;
}

/** Records an admin action. Never throws: a logging failure must not undo the change. */
export async function audit(actor: { id: number; name: string } | null, action: string, summary: string) {
  try {
    await db.auditLog.create({
      data: { actorId: actor?.id ?? null, actorName: actor?.name ?? "System", action, summary: summary.slice(0, 1000) },
    });
  } catch (error) {
    console.error("Audit log write failed", error);
  }
}
