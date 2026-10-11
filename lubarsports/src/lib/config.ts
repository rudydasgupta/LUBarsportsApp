export const site = {
  name: "LU Bar Sports",
  fullName: "Lancaster University Bar Sports",
  description:
    "League tables, fixtures and results for Lancaster University's inter-college pool, darts and dominoes leagues.",
  contact: "Rudy Dasgupta",
  timeZone: "Europe/London",
} as const;

export type College = {
  name: string;
  slug: string;
  logo: string;
  /** Accent used for the college's stripe and badges. */
  color: string;
};

export const COLLEGES: readonly College[] = [
  { name: "Bowland", slug: "bowland", logo: "/colleges/bowland.png", color: "#d90429" },
  { name: "Cartmel", slug: "cartmel", logo: "/colleges/cartmel.png", color: "#a3124f" },
  { name: "County", slug: "county", logo: "/colleges/county.png", color: "#1f5fa3" },
  { name: "Furness", slug: "furness", logo: "/colleges/furness.png", color: "#5a46c2" },
  { name: "Fylde", slug: "fylde", logo: "/colleges/fylde.png", color: "#ff9900" },
  { name: "Graduate", slug: "graduate", logo: "/colleges/graduate.png", color: "#c8102e" },
  { name: "Grizedale", slug: "grizedale", logo: "/colleges/grizedale.png", color: "#1a7be0" },
  { name: "Lonsdale", slug: "lonsdale", logo: "/colleges/lonsdale.png", color: "#3a6ea5" },
  { name: "Pendle", slug: "pendle", logo: "/colleges/pendle.png", color: "#ffb800" },
];

export const COLLEGE_NAMES = COLLEGES.map((c) => c.name);

export function collegeByName(name: string): College | undefined {
  return COLLEGES.find((c) => c.name === name);
}

export function collegeBySlug(slug: string): College | undefined {
  return COLLEGES.find((c) => c.slug === slug.toLowerCase());
}

/** Placeholder team used by old fixtures for weeks without matches. */
export const PLACEHOLDER_TEAM = "N/A";

export const SPORTS = ["Pool", "Darts", "Dominoes"] as const;
export type Sport = (typeof SPORTS)[number];

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const FIXTURE_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  POSTPONED: "Postponed",
  CANCELLED: "Cancelled",
  VOID: "Void",
};
