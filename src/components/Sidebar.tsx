export function Sidebar() {
  return (
    <aside className="flex min-h-0 flex-col border-r border-border bg-surface">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border-dim px-3">
        <span className="section-label">Players</span>
        <span className="text-[10px] text-text-mute">0</span>
      </div>
      <div className="border-b border-border-dim p-2">
        <input
          type="text"
          placeholder="Search…"
          className="w-full border border-border-dim bg-bg px-2 py-1.5 text-sm text-text placeholder:text-text-mute focus:border-accent-dim focus:outline-none"
        />
      </div>
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-text-mute">
        No players yet.
      </div>
    </aside>
  );
}
