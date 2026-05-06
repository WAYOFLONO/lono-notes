import { getDb } from './db';

export function getPref(key: string): string | null {
  const row = getDb()
    .prepare<[string], { value: string }>('SELECT value FROM preferences WHERE key = ?')
    .get(key);
  return row?.value ?? null;
}

export function setPref(key: string, value: string): void {
  getDb()
    .prepare(
      'INSERT INTO preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    )
    .run(key, value);
}

export function getBoolPref(key: string, fallback = false): boolean {
  const v = getPref(key);
  if (v === null) return fallback;
  return v === 'true';
}

export function setBoolPref(key: string, value: boolean): void {
  setPref(key, String(value));
}
