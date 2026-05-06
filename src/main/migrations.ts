export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial-schema',
    sql: `
      CREATE TABLE players (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        type        TEXT NOT NULL DEFAULT 'unknown',
        notes       TEXT NOT NULL DEFAULT '',
        created_at  TEXT NOT NULL,
        last_seen   TEXT NOT NULL,
        last_tagged TEXT NOT NULL,
        encounters  INTEGER NOT NULL DEFAULT 0,
        starred     INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX players_name_idx ON players(name COLLATE NOCASE);
      CREATE INDEX players_last_seen_idx ON players(last_seen DESC);

      CREATE TABLE exploits (
        id         TEXT PRIMARY KEY,
        player_id  TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        text       TEXT NOT NULL,
        street     TEXT NOT NULL,
        priority   INTEGER NOT NULL DEFAULT 999,
        created_at TEXT NOT NULL
      );
      CREATE INDEX exploits_player_idx ON exploits(player_id, priority);

      CREATE TABLE tags (
        id        TEXT PRIMARY KEY,
        player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        text      TEXT NOT NULL,
        street    TEXT NOT NULL
      );
      CREATE INDEX tags_player_idx ON tags(player_id);

      CREATE TABLE hands (
        id          TEXT PRIMARY KEY,
        player_id   TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        date        TEXT NOT NULL,
        position    TEXT,
        vs_position TEXT,
        street      TEXT,
        action      TEXT,
        sizing      TEXT,
        result      TEXT,
        freeform    TEXT NOT NULL
      );
      CREATE INDEX hands_player_idx ON hands(player_id, date DESC);

      CREATE TABLE custom_tags (
        id        TEXT PRIMARY KEY,
        text      TEXT NOT NULL,
        street    TEXT NOT NULL,
        frequency INTEGER NOT NULL DEFAULT 0,
        UNIQUE(text, street)
      );
      CREATE INDEX custom_tags_freq_idx ON custom_tags(frequency DESC);

      CREATE TABLE preferences (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `,
  },
];
