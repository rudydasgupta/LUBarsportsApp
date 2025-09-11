"use client";
import { useState } from "react";

interface TeamLite { id: number; name: string }
interface NominationLite { gameNumber: number; playerName: string; locked?: boolean }
interface FixtureLite { id: number; homeTeam: TeamLite; awayTeam: TeamLite; awayTeamId: number }

export default function PoolUpload({ fixture, team, isHome, myNoms, oppNoms }: { fixture: FixtureLite, team: TeamLite, isHome: boolean, myNoms: NominationLite[], oppNoms: NominationLite[] }) {
  const [inputs, setInputs] = useState(Array(5).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Build nomination map for quick lookup
  const myNomMap = Object.fromEntries(myNoms.map((n: any) => [n.gameNumber, n]));
  const oppNomMap = Object.fromEntries(oppNoms.map((n: any) => [n.gameNumber, n]));

  // Determine which team is away/home
  const isAway = fixture.awayTeamId === team.id;

  // For each game, determine whose turn it is
  function isMyTurn(gameIdx: number) {
    // Game 1: Away, Game 2: Home, Game 3: Away, ...
    const awayFirst = gameIdx % 2 === 0;
    return (isAway && awayFirst) || (!isAway && !awayFirst);
  }

  async function handleLock(gameIdx: number) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/pool-nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixtureId: fixture.id,
          gameNumber: gameIdx + 1,
          playerName: inputs[gameIdx],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error locking nomination");
      } else {
        setSuccess(true);
        // Optionally, refresh nominations here
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">Women&apos;s+ Pool Nominations for {fixture.homeTeam.name} vs {fixture.awayTeam.name}</h2>
      <table className="min-w-full border border-gray-300 mb-4">
        <thead>
          <tr className="table-header">
            <th className="px-4 py-2 border">Game</th>
            <th className="px-4 py-2 border">Home ({fixture.homeTeam.name})</th>
            <th className="px-4 py-2 border">Away ({fixture.awayTeam.name})</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => {
            const myNom = myNomMap[i + 1];
            const oppNom = oppNomMap[i + 1];
            const myLocked = myNom?.locked;
            const oppLocked = oppNom?.locked;
            const myTurn = isMyTurn(i);
            return (
              <tr key={i}>
                <td className="px-4 py-2 border text-center">{i + 1}</td>
                <td className="px-4 py-2 border text-center">
                  {isHome ? (
                    myLocked ? (
                      <span className="font-semibold">{myNom?.playerName}</span>
                    ) : myTurn ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={inputs[i]}
                          onChange={e => setInputs(arr => arr.map((v, idx) => idx === i ? e.target.value : v))}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                          disabled={submitting}
                        />
                        <button
                          className="bg-[color:var(--lu-red)] text-white rounded px-3 py-1 font-semibold"
                          onClick={() => handleLock(i)}
                          disabled={submitting || !inputs[i]}
                        >Lock In</button>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Waiting...</span>
                    )
                  ) : (
                    oppLocked ? <span className="font-semibold">{oppNom?.playerName}</span> : <span className="text-gray-400 italic">Not locked</span>
                  )}
                </td>
                <td className="px-4 py-2 border text-center">
                  {!isHome ? (
                    myLocked ? (
                      <span className="font-semibold">{myNom?.playerName}</span>
                    ) : myTurn ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={inputs[i]}
                          onChange={e => setInputs(arr => arr.map((v, idx) => idx === i ? e.target.value : v))}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                          disabled={submitting}
                        />
                        <button
                          className="bg-[color:var(--lu-red)] text-white rounded px-3 py-1 font-semibold"
                          onClick={() => handleLock(i)}
                          disabled={submitting || !inputs[i]}
                        >Lock In</button>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Waiting...</span>
                    )
                  ) : (
                    oppLocked ? <span className="font-semibold">{oppNom?.playerName}</span> : <span className="text-gray-400 italic">Not locked</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && <div className="text-red-600 text-center">{error}</div>}
      {success && <div className="text-green-600 text-center">Nomination locked!</div>}
    </div>
  );
} 