"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate } from "@/utils/dateFormat";

export default function LeagueFixturesPage() {
  const params = useParams();
  const league = params.league as string;
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Map URL slugs to division names
  const leagueMap: Record<string, string> = {
    "open-darts": "Open Darts",
    "womens-darts": "Women's+ Darts",
    "dominoes": "Dominoes",
    "open-as-pool": "Open A's Pool",
    "open-bs-pool": "Open B's Pool",
    "womens-pool": "Women's+ Pool",
  };

  const divisionName = leagueMap[league];

  useEffect(() => {
    if (!divisionName) return;
    
    fetch(`/api/fixtures`)
      .then(res => res.json())
      .then(data => {
        // Filter fixtures for this specific division
        const filteredFixtures = data.fixtures.filter((f: any) => f.division === divisionName);
        setFixtures(filteredFixtures);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load fixtures', err);
        setLoading(false);
      });
  }, [divisionName]);

  if (!divisionName) {
    return (
      <main className="min-h-screen flex flex-col items-center bg-white text-black p-4">
        <h1 className="text-3xl font-bold mb-8 text-center">League Not Found</h1>
        <Link 
          href="/fixtures" 
          className="menu-link inline-block px-4 py-2 text-lg font-semibold"
        >
          Back to Fixtures
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-white text-black p-4">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{divisionName} Fixtures</h1>
                  <Link 
          href="/fixtures" 
          className="menu-link inline-block px-4 py-2 text-lg font-semibold"
        >
          Back to All Leagues
        </Link>
        </div>

        <div className="bg-gray-100 rounded-lg p-6 min-h-[300px] flex flex-col items-center justify-center">
          {loading ? (
            <span className="text-xl text-gray-500">Loading fixtures...</span>
          ) : fixtures.length === 0 ? (
            <span className="text-xl text-gray-500">No fixtures found for {divisionName}.</span>
          ) : (
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Home</th>
                  <th className="px-4 py-2 border">Score</th>
                  <th className="px-4 py-2 border">Away</th>
                </tr>
              </thead>
              <tbody>
                {fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(f => (
                  <tr key={f.id}>
                    <td className="px-4 py-2 border text-center">{formatDate(f.date)}</td>
                    <td className="px-4 py-2 border text-center">{f.homeTeam.name}</td>
                    <td className="px-4 py-2 border text-center font-semibold">
                      {f.result ? `${f.result.homeScore} - ${f.result.awayScore}` : 'TBD'}
                    </td>
                    <td className="px-4 py-2 border text-center">{f.awayTeam.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
