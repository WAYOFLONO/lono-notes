import { useState } from 'react';
import { useStore } from '../store';

export function Header() {
  const addPlayer = useStore((s) => s.addPlayer);
  const playerCount = useStore((s) => Object.keys(s.players).length);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    try {
      await addPlayer(trimmed);
      setName('');
      setAdding(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          title={`${sidebarCollapsed ? 'Show' : 'Hide'} player list  (Ctrl/⌘+B)`}
          aria-label={sidebarCollapsed ? 'Show player list' : 'Hide player list'}
          className="text-sm text-text-dim transition-colors hover:text-accent"
        >
          {sidebarCollapsed ? '▶' : '◀'}
        </button>
        <span
          className="text-2xl text-accent leading-none"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
        >
          Lono
        </span>
        <span className="section-label">Notes</span>
        <span className="text-[10px] text-text-mute">{playerCount}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {adding ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') {
                setName('');
                setAdding(false);
              }
            }}
            onBlur={submit}
            placeholder="Player name…"
            className="w-56 border border-accent-dim bg-bg px-2 py-1 text-sm text-text placeholder:text-text-mute focus:border-accent focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="border border-border-dim px-2 py-1 text-text-dim transition-colors hover:border-accent-dim hover:text-text"
          >
            + Player
          </button>
        )}
      </div>
    </header>
  );
}
