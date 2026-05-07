import { useState } from 'react';
import type { Player, PlayerType } from '../types';
import { PLAYER_TYPES } from '../types';
import { useStore } from '../store';

const ORDER: PlayerType[] = [
  'unknown',
  'fish',
  'whale',
  'nit',
  'reg',
  'lag',
  'maniac',
  'watch',
];

export function TypePicker({ player }: { player: Player }) {
  const setType = useStore((s) => s.setType);
  const typeLabels = useStore((s) => s.typeLabels);
  const setTypeLabel = useStore((s) => s.setTypeLabel);

  const [editing, setEditing] = useState<PlayerType | null>(null);
  const [draft, setDraft] = useState('');

  const labelFor = (t: PlayerType) => typeLabels[t] ?? PLAYER_TYPES[t].label;

  const startEdit = (t: PlayerType) => {
    setDraft(labelFor(t));
    setEditing(t);
  };

  const commit = () => {
    if (editing) setTypeLabel(editing, draft);
    setEditing(null);
  };

  if (editing) {
    const meta = PLAYER_TYPES[editing];
    return (
      <div className="flex items-center gap-2">
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: meta.hex }} />
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(null);
          }}
          placeholder={meta.label}
          className="w-32 border border-accent-dim bg-bg px-1.5 py-0.5 text-xs text-text focus:border-accent focus:outline-none"
        />
        <span className="text-[10px] text-text-mute">Enter · Esc · empty resets</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {ORDER.map((t) => {
        const meta = PLAYER_TYPES[t];
        const active = player.type === t;
        return (
          <button
            key={t}
            type="button"
            title={`${labelFor(t)}  (right-click to rename)`}
            onClick={() => setType(player.id, t)}
            onContextMenu={(e) => {
              e.preventDefault();
              startEdit(t);
            }}
            className={`size-3 rounded-full transition-transform ${
              active ? 'ring-1 ring-offset-2 ring-offset-surface scale-110' : 'opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: meta.hex, ['--tw-ring-color' as string]: meta.hex }}
          />
        );
      })}
    </div>
  );
}
