export const ROLES = ["SUPER", "GENERAL", "CPC", "CDC"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  SUPER: "Super admin",
  GENERAL: "Admin",
  CPC: "College pool coordinator",
  CDC: "College darts coordinator",
};

export const ROLE_SHORT: Record<Role, string> = {
  SUPER: "Super",
  GENERAL: "Admin",
  CPC: "CPC",
  CDC: "CDC",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  SUPER: "Everything, including admin accounts and seasons.",
  GENERAL: "Results, fixtures, leagues and announcements for every league.",
  CPC: "Results for pool and dominoes, for their college's fixtures.",
  CDC: "Results for darts and dominoes, for their college's fixtures.",
};

export function asRole(value: string): Role {
  return (ROLES as readonly string[]).includes(value) ? (value as Role) : "GENERAL";
}

export type Actor = { id: number; role: Role; college: string | null };

export const isCoordinator = (u: Actor) => u.role === "CPC" || u.role === "CDC";
export const canManageUsers = (u: Actor) => u.role === "SUPER";
export const canManageSeasons = (u: Actor) => u.role === "SUPER";
/** Fixtures, league settings, points adjustments and announcements. */
export const canManageLeagues = (u: Actor) => u.role === "SUPER" || u.role === "GENERAL";
export const canViewAudit = (u: Actor) => u.role === "SUPER" || u.role === "GENERAL";

export function canEnterResultsForSport(u: Actor, sport: string): boolean {
  if (u.role === "SUPER" || u.role === "GENERAL") return true;
  if (u.role === "CPC") return sport === "Pool" || sport === "Dominoes";
  if (u.role === "CDC") return sport === "Darts" || sport === "Dominoes";
  return false;
}

export function canEnterResult(u: Actor, fixture: { sport: string; home: string; away: string }): boolean {
  if (!canEnterResultsForSport(u, fixture.sport)) return false;
  if (isCoordinator(u) && u.college) return fixture.home === u.college || fixture.away === u.college;
  return true;
}
