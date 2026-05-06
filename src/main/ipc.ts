import { ipcMain } from 'electron';
import type { PlayerType } from '../types';
import {
  createPlayer,
  deletePlayer,
  getPlayer,
  listPlayers,
  setPlayerNotes,
  setPlayerStarred,
  setPlayerType,
  updatePlayerName,
} from './repositories/players';

export function registerIpcHandlers() {
  ipcMain.handle('players:list', () => listPlayers());
  ipcMain.handle('players:get', (_e, id: string) => getPlayer(id));
  ipcMain.handle('players:create', (_e, name: string) => createPlayer(name));
  ipcMain.handle('players:rename', (_e, p: { id: string; name: string }) =>
    updatePlayerName(p.id, p.name),
  );
  ipcMain.handle('players:setType', (_e, p: { id: string; type: PlayerType }) =>
    setPlayerType(p.id, p.type),
  );
  ipcMain.handle('players:setStarred', (_e, p: { id: string; starred: boolean }) =>
    setPlayerStarred(p.id, p.starred),
  );
  ipcMain.handle('players:setNotes', (_e, p: { id: string; notes: string }) =>
    setPlayerNotes(p.id, p.notes),
  );
  ipcMain.handle('players:delete', (_e, id: string) => {
    deletePlayer(id);
  });
}
