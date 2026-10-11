import type { Metadata } from "next";
import { LeagueGrid, pointsRuleText } from "@/components/league-view";
import { EmptyState, PageHeading } from "@/components/states";
import { loadCurrentSeason } from "@/lib/season-data";

export const metadata: Metadata = { title: "League tables" };

export default async function LeaguesPage() {
  const data = await loadCurrentSeason();
  if (!data) return <EmptyState title="No season yet" />;
  return (
    <>
      <PageHeading
        eyebrow={`Season ${data.season.name}`}
        title="League tables"
        lead={<>Every college, every league. Points: {pointsRuleText(data.season)}.</>}
      />
      <LeagueGrid leagues={data.leagues} base="/leagues" />
    </>
  );
}
