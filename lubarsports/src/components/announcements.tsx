import type { AnnouncementView } from "@/lib/announcements";
import { formatDate } from "@/lib/dates";

const TONE = {
  info: "border-chalk",
  success: "border-win",
  warning: "border-cue",
} as const;

const DOT = {
  info: "bg-[#ff3b52]",
  success: "bg-win",
  warning: "bg-cue",
} as const;

export function Announcements({ items }: { items: AnnouncementView[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Announcements" className="grid gap-3 md:grid-cols-2">
      {items.map((a) => (
        <article key={a.id} className={`card border-l-4 px-5 py-4 ${TONE[a.tone]}`}>
          <p className="eyebrow flex items-center gap-2 text-[0.5625rem] text-muted">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${DOT[a.tone]}`} />
            {a.pinned ? "Pinned" : "Announcement"} &middot; {formatDate(a.publishedAt)}
          </p>
          <h2 className="mt-1.5 text-lg font-bold">{a.title}</h2>
          <p className="mt-1 whitespace-pre-line text-[0.9375rem] text-muted">{a.body}</p>
        </article>
      ))}
    </section>
  );
}
