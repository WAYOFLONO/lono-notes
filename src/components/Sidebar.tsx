import { useStore, type SortMode } from '../store';
import { PLAYER_TYPES } from '../types';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'alpha', label: 'A → Z' },
  { value: 'alphaDesc', label: 'Z → A' },
  { value: 'recent', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

export function Sidebar() {
  const query = useStore((s) => s.query);
  const setQuery = useStore((s) => s.setQuery);
  const selectedId = useStore((s) => s.selectedId);
  const setSelected = useStore((s) => s.setSelected);
  const players = useStore((s) => s.visiblePlayers());
  const total = useStore((s) => Object.keys(s.players).length);
  const sortMode = useStore((s) => s.sortMode);
  const setSortMode = useStore((s) => s.setSortMode);

  return (
    <aside className="flex min-h-0 flex-col border-r border-border bg-surface">
      <div className="flex flex-col gap-2 border-b border-border-dim p-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="w-full border border-border-dim bg-bg px-2 py-1.5 text-sm text-text placeholder:text-text-mute focus:border-accent-dim focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="section-label">Sort</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            disabled={!!query.trim()}
            className="border border-border-dim bg-bg px-1.5 py-0.5 text-xs text-text-dim focus:border-accent-dim focus:outline-none disabled:opacity-50"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {players.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-xs text-text-mute">
            {total === 0 ? 'No players yet.' : 'No matches.'}
          </div>
        ) : (
          <ul>
            {players.map((p) => {
              const meta = PLAYER_TYPES[p.type];
              const isSelected = p.id === selectedId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={`flex w-full items-center gap-2 border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-accent bg-surface-2 text-text'
                        : 'border-transparent text-text-dim hover:bg-surface-2 hover:text-text'
                    }`}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.hex }}
                      aria-label={meta.label}
                    />
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.starred && <span className="text-accent text-xs">★</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
