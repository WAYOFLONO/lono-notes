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
  return (
    <div className="flex items-center gap-1.5">
      {ORDER.map((t) => {
        const meta = PLAYER_TYPES[t];
        const active = player.type === t;
        return (
          <button
            key={t}
            type="button"
            title={meta.label}
            onClick={() => setType(player.id, t)}
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
