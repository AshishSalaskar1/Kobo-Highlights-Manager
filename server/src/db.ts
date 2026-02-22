import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'highlights.db');

let db: Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS books (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT DEFAULT '',
  author      TEXT DEFAULT '',
  isbn        TEXT DEFAULT '',
  publisher   TEXT DEFAULT '',
  language    TEXT DEFAULT '',
  kobo_id     TEXT UNIQUE,
  is_manual   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS highlights (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id           INTEGER REFERENCES books(id) ON DELETE CASCADE,
  text              TEXT DEFAULT '',
  annotation        TEXT DEFAULT '',
  chapter           TEXT DEFAULT '',
  chapter_progress  REAL DEFAULT 0,
  color             INTEGER DEFAULT 0,
  date_created      TEXT DEFAULT (datetime('now')),
  date_modified     TEXT,
  position_part     INTEGER DEFAULT 0,
  position_para     INTEGER DEFAULT 0,
  position_seg      INTEGER DEFAULT 0,
  kobo_bookmark_id  TEXT UNIQUE,
  is_favorite       INTEGER DEFAULT 0,
  is_manual         INTEGER DEFAULT 0,
  tags              TEXT DEFAULT '[]',
  created_at        TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS imports (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  imported_at        TEXT DEFAULT (datetime('now')),
  file_name          TEXT DEFAULT '',
  file_size          INTEGER DEFAULT 0,
  books_added        INTEGER DEFAULT 0,
  books_updated      INTEGER DEFAULT 0,
  highlights_added   INTEGER DEFAULT 0,
  highlights_updated INTEGER DEFAULT 0,
  highlights_total   INTEGER DEFAULT 0,
  status             TEXT DEFAULT 'completed'
);

CREATE INDEX IF NOT EXISTS idx_highlights_book_id ON highlights(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_date    ON highlights(date_created);
CREATE INDEX IF NOT EXISTS idx_highlights_kobo_id ON highlights(kobo_bookmark_id);
CREATE INDEX IF NOT EXISTS idx_books_kobo_id      ON books(kobo_id);

CREATE TABLE IF NOT EXISTS book_metadata (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id       INTEGER UNIQUE REFERENCES books(id) ON DELETE CASCADE,
  cover_url     TEXT DEFAULT '',
  description   TEXT DEFAULT '',
  subjects      TEXT DEFAULT '[]',
  publish_year  INTEGER DEFAULT 0,
  page_count    INTEGER DEFAULT 0,
  ol_key        TEXT DEFAULT '',
  fetched_at    TEXT DEFAULT (datetime('now'))
);
`;

export function initDb(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);

  // Migration: add is_manual columns if they don't exist
  const bookCols = db.prepare("PRAGMA table_info(books)").all() as { name: string }[];
  if (!bookCols.some(c => c.name === 'is_manual')) {
    db.exec('ALTER TABLE books ADD COLUMN is_manual INTEGER DEFAULT 0');
  }
  const highlightCols = db.prepare("PRAGMA table_info(highlights)").all() as { name: string }[];
  if (!highlightCols.some(c => c.name === 'is_manual')) {
    db.exec('ALTER TABLE highlights ADD COLUMN is_manual INTEGER DEFAULT 0');
  }

  console.log(`Database ready at ${DB_PATH}`);
}

export function getDb(): Database.Database {
  return db;
}

export function resetDb(): void {
  db.exec('DELETE FROM highlights');
  db.exec('DELETE FROM book_metadata');
  db.exec('DELETE FROM books');
  db.exec('DELETE FROM imports');
}
