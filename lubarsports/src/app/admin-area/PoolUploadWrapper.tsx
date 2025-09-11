"use client";
import dynamic from "next/dynamic";

// Minimal domain types required by this UI
interface TeamLite {
  id: number;
  name: string;
}

interface NominationLite {
  teamId: number;
  gameNumber: number;
  playerName: string;
  locked?: boolean;
}

interface FixtureLite {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: TeamLite;
  awayTeam: TeamLite;
  poolNominations: NominationLite[];
}

const PoolUpload = dynamic(() => import("./pool-upload"), { ssr: false });

export default function PoolUploadWrapper({ fixtures, team, captain }: { fixtures: FixtureLite[], team: TeamLite, captain?: { id: number; email: string } }) {
  if (!fixtures || fixtures.length === 0) {
    return <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-400">No upcoming Open A&apos;s Pool fixtures.</div>;
  }
  return (
    <>
      {fixtures.map((fixture) => {
        const isHome = fixture.homeTeamId === team.id;
        const myNoms = fixture.poolNominations.filter((n) => n.teamId === team.id);
        const oppNoms = fixture.poolNominations.filter((n) => n.teamId !== team.id);
        return (
          <div key={fixture.id} className="mb-8">
            <PoolUpload
              fixture={fixture}
              team={team}
              isHome={isHome}
              myNoms={myNoms}
              oppNoms={oppNoms}
            />
          </div>
        );
      })}
    </>
  );
} 