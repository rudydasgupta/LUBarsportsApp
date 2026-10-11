import { db } from "./db";

export type AnnouncementView = {
  id: number;
  title: string;
  body: string;
  tone: "info" | "success" | "warning";
  pinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
};

const TONES = ["info", "success", "warning"] as const;

export async function getLiveAnnouncements(): Promise<AnnouncementView[]> {
  const now = new Date();
  const rows = await db.announcement.findMany({
    where: { publishedAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: 5,
  });
  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    tone: (TONES as readonly string[]).includes(a.tone) ? (a.tone as AnnouncementView["tone"]) : "info",
    pinned: a.pinned,
    publishedAt: a.publishedAt.toISOString(),
    expiresAt: a.expiresAt?.toISOString() ?? null,
  }));
}
