import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollegeName } from "@/components/crest";
import { LeagueGrid, pointsRuleText } from "@/components/league-view";
import { PageHeading, SectionHeading } from "@/components/states";
import { getCurrentSeason, getSeasonBySlug, loadSeason } from "@/lib/season-data";
import { championLabel, champions } from "@/lib/summary";

type Props = { params: Promise<{ season: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;
  const s = await getSeasonBySlug(season);
  return { title: s ? `${s.name} archive` : "Archive" };
}

export default async function ArchivedSeasonPage({ params }: Props) {
  const { season: slug } = await params;
  const [season, current] = await Promise.all([getSeasonBySlug(slug), getCurrentSeason()]);
  if (!season) notFound();
  const data = await loadSeason(season.id);
  if (!data) notFound();
  const champs = champions(data);
  const isCurrent = current?.id === season.id;

  return (
    <>
      <PageHeading
        eyebrow={isCurrent ? "Current season" : "Archive"}
        title={`${season.name} season`}
        lead={<>Final league tables. Points: {pointsRuleText(season)}.</>}
      >
        <Link href="/archive" className="btn">
          All seasons
        </Link>
      </PageHeading>

      {champs.length > 0 ? (
        <section aria-labelledby="champions-heading" className="mb-12">
          <SectionHeading id="champions-heading" eyebrow={season.name} title={isCurrent ? "Leading the way" : "Champions"} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {champs.map((c) => (
              <li key={c.leagueSlug} className={c.complete || isCurrent ? "card-glow p-4" : "card p-4"}>
                <p className="eyebrow text-[0.5625rem] text-chalk">{championLabel(c, !isCurrent)}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <CollegeName college={c.team} size="md" bold link={false} className="text-xl" />
                  <span className="num text-sm text-muted">
                    {c.points} pts / {c.played}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <LeagueGrid leagues={data.leagues} base={`/archive/${season.slug}`} />
    </>
  );
}
