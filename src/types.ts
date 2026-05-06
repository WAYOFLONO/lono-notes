export type PlayerType =
  | 'unknown'
  | 'fish'
  | 'whale'
  | 'nit'
  | 'reg'
  | 'lag'
  | 'maniac'
  | 'watch';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  notes: string;
  createdAt: string;
  lastSeen: string;
  lastTagged: string;
  encounters: number;
  starred: boolean;
}

export const PLAYER_TYPES: Record<PlayerType, { label: string; hex: string; letter: string }> = {
  unknown: { label: 'Unknown', hex: '#5aa8a8', letter: '?' },
  fish: { label: 'Fish', hex: '#5a7ba8', letter: 'F' },
  whale: { label: 'Whale', hex: '#9568b0', letter: 'W' },
  nit: { label: 'Nit', hex: '#5b8c5a', letter: 'N' },
  reg: { label: 'Solid Reg', hex: '#d4b94a', letter: 'R' },
  lag: { label: 'LAG', hex: '#d68a3c', letter: 'L' },
  maniac: { label: 'Maniac', hex: '#c84a4a', letter: 'M' },
  watch: { label: 'Watch', hex: '#c87aa8', letter: 'X' },
};
