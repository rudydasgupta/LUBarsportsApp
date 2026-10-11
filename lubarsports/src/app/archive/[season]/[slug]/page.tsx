import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeagueView } from "@/components/league-view";
import { getCurrentSeason, getSeasonBySlug, loadSeason } from "@/lib/season-data";

type Props = { params: Promise<{ season: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season, slug } = await params;
  const s = await getSeasonBySlug(season);
  const data = s ? await loadSeason(s.id) : null;
  const league = data?.leagues.find((l) => l.league.slug === slug);
  return { title: league && s ? `${league.league.name} ${s.name}` : "Archive" };
}

export default async function ArchivedLeaguePage({ params }: Props) {
  const { season: seasonSlug, slug } = await params;
  const [season, current] = await Promise.all([getSeasonBySlug(seasonSlug), getCurrentSeason()]);
  if (!season) notFound();
  const data = await loadSeason(season.id);
  const league = data?.leagues.find((l) => l.league.slug === slug);
  if (!data || !league) notFound();
  return <LeagueView data={league} season={season} archived={current?.id !== season.id} />;
}
