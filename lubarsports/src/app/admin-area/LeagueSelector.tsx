"use client";

interface DivisionOption {
  id: number;
  name: string;
}

export default function LeagueSelector({
  divisions,
  selected,
}: {
  divisions: DivisionOption[];
  selected: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <label className="mr-2 text-sm text-gray-700">League:</label>
      <select
        name="division"
        defaultValue={selected}
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search);
          params.set('division', e.target.value);
          const search = params.toString();
          const url = `${window.location.pathname}${search ? `?${search}` : ''}`;
          window.location.href = url;
        }}
        className="border rounded px-2 py-1"
      >
        {divisions.map((d) => (
          <option key={d.id} value={d.name}>{d.name}</option>
        ))}
      </select>
    </div>
  );
}


