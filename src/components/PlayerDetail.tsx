import { useState } from 'react';
import { useStore } from '../store';
import { TypePicker } from './TypePicker';
import { NotesEditor } from './NotesEditor';

export function PlayerDetail() {
  const player = useStore((s) => s.selectedPlayer());
  const removePlayer = useStore((s) => s.removePlayer);
  const renamePlayer = useStore((s) => s.renamePlayer);
  const toggleStar = useStore((s) => s.toggleStar);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  if (!player) {
    return (
      <main className="flex min-h-0 flex-col items-center justify-center bg-bg p-12 text-center">
        <span
          className="mb-4 text-4xl text-accent leading-none"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
        >
          Lono Notes
        </span>
        <p className="max-w-md text-sm text-text-dim">
          Select a player from the sidebar, or add one to get started.
        </p>
      </main>
    );
  }

  const onDelete = async () => {
    if (!confirm(`Delete ${player.name}? This cannot be undone.`)) return;
    await removePlayer(player.id);
  };

  const startEditName = () => {
    setNameDraft(player.name);
    setEditingName(true);
  };

  const commitName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== player.name) {
      try {
        await renamePlayer(player.id, trimmed);
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    }
    setEditingName(false);
  };

  return (
    <main className="flex min-h-0 flex-col bg-bg">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-dim bg-surface px-4">
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') setEditingName(false);
            }}
            className="min-w-0 flex-1 border border-accent-dim bg-bg px-2 py-1 text-base text-text focus:border-accent focus:outline-none"
          />
        ) : (
          <h1
            onClick={startEditName}
            className="min-w-0 flex-1 cursor-text truncate text-base text-text hover:text-accent"
            title="Click to rename"
          >
            {player.name}
          </h1>
        )}
        <TypePicker player={player} />
        <button
          type="button"
          onClick={() => toggleStar(player.id)}
          className={`text-base ${player.starred ? 'text-accent' : 'text-text-mute hover:text-accent'}`}
          aria-label={player.starred ? 'Unstar' : 'Star'}
        >
          {player.starred ? '★' : '☆'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="border border-border-dim px-2 py-1 text-xs text-text-mute transition-colors hover:border-danger hover:text-danger"
        >
          Delete
        </button>
      </header>
      <NotesEditor key={player.id} player={player} />
    </main>
  );
}
