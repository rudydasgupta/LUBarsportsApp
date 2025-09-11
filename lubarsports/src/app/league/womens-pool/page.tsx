"use client";
import { useEffect, useState } from "react";

interface Team {
  id: number;
  name: string;
  points: number;
}

export default function WomensPoolLeaguePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/league-tables")
      .then((res) => res.json())
      .then((data) => {
        const division = data.divisions.find((d: any) => d.name === "Women's+ Pool");
        const teams = division ? division.teams : [];
        // Sort by points in descending order (highest points first)
        const sortedTeams = teams.sort((a: Team, b: Team) => b.points - a.points);
        setTeams(sortedTeams);
        setLoading(false);
      });
  }, []);

  return (
    <main className="max-w-2xl mx-auto p-4 bg-white text-black">
      <h1 className="text-3xl font-bold mb-6 text-center">Women&apos;s+ Pool League Table</h1>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <table className="min-w-full border border-gray-300 mb-2">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-2 border">Pos</th>
              <th className="px-4 py-2 border">College</th>
              <th className="px-4 py-2 border">Points</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.id} className={index < 3 ? "bg-yellow-50" : ""}>
                <td className="px-4 py-2 border text-center font-bold">
                  {index + 1}
                  {index === 0 && " 🥇"}
                  {index === 1 && " 🥈"}
                  {index === 2 && " 🥉"}
                </td>
                <td className="px-4 py-2 border font-medium">{team.name}</td>
                <td className="px-4 py-2 border text-center font-bold">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
} 