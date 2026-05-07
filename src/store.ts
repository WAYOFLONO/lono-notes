import { create } from 'zustand';
import Fuse from 'fuse.js';
import type { Player, PlayerType } from './types';
import { PLAYER_TYPES } from './types';

export type SortMode = 'alpha' | 'alphaDesc' | 'recent' | 'oldest';

interface State {
  players: Record<string, Player>;
  selectedId: string | null;
  query: string;
  loading: boolean;
  error: string | null;
  sidebarCollapsed: boolean;
  sortMode: SortMode;
  typeLabels: Partial<Record<PlayerType, string>>;

  loadAll: () => Promise<void>;
  addPlayer: (name: string) => Promise<Player>;
  removePlayer: (id: string) => Promise<void>;
  renamePlayer: (id: string, name: string) => Promise<void>;
  setType: (id: string, type: PlayerType) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  setNotes: (id: string, notes: string) => Promise<void>;

  setSelected: (id: string | null) => void;
  setQuery: (q: string) => void;
  toggleSidebar: () => void;
  setSortMode: (mode: SortMode) => void;
  setTypeLabel: (type: PlayerType, label: string) => void;
  labelForType: (type: PlayerType) => string;

  visiblePlayers: () => Player[];
  selectedPlayer: () => Player | null;
}

const SIDEBAR_KEY = 'lono.sidebarCollapsed';
const SORT_KEY = 'lono.sortMode';
const TYPE_LABELS_KEY = 'lono.typeLabels';
const VALID_SORTS: SortMode[] = ['alpha', 'alphaDesc', 'recent', 'oldest'];

const initialCollapsed = ((): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'true';
  } catch {
    return false;
  }
})();

const initialSortMode = ((): SortMode => {
  try {
    const v = localStorage.getItem(SORT_KEY);
    if (v && (VALID_SORTS as string[]).includes(v)) return v as SortMode;
  } catch {
    /* ignore */
  }
  return 'alpha';
})();

const initialTypeLabels = ((): Partial<Record<PlayerType, string>> => {
  try {
    const raw = localStorage.getItem(TYPE_LABELS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    /* ignore */
  }
  return {};
})();

const compareName = (a: Player, b: Player) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

const sortByMode = (mode: SortMode) => (a: Player, b: Player): number => {
  if (a.starred !== b.starred) return a.starred ? -1 : 1;
  switch (mode) {
    case 'alpha':
      return compareName(a, b);
    case 'alphaDesc':
      return compareName(b, a);
    case 'recent':
      if (a.createdAt !== b.createdAt) return a.createdAt > b.createdAt ? -1 : 1;
      return compareName(a, b);
    case 'oldest':
      if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
      return compareName(a, b);
  }
};

export const useStore = create<State>((set, get) => ({
  players: {},
  selectedId: null,
  query: '',
  loading: false,
  error: null,
  sidebarCollapsed: initialCollapsed,
  sortMode: initialSortMode,
  typeLabels: initialTypeLabels,

  async loadAll() {
    set({ loading: true, error: null });
    try {
      const list = await window.lono.players.list();
      const players: Record<string, Player> = {};
      for (const p of list) players[p.id] = p;
      set({ players, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  async addPlayer(name) {
    const player = await window.lono.players.create(name);
    set((s) => ({
      players: { ...s.players, [player.id]: player },
      selectedId: player.id,
      query: '',
    }));
    return player;
  },

  async removePlayer(id) {
    await window.lono.players.delete(id);
    set((s) => {
      const next = { ...s.players };
      delete next[id];
      return {
        players: next,
        selectedId: s.selectedId === id ? null : s.selectedId,
      };
    });
  },

  async renamePlayer(id, name) {
    const updated = await window.lono.players.rename(id, name);
    set((s) => ({ players: { ...s.players, [id]: updated } }));
  },

  async setType(id, type) {
    const updated = await window.lono.players.setType(id, type);
    set((s) => ({ players: { ...s.players, [id]: updated } }));
  },

  async toggleStar(id) {
    const current = get().players[id];
    if (!current) return;
    const updated = await window.lono.players.setStarred(id, !current.starred);
    set((s) => ({ players: { ...s.players, [id]: updated } }));
  },

  async setNotes(id, notes) {
    const updated = await window.lono.players.setNotes(id, notes);
    set((s) => ({ players: { ...s.players, [id]: updated } }));
  },

  setSelected(id) {
    set({ selectedId: id });
  },

  setQuery(q) {
    set({ query: q });
  },

  toggleSidebar() {
    set((s) => {
      const next = !s.sidebarCollapsed;
      try {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {
        /* ignore */
      }
      return { sidebarCollapsed: next };
    });
  },

  setSortMode(mode) {
    try {
      localStorage.setItem(SORT_KEY, mode);
    } catch {
      /* ignore */
    }
    set({ sortMode: mode });
  },

  setTypeLabel(type, label) {
    set((s) => {
      const next = { ...s.typeLabels };
      const trimmed = label.trim();
      if (trimmed === '' || trimmed === PLAYER_TYPES[type].label) {
        delete next[type];
      } else {
        next[type] = trimmed;
      }
      try {
        localStorage.setItem(TYPE_LABELS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return { typeLabels: next };
    });
  },

  labelForType(type) {
    return get().typeLabels[type] ?? PLAYER_TYPES[type].label;
  },

  visiblePlayers() {
    const { players, query, sortMode } = get();
    const all = Object.values(players);
    if (!query.trim()) return all.sort(sortByMode(sortMode));
    const fuse = new Fuse(all, { keys: ['name'], threshold: 0.4, ignoreLocation: true });
    return fuse.search(query).map((r) => r.item);
  },

  selectedPlayer() {
    const { players, selectedId } = get();
    return selectedId ? players[selectedId] ?? null : null;
  },
}));
