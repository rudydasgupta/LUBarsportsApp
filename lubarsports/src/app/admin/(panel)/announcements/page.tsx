import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, londonIso } from "@/lib/dates";
import { EditAnnouncement, NewAnnouncementForm } from "./announcement-forms";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  await requireUser({ roles: ["SUPER", "GENERAL"] });
  const items = await db.announcement.findMany({ orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }] });
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-4xl">Announcements</h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] text-muted">
          Shown at the top of the homepage: rearranged fixtures, finals nights, socials. Up to five are shown, pinned ones first.
        </p>
      </div>

      <section className="card p-4 sm:p-5" aria-labelledby="new-heading">
        <h2 id="new-heading" className="mb-3 text-xl font-bold">
          New announcement
        </h2>
        <NewAnnouncementForm />
      </section>

      {items.length === 0 ? (
        <p className="text-muted">No announcements yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const expired = a.expiresAt !== null && a.expiresAt <= now;
            return (
              <li key={a.id} className={`card p-4 sm:p-5 ${expired ? "opacity-70" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{a.title}</h2>
                  {a.pinned ? <span className="tag border-chalk text-chalk">Pinned</span> : null}
                  <span className={`tag ${expired ? "" : "border-win text-win"}`}>{expired ? "Hidden" : "Live"}</span>
                </div>
                <p className="text-[0.8125rem] text-muted">
                  Posted {formatDate(a.publishedAt)}
                  {a.createdBy ? ` by ${a.createdBy}` : ""}
                  {a.expiresAt ? ` · ${expired ? "hidden since" : "hides after"} ${formatDate(a.expiresAt)}` : ""}
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-[0.875rem] font-semibold text-chalk">Edit</summary>
                  <div className="mt-3">
                    <EditAnnouncement
                      a={{
                        id: a.id,
                        title: a.title,
                        body: a.body,
                        tone: a.tone,
                        pinned: a.pinned,
                        expiresAt: a.expiresAt ? londonIso(a.expiresAt) : null,
                      }}
                    />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
