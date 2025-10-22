"use client";

export default function ResetPointsButton() {
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to reset all league points to zero and clear all results? This action cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/reset-points', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(`Reset complete! Updated ${data.teamsUpdated} teams and deleted ${data.resultsDeleted} results.`);
        location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to reset points: ' + (err.error || res.status));
      }
    } catch (_) {
      alert('Network error while resetting points.');
    }
  };

  return (
    <form onSubmit={handleReset}>
      <button type="submit" className="menu-link inline-block px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700">
        Reset All Points & Results
      </button>
    </form>
  );
}


