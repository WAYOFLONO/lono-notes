import type Database from 'better-sqlite3';
import type { Player, PlayerType } from '../../types';
import { getDb } from '../db';

interface PlayerRow {
  id: string;
  name: string;
  type: PlayerType;
  notes: string;
  created_at: string;
  last_seen: string;
  last_tagged: string;
  encounters: number;
  starred: number;
}

function rowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    notes: row.notes,
    createdAt: row.created_at,
    lastSeen: row.last_seen,
    lastTagged: row.last_tagged,
    encounters: row.encounters,
    starred: row.starred === 1,
  };
}

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'player';
}

function uniqueId(db: Database.Database, name: string): string {
  const base = slugify(name);
  const exists = db.prepare<[string], { c: number }>(
    'SELECT COUNT(*) AS c FROM players WHERE id = ?',
  );
  let candidate = base;
  let n = 2;
  while ((exists.get(candidate)?.c ?? 0) > 0) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

export function listPlayers(): Player[] {
  const db = getDb();
  return db.prepare<[], PlayerRow>('SELECT * FROM players').all().map(rowToPlayer);
}

export function getPlayer(id: string): Player | null {
  const db = getDb();
  const row = db.prepare<[string], PlayerRow>('SELECT * FROM players WHERE id = ?').get(id);
  return row ? rowToPlayer(row) : null;
}

export function createPlayer(name: string): Player {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Player name cannot be empty');

  const db = getDb();
  const now = new Date().toISOString();
  const id = uniqueId(db, trimmed);

  db.prepare(
    `INSERT INTO players (id, name, type, notes, created_at, last_seen, last_tagged, encounters, starred)
     VALUES (?, ?, 'unknown', '', ?, ?, ?, 0, 0)`,
  ).run(id, trimmed, now, now, now);

  return getPlayer(id)!;
}

export function updatePlayerName(id: string, name: string): Player {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Player name cannot be empty');
  const db = getDb();
  db.prepare('UPDATE players SET name = ? WHERE id = ?').run(trimmed, id);
  const player = getPlayer(id);
  if (!player) throw new Error(`Player ${id} not found`);
  return player;
}

export function setPlayerType(id: string, type: PlayerType): Player {
  const db = getDb();
  db.prepare('UPDATE players SET type = ? WHERE id = ?').run(type, id);
  const player = getPlayer(id);
  if (!player) throw new Error(`Player ${id} not found`);
  return player;
}

export function setPlayerStarred(id: string, starred: boolean): Player {
  const db = getDb();
  db.prepare('UPDATE players SET starred = ? WHERE id = ?').run(starred ? 1 : 0, id);
  const player = getPlayer(id);
  if (!player) throw new Error(`Player ${id} not found`);
  return player;
}

export function setPlayerNotes(id: string, notes: string): Player {
  const db = getDb();
  db.prepare('UPDATE players SET notes = ? WHERE id = ?').run(notes, id);
  const player = getPlayer(id);
  if (!player) throw new Error(`Player ${id} not found`);
  return player;
}

export function deletePlayer(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM players WHERE id = ?').run(id);
}
