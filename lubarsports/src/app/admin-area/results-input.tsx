"use client";
import { useState, useEffect } from "react";

interface Fixture {
  id: number;
  date: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  result?: { homeScore: number; awayScore: number; details?: string };
}

interface ResultsInputProps {
  fixtures: Fixture[];
  coordinatorType: string;
  divisionName: string;
}

export default function ResultsInput({ fixtures, coordinatorType, divisionName }: ResultsInputProps) {
  const [results, setResults] = useState<{ [fixtureId: number]: { homeScore: number; awayScore: number; details: string } }>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  // Initialize results state with existing data
  useEffect(() => {
    const initialResults: { [fixtureId: number]: { homeScore: number; awayScore: number; details: string } } = {};
    fixtures.forEach(fixture => {
      if (fixture.result) {
        initialResults[fixture.id] = {
          homeScore: fixture.result.homeScore,
          awayScore: fixture.result.awayScore,
          details: fixture.result.details || ''
        };
      } else {
        initialResults[fixture.id] = {
          homeScore: 0,
          awayScore: 0,
          details: ''
        };
      }
    });
    setResults(initialResults);
  }, [fixtures]);

  const handleScoreChange = (fixtureId: number, team: 'home' | 'away', value: string) => {
    const score = parseInt(value) || 0;
    setResults(prev => ({
      ...prev,
      [fixtureId]: {
        ...prev[fixtureId],
        [team === 'home' ? 'homeScore' : 'awayScore']: score
      }
    }));
  };

  const handleDetailsChange = (fixtureId: number, value: string) => {
    setResults(prev => ({
      ...prev,
      [fixtureId]: {
        ...prev[fixtureId],
        details: value
      }
    }));
  };

  // Helpers: week calculations
  function getWeekStart(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 (Sun) .. 6 (Sat)
    const diff = (day + 6) % 7; // days since Monday
    d.setDate(d.getDate() - diff);
    return d;
  }

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function inSelectedWeek(dateString: string) {
    const start = selectedWeekStart;
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  }

  const currentWeekStart = getWeekStart(new Date());
  function isFixtureInCurrentWeek(dateString: string) {
    const d = new Date(dateString);
    const fixtureWeekStart = getWeekStart(d);
    return isSameDay(fixtureWeekStart, currentWeekStart);
  }

  const handleSubmit = async (fixtureId: number) => {
    setSubmitting(true);
    setMessage(null);

    try {
      const result = results[fixtureId];
      const response = await fetch('/api/fixtures/submit-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fixtureId,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          details: result.details
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Result submitted successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to submit result' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`;
    const endStr = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}`;
    return `${startStr} - ${endStr}`;
  };

  const visibleFixtures = fixtures.filter(f => inSelectedWeek(f.date));
  const isViewingCurrentWeek = isSameDay(selectedWeekStart, currentWeekStart);

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">
        {coordinatorType} Results Input - {divisionName}
      </h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button
          className="px-3 py-1 border rounded hover:bg-gray-50"
          onClick={() => setSelectedWeekStart(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() - 7);
            return getWeekStart(d);
          })}
        >
          ← Previous week
        </button>
        <div className="text-sm text-gray-700">
          Viewing week: <span className="font-medium">{formatWeekRange(selectedWeekStart)}</span>
          {isViewingCurrentWeek && <span className="ml-2 text-green-700">(current week)</span>}
        </div>
        <button
          className="px-3 py-1 border rounded hover:bg-gray-50"
          onClick={() => setSelectedWeekStart(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + 7);
            return getWeekStart(d);
          })}
        >
          Next week →
        </button>
      </div>

      {fixtures.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No fixtures found for this division.</p>
      ) : visibleFixtures.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No fixtures this week.</p>
      ) : (
        <div className="space-y-4">
          {visibleFixtures.map((fixture) => (
            <div key={fixture.id} className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-lg">
                    {fixture.homeTeam.name} vs {fixture.awayTeam.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(fixture.date)}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">{fixture.homeTeam.name}:</label>
                    <input
                      type="number"
                      min="0"
                      value={results[fixture.id]?.homeScore || 0}
                      onChange={(e) => handleScoreChange(fixture.id, 'home', e.target.value)}
                      disabled={!isFixtureInCurrentWeek(fixture.date)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <span className="text-lg font-bold">-</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      value={results[fixture.id]?.awayScore || 0}
                      onChange={(e) => handleScoreChange(fixture.id, 'away', e.target.value)}
                      disabled={!isFixtureInCurrentWeek(fixture.date)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <label className="text-sm font-medium">:{fixture.awayTeam.name}</label>
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Additional Details (optional):</label>
                <textarea
                  value={results[fixture.id]?.details || ''}
                  onChange={(e) => handleDetailsChange(fixture.id, e.target.value)}
                  disabled={!isFixtureInCurrentWeek(fixture.date)}
                  placeholder="Enter any additional match details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded resize-none disabled:bg-gray-100 disabled:text-gray-500"
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end">
                <div className="flex gap-2">
                  {isFixtureInCurrentWeek(fixture.date) && (
                    <button
                      onClick={() => handleSubmit(fixture.id)}
                      disabled={submitting}
                      className="bg-[color:var(--lu-red)] text-white px-4 py-2 rounded hover:bg-red-800 transition disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Result'}
                    </button>
                  )}
                  {isFixtureInCurrentWeek(fixture.date) && fixture.result && (
                    <button
                      onClick={async () => {
                        if (!confirm('Clear this result? Points will be reversed.')) return;
                        setSubmitting(true);
                        try {
                          const res = await fetch('/api/fixtures/delete-result', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fixtureId: fixture.id })
                          });
                          if (res.ok) {
                            setMessage({ type: 'success', text: 'Result cleared.' });
                          } else {
                            const err = await res.json().catch(() => ({} as any));
                            setMessage({ type: 'error', text: err.error || 'Failed to clear result' });
                          }
                        } catch (_) {
                          setMessage({ type: 'error', text: 'Network error. Please try again.' });
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                    >
                      Clear Result
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
