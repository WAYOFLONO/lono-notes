export function Header() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-baseline gap-3">
        <span
          className="text-2xl text-accent leading-none"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
        >
          Lono
        </span>
        <span className="section-label">Notes</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-text-dim">
        <span className="section-label">Game Mode</span>
        <button
          type="button"
          disabled
          className="border border-border-dim px-2 py-1 text-text-mute transition-colors hover:text-text"
        >
          Open Overlay
        </button>
      </div>
    </header>
  );
}
