import { contextBridge, ipcRenderer } from 'electron';
import type { Player, PlayerType } from './types';

const api = {
  players: {
    list: (): Promise<Player[]> => ipcRenderer.invoke('players:list'),
    get: (id: string): Promise<Player | null> => ipcRenderer.invoke('players:get', id),
    create: (name: string): Promise<Player> => ipcRenderer.invoke('players:create', name),
    rename: (id: string, name: string): Promise<Player> =>
      ipcRenderer.invoke('players:rename', { id, name }),
    setType: (id: string, type: PlayerType): Promise<Player> =>
      ipcRenderer.invoke('players:setType', { id, type }),
    setStarred: (id: string, starred: boolean): Promise<Player> =>
      ipcRenderer.invoke('players:setStarred', { id, starred }),
    setNotes: (id: string, notes: string): Promise<Player> =>
      ipcRenderer.invoke('players:setNotes', { id, notes }),
    delete: (id: string): Promise<void> => ipcRenderer.invoke('players:delete', id),
  },
  screenshots: {
    save: (mime: string, data: Uint8Array): Promise<string> =>
      ipcRenderer.invoke('screenshots:save', { mime, data }),
    pasteFromClipboard: (): Promise<string | null> =>
      ipcRenderer.invoke('screenshots:pasteFromClipboard'),
  },
};

contextBridge.exposeInMainWorld('lono', api);

export type LonoApi = typeof api;
