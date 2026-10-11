import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeagueView } from "@/components/league-view";
import { loadCurrentSeason } from "@/lib/season-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadCurrentSeason();
  const league = data?.leagues.find((l) => l.league.slug === slug);
  return { title: league ? `${league.league.name} table` : "League" };
}

export default async function LeaguePage({ params }: Props) {
  const { slug } = await params;
  const data = await loadCurrentSeason();
  const league = data?.leagues.find((l) => l.league.slug === slug);
  if (!data || !league) notFound();
  return <LeagueView data={league} season={data.season} archived={false} />;
}
