export function PlayerDetail() {
  return (
    <main className="flex min-h-0 flex-col overflow-y-auto bg-bg">
      <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
        <span
          className="mb-4 text-4xl text-accent leading-none"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
        >
          Lono Notes
        </span>
        <p className="max-w-md text-sm text-text-dim">
          Select a player from the sidebar, or add one to get started.
        </p>
        <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-px bg-border-dim">
          <Stub label="Exploits" />
          <Stub label="Applied Tags" />
          <Stub label="Notable Hands" />
          <Stub label="Notes" />
        </div>
      </div>
    </main>
  );
}

function Stub({ label }: { label: string }) {
  return (
    <div className="flex h-12 items-center bg-surface px-4">
      <span className="section-label">{label}</span>
    </div>
  );
}
