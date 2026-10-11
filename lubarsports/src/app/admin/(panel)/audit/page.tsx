import type { Metadata } from "next";
import Link from "next/link";
import { hrefWith } from "@/components/filters";
import { auditLabel } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Audit log" };

const PER_PAGE = 50;

const KINDS = [
  { key: "", label: "Everything" },
  { key: "result", label: "Results" },
  { key: "fixture", label: "Fixtures" },
  { key: "league", label: "Leagues" },
  { key: "adjustment", label: "Points" },
  { key: "season", label: "Seasons" },
  { key: "user", label: "Admins" },
  { key: "announcement", label: "Announcements" },
  { key: "auth", label: "Sign-ins" },
];

type Props = { searchParams: Promise<{ kind?: string; page?: string; q?: string }> };

export default async function AuditPage({ searchParams }: Props) {
  const sp = await searchParams;
  await requireUser({ roles: ["SUPER", "GENERAL"] });
  const kind = KINDS.some((k) => k.key === sp.kind) ? sp.kind : "";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = {
    ...(kind ? { action: { startsWith: `${kind}.` } } : {}),
    ...(q ? { OR: [{ summary: { contains: q, mode: "insensitive" as const } }, { actorName: { contains: q, mode: "insensitive" as const } }] } : {}),
  };
  const [entries, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    db.auditLog.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const params = { kind: kind || undefined, q: q || undefined };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-4xl">Audit log</h1>
          <p className="mt-2 text-[0.9375rem] text-muted">Every change made through the admin, newest first. {total} entries.</p>
        </div>
        <form className="flex gap-2" role="search">
          {kind ? <input type="hidden" name="kind" value={kind} /> : null}
          <input name="q" defaultValue={q} placeholder="Search, e.g. Fylde or a name" className="input w-64" aria-label="Search the audit log" />
          <button type="submit" className="btn">
            Search
          </button>
        </form>
      </div>
      <nav aria-label="Filter" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {KINDS.map((k) => (
          <Link key={k.key} href={hrefWith("/admin/audit", params, { kind: k.key || undefined, page: undefined })} className="chip" aria-current={kind === k.key ? "page" : undefined}>
            {k.label}
          </Link>
        ))}
      </nav>
      {entries.length === 0 ? (
        <p className="card px-5 py-6 text-muted">Nothing found.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table min-w-[40rem]">
            <thead>
              <tr>
                <th scope="col" className="w-44">
                  When
                </th>
                <th scope="col" className="w-40">
                  Who
                </th>
                <th scope="col">What</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="num whitespace-nowrap text-[0.8125rem] text-muted">{formatDateTime(e.createdAt)}</td>
                  <td className="font-semibold">{e.actorName ?? "System"}</td>
                  <td>
                    <span className="font-semibold">{auditLabel(e.action)}</span>
                    <span className="block text-[0.875rem] text-muted">{e.summary}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={hrefWith("/admin/audit", params, { page: String(page - 1) })} className="btn btn-sm">
              &larr; Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[0.875rem] text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={hrefWith("/admin/audit", params, { page: String(page + 1) })} className="btn btn-sm">
              Older &rarr;
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
