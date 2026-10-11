import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crest } from "@/components/crest";
import { FixtureList } from "@/components/fixture-list";
import { FormChips } from "@/components/form-chips";
import { RankBall } from "@/components/rank-ball";
import { Eyebrow, SectionHeading, TableScroll } from "@/components/states";
import { collegeBySlug, COLLEGES } from "@/lib/config";
import { todayIso } from "@/lib/dates";
import { getArchivedSeasons, loadCurrentSeason, loadSeason, type SeasonData } from "@/lib/season-data";

type Props = { params: Promise<{ college: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { college } = await params;
  const c = collegeBySlug(college);
  return { title: c ? `${c.name} College` : "College" };
}

function positions(data: SeasonData, college: string) {
  return data.leagues
    .map((l) => ({ league: l.league, row: l.standings.find((r) => r.team === college), size: l.standings.length }))
    .filter((x): x is typeof x & { row: NonNullable<typeof x.row> } => Boolean(x.row));
}

export default async function CollegePage({ params }: Props) {
  const { college: slug } = await params;
  const college = collegeBySlug(slug);
  if (!college) notFound();

  const [data, archived] = await Promise.all([loadCurrentSeason(), getArchivedSeasons()]);
  const previous = archived[0] ? await loadSeason(archived[0].id) : null;
  const today = todayIso();

  const mine = (data?.fixtures ?? []).filter((f) => f.home === college.name || f.away === college.name);
  const upcoming = mine.filter((f) => !f.result && f.status !== "CANCELLED" && f.date >= today).slice(0, 8);
  const recent = mine.filter((f) => f.result).reverse().slice(0, 8);
  const rows = data ? positions(data, college.name) : [];
  const total = rows.reduce(
    (t, { row }) => ({ w: t.w + row.won, d: t.d + row.drawn, l: t.l + row.lost, pts: t.pts + row.points, f: t.f + row.for }),
    { w: 0, d: 0, l: 0, pts: 0, f: 0 },
  );
  const lastSeason = previous ? positions(previous, college.name) : [];
  const index = COLLEGES.findIndex((c) => c.slug === college.slug);
  const prevCollege = COLLEGES[(index + COLLEGES.length - 1) % COLLEGES.length];
  const nextCollege = COLLEGES[(index + 1) % COLLEGES.length];

  return (
    <div className="space-y-12">
      <section className="card-glow overflow-hidden" aria-labelledby="college-heading">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: college.color }} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-25 blur-3xl"
          style={{ background: college.color }}
        />
        <div className="relative flex flex-wrap items-center gap-6 px-5 py-7 sm:px-8">
          <Crest college={college.name} size="xl" />
          <div className="min-w-0 flex-1">
            <Eyebrow>{data ? `Season ${data.season.name}` : "College"}</Eyebrow>
            <h1 id="college-heading" className="display mt-2 text-[2.5rem] sm:text-6xl">
              {college.name}
            </h1>
          </div>
          <nav aria-label="Other colleges" className="flex gap-2">
            <Link href={`/colleges/${prevCollege.slug}`} className="btn btn-sm">
              <span aria-hidden="true">&larr;</span> {prevCollege.name}
            </Link>
            <Link href={`/colleges/${nextCollege.slug}`} className="btn btn-sm">
              {nextCollege.name} <span aria-hidden="true">&rarr;</span>
            </Link>
          </nav>
        </div>
        <dl className="relative grid grid-cols-2 border-t border-line sm:grid-cols-4 sm:divide-x sm:divide-line [&>div:nth-child(-n+2)]:border-b [&>div:nth-child(-n+2)]:border-line sm:[&>div:nth-child(-n+2)]:border-b-0">
          {[
            { label: "Leagues", value: String(rows.length) },
            { label: "Won · Drawn · Lost", value: `${total.w}·${total.d}·${total.l}` },
            { label: "Frames won", value: String(total.f) },
            { label: "Total points", value: String(total.pts) },
          ].map((s) => (
            <div key={s.label} className="px-5 py-4 sm:px-6">
              <dt className="eyebrow text-[0.625rem] text-muted">{s.label}</dt>
              <dd className="num mt-1.5 text-[1.5rem] font-semibold leading-none sm:text-[1.75rem]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="positions-heading">
        <SectionHeading id="positions-heading" eyebrow="Every league" title="League positions" />
        <TableScroll label={`${college.name} league positions`}>
          <table className="table min-w-[34rem]">
            <thead>
              <tr>
                <th scope="col">League</th>
                <th scope="col">Position</th>
                <th scope="col" className="text-right">
                  P
                </th>
                <th scope="col" className="text-right">
                  W-D-L
                </th>
                <th scope="col" className="text-right">
                  Pts
                </th>
                <th scope="col" className="hidden sm:table-cell">
                  Form
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ league, row, size }) => (
                <tr key={league.id}>
                  <th scope="row">
                    <Link href={`/leagues/${league.slug}`} className="font-semibold hover:text-chalk">
                      {league.name}
                    </Link>
                    <span className="block text-[0.75rem] text-muted">{league.sport}</span>
                  </th>
                  <td>
                    {row.position ? (
                      <span className="inline-flex items-center gap-2">
                        <RankBall rank={row.position} />
                        <span className="text-[0.8125rem] text-muted">of {size}</span>
                      </span>
                    ) : (
                      <span className="text-muted">&ndash;</span>
                    )}
                  </td>
                  <td className="num text-right text-muted">{row.played}</td>
                  <td className="num text-right text-muted">
                    {row.won}-{row.drawn}-{row.lost}
                  </td>
                  <td className="num text-right text-[1.0625rem] font-bold">{row.points}</td>
                  <td className="hidden sm:table-cell">
                    <FormChips form={row.form} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="upcoming-heading" className="min-w-0">
          <SectionHeading id="upcoming-heading" eyebrow="All leagues" title="Coming up" />
          <FixtureList fixtures={upcoming} group="none" highlight={college.name} empty="No upcoming fixtures." />
        </section>
        <section aria-labelledby="recent-heading" className="min-w-0">
          <SectionHeading id="recent-heading" eyebrow="All leagues" title="Recent results" />
          <FixtureList fixtures={recent} group="none" highlight={college.name} empty="No results yet this season." />
        </section>
      </div>

      {previous && lastSeason.length > 0 ? (
        <section aria-labelledby="last-heading">
          <SectionHeading
            id="last-heading"
            eyebrow="Archive"
            title={`${previous.season.name} finishes`}
            action={
              <Link href={`/archive/${previous.season.slug}`} className="link text-sm font-semibold">
                {previous.season.name} archive
              </Link>
            }
          />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {lastSeason.map(({ league, row, size }) => (
              <li key={league.id}>
                <Link
                  href={`/archive/${previous.season.slug}/${league.slug}`}
                  className="card flex h-full flex-col gap-2 p-4 transition-colors hover:border-line-strong"
                >
                  <span className="text-[0.8125rem] font-semibold text-muted">{league.name}</span>
                  {row.position && row.played > 0 ? (
                    <span className="flex items-center gap-2">
                      <RankBall rank={row.position} size="lg" />
                      <span className="text-[0.8125rem] text-muted">
                        of {size}
                        <span className="num block font-semibold text-ink">{row.points} pts</span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted">Not played</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
