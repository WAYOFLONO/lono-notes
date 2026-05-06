import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { migrations } from './migrations';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const userData = app.getPath('userData');
  fs.mkdirSync(userData, { recursive: true });
  const file = path.join(userData, 'lono-notes.db');

  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  runMigrations(db);

  dbInstance = db;
  return db;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    db.prepare<[], { version: number }>('SELECT version FROM _migrations').all().map((r) => r.version),
  );

  const runOne = db.transaction((version: number, sql: string) => {
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (version, applied_at) VALUES (?, ?)').run(
      version,
      new Date().toISOString(),
    );
  });

  for (const m of migrations) {
    if (applied.has(m.version)) continue;
    runOne(m.version, m.sql);
  }
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
