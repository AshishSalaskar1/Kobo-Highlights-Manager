import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { initDb, getDb, resetDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '..', '.uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
const upload = multer({ dest: uploadDir });
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Kobo extraction SQL — pulls highlights + book metadata from KoboReader.sqlite
// ---------------------------------------------------------------------------
const KOBO_EXTRACT_SQL = `
  SELECT
    b.BookmarkID, b.VolumeID, b.ContentID,
    b.Text, b.Annotation, b.StartContainerPath,
    b.DateCreated, b.DateModified, b.ChapterProgress, b.Type, b.Color,
    c_book.Title   AS book_title,
    c_book.Attribution AS author,
    c_book.ISBN, c_book.Publisher, c_book.Language,
    c_chap.Title   AS chapter_title
  FROM Bookmark b
  LEFT JOIN content c_book
    ON b.VolumeID = c_book.ContentID AND c_book.ContentType = '6'
  LEFT JOIN content c_chap
    ON c_chap.ContentID = b.ContentID || '-1' AND c_chap.ContentType = '899'
  WHERE b.Hidden = 'false' AND b.Text IS NOT NULL AND b.Text != ''
  ORDER BY b.VolumeID, b.ContentID, b.StartContainerPath
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseContainerPath(p: string | null): { paragraph: number; segment: number } {
  if (!p) return { paragraph: 0, segment: 0 };
  const m = p.match(/kobo\\?\.(\d+)\\?\.(\d+)/);
  return m ? { paragraph: +m[1], segment: +m[2] } : { paragraph: 0, segment: 0 };
}

function parsePartNumber(contentId: string | null): number {
  if (!contentId) return 0;
  const m = contentId.match(/part(\d+)/);
  return m ? +m[1] : 0;
}

// ---------------------------------------------------------------------------
// POST /api/import — upload KoboReader.sqlite, parse & store
// ---------------------------------------------------------------------------
app.post('/api/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  let koboDb: Database.Database | null = null;
  const filePath = req.file.path;

  try {
    koboDb = new Database(filePath, { readonly: true });
    const rows = koboDb.prepare(KOBO_EXTRACT_SQL).all() as Record<string, unknown>[];
    koboDb.close();
    koboDb = null;

    const db = getDb();
    let booksAdded = 0;
    let booksUpdated = 0;
    let highlightsAdded = 0;
    let highlightsUpdated = 0;
    const bookIdMap = new Map<string, number>();

    // Prepared statements
    const getBookId = db.prepare('SELECT id FROM books WHERE kobo_id = ?');
    const upsertBook = db.prepare(`
      INSERT INTO books (title, author, isbn, publisher, language, kobo_id)
      VALUES (@title, @author, @isbn, @publisher, @language, @koboId)
      ON CONFLICT(kobo_id) DO UPDATE SET
        title = excluded.title, author = excluded.author,
        isbn = excluded.isbn,   publisher = excluded.publisher,
        language = excluded.language, updated_at = datetime('now')
    `);
    const checkHighlight = db.prepare(
      'SELECT id FROM highlights WHERE kobo_bookmark_id = ?',
    );
    const upsertHighlight = db.prepare(`
      INSERT INTO highlights (
        book_id, text, annotation, chapter, chapter_progress, color,
        date_created, date_modified, position_part, position_para, position_seg,
        kobo_bookmark_id
      ) VALUES (
        @bookId, @text, @annotation, @chapter, @chapterProgress, @color,
        @dateCreated, @dateModified, @positionPart, @positionPara, @positionSeg,
        @bookmarkId
      )
      ON CONFLICT(kobo_bookmark_id) DO UPDATE SET
        text = excluded.text, annotation = excluded.annotation,
        chapter = excluded.chapter, chapter_progress = excluded.chapter_progress,
        color = excluded.color, date_modified = excluded.date_modified
    `);
    const recordImport = db.prepare(`
      INSERT INTO imports (file_name, file_size, books_added, books_updated,
        highlights_added, highlights_updated, highlights_total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
    `);

    // Run everything in a single transaction
    db.transaction(() => {
      for (const r of rows) {
        const volumeId = r.VolumeID as string;
        const bookmarkId = r.BookmarkID as string;

        // Upsert book (once per volumeId)
        let bookId = bookIdMap.get(volumeId);
        if (bookId === undefined) {
          const existed = getBookId.get(volumeId) as { id: number } | undefined;
          upsertBook.run({
            title: (r.book_title as string) || 'Unknown Book',
            author: (r.author as string) || '',
            isbn: (r.ISBN as string) || '',
            publisher: (r.Publisher as string) || '',
            language: (r.Language as string) || '',
            koboId: volumeId,
          });
          bookId = (getBookId.get(volumeId) as { id: number }).id;
          bookIdMap.set(volumeId, bookId);
          existed ? booksUpdated++ : booksAdded++;
        }

        // Upsert highlight
        const existed = checkHighlight.get(bookmarkId);
        const pos = parseContainerPath(r.StartContainerPath as string | null);
        upsertHighlight.run({
          bookId,
          text: r.Text as string,
          annotation: (r.Annotation as string) || '',
          chapter: (r.chapter_title as string) || '',
          chapterProgress: (r.ChapterProgress as number) || 0,
          color: (r.Color as number) || 0,
          dateCreated: (r.DateCreated as string) || new Date().toISOString(),
          dateModified: (r.DateModified as string) || '',
          positionPart: parsePartNumber(r.ContentID as string | null),
          positionPara: pos.paragraph,
          positionSeg: pos.segment,
          bookmarkId,
        });
        existed ? highlightsUpdated++ : highlightsAdded++;
      }

      recordImport.run(
        req.file!.originalname, req.file!.size,
        booksAdded, booksUpdated,
        highlightsAdded, highlightsUpdated,
        rows.length,
      );
    })();

    console.log(
      `Import complete: ${rows.length} rows → ${booksAdded} new books, ` +
      `${highlightsAdded} new highlights`,
    );
    res.json({ booksAdded, booksUpdated, highlightsAdded, highlightsUpdated, totalRows: rows.length });
  } catch (err) {
    if (koboDb) try { koboDb.close(); } catch { /* ignore */ }
    console.error('Import failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Import failed' });
  } finally {
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }
});

// ---------------------------------------------------------------------------
// GET /api/books
// ---------------------------------------------------------------------------
app.get('/api/books', (_req, res) => {
  const rows = getDb().prepare(`
    SELECT b.*, COUNT(h.id) AS highlight_count
    FROM books b
    LEFT JOIN highlights h ON h.book_id = b.id
    GROUP BY b.id
    ORDER BY b.title COLLATE NOCASE
  `).all() as Record<string, unknown>[];

  res.json(rows.map(r => ({
    id: r.id,
    title: r.title || '',
    author: r.author || '',
    isbn: r.isbn || '',
    publisher: r.publisher || '',
    language: r.language || '',
    koboId: r.kobo_id || '',
    isManual: Boolean(r.is_manual),
    createdAt: r.created_at || '',
    updatedAt: r.updated_at || '',
    highlightCount: r.highlight_count || 0,
  })));
});

// ---------------------------------------------------------------------------
// GET /api/highlights?bookId=N
// ---------------------------------------------------------------------------
app.get('/api/highlights', (req, res) => {
  const bookId = req.query.bookId ? Number(req.query.bookId) : null;

  const rows = (
    bookId != null
      ? getDb().prepare(
          'SELECT * FROM highlights WHERE book_id = ? ORDER BY position_part, position_para, position_seg',
        ).all(bookId)
      : getDb().prepare(
          'SELECT * FROM highlights ORDER BY position_part, position_para, position_seg',
        ).all()
  ) as Record<string, unknown>[];

  res.json(rows.map(r => ({
    id: r.id,
    bookId: r.book_id || 0,
    text: r.text || '',
    annotation: r.annotation || '',
    chapter: r.chapter || '',
    chapterProgress: r.chapter_progress || 0,
    color: r.color || 0,
    dateCreated: r.date_created || '',
    dateModified: r.date_modified || '',
    positionPart: r.position_part || 0,
    positionPara: r.position_para || 0,
    positionSeg: r.position_seg || 0,
    koboBookmarkId: r.kobo_bookmark_id || '',
    isFavorite: Boolean(r.is_favorite),
    isManual: Boolean(r.is_manual),
    tags: JSON.parse((r.tags as string) || '[]'),
    createdAt: r.created_at || '',
  })));
});

// ---------------------------------------------------------------------------
// PATCH /api/highlights/:id/favorite
// ---------------------------------------------------------------------------
app.patch('/api/highlights/:id/favorite', (req, res) => {
  const id = Number(req.params.id);
  getDb().prepare('UPDATE highlights SET is_favorite = NOT is_favorite WHERE id = ?').run(id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// PATCH /api/highlights/:id — edit a manual highlight
// ---------------------------------------------------------------------------
app.patch('/api/highlights/:id', (req, res) => {
  const id = Number(req.params.id);
  const { text, annotation, chapter, color } = req.body as {
    text?: string;
    annotation?: string;
    chapter?: string;
    color?: number;
  };

  const db = getDb();
  const existing = db.prepare('SELECT * FROM highlights WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Highlight not found' });
    return;
  }
  if (!existing.is_manual) {
    res.status(400).json({ error: 'Only manual highlights can be edited' });
    return;
  }
  if (text !== undefined && !text.trim()) {
    res.status(400).json({ error: 'Highlight text cannot be empty' });
    return;
  }

  db.prepare(`
    UPDATE highlights
    SET text = ?, annotation = ?, chapter = ?, color = ?, date_modified = datetime('now')
    WHERE id = ?
  `).run(
    text !== undefined ? text.trim() : existing.text,
    annotation !== undefined ? annotation.trim() : existing.annotation,
    chapter !== undefined ? chapter.trim() : existing.chapter,
    color !== undefined ? color : existing.color,
    id,
  );

  const row = db.prepare('SELECT * FROM highlights WHERE id = ?').get(id) as Record<string, unknown>;
  res.json({
    id: row.id,
    bookId: row.book_id || 0,
    text: row.text || '',
    annotation: row.annotation || '',
    chapter: row.chapter || '',
    chapterProgress: row.chapter_progress || 0,
    color: row.color || 0,
    dateCreated: row.date_created || '',
    dateModified: row.date_modified || '',
    positionPart: row.position_part || 0,
    positionPara: row.position_para || 0,
    positionSeg: row.position_seg || 0,
    koboBookmarkId: row.kobo_bookmark_id || '',
    isFavorite: Boolean(row.is_favorite),
    isManual: Boolean(row.is_manual),
    tags: JSON.parse((row.tags as string) || '[]'),
    createdAt: row.created_at || '',
  });
});

// ---------------------------------------------------------------------------
// POST /api/books — create a manual book
// ---------------------------------------------------------------------------
app.post('/api/books', (req, res) => {
  const { title, author } = req.body as { title?: string; author?: string };
  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO books (title, author, is_manual) VALUES (?, ?, 1)
  `).run(title.trim(), (author || '').trim());

  const bookId = result.lastInsertRowid as number;
  const row = db.prepare(`
    SELECT b.*, 0 AS highlight_count FROM books b WHERE b.id = ?
  `).get(bookId) as Record<string, unknown>;

  res.json({
    id: row.id,
    title: row.title || '',
    author: row.author || '',
    isbn: row.isbn || '',
    publisher: row.publisher || '',
    language: row.language || '',
    koboId: row.kobo_id || '',
    isManual: Boolean(row.is_manual),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    highlightCount: row.highlight_count || 0,
  });
});

// ---------------------------------------------------------------------------
// POST /api/books/:id/highlights — add a manual highlight to a book
// ---------------------------------------------------------------------------
app.post('/api/books/:id/highlights', (req, res) => {
  const bookId = Number(req.params.id);
  const { text, annotation, chapter, color } = req.body as {
    text?: string;
    annotation?: string;
    chapter?: string;
    color?: number;
  };

  if (!text || !text.trim()) {
    res.status(400).json({ error: 'Highlight text is required' });
    return;
  }

  const db = getDb();

  // Verify book exists
  const book = db.prepare('SELECT id FROM books WHERE id = ?').get(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  // Get the next position for ordering (append at end)
  const maxPos = db.prepare(
    'SELECT COALESCE(MAX(position_para), 0) + 1 AS next_pos FROM highlights WHERE book_id = ?',
  ).get(bookId) as { next_pos: number };

  const result = db.prepare(`
    INSERT INTO highlights (book_id, text, annotation, chapter, color, is_manual, position_para, date_created)
    VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
  `).run(
    bookId,
    text.trim(),
    (annotation || '').trim(),
    (chapter || '').trim(),
    color ?? 0,
    maxPos.next_pos,
  );

  const highlightId = result.lastInsertRowid as number;
  const row = db.prepare('SELECT * FROM highlights WHERE id = ?').get(highlightId) as Record<string, unknown>;

  res.json({
    id: row.id,
    bookId: row.book_id || 0,
    text: row.text || '',
    annotation: row.annotation || '',
    chapter: row.chapter || '',
    chapterProgress: row.chapter_progress || 0,
    color: row.color || 0,
    dateCreated: row.date_created || '',
    dateModified: row.date_modified || '',
    positionPart: row.position_part || 0,
    positionPara: row.position_para || 0,
    positionSeg: row.position_seg || 0,
    koboBookmarkId: row.kobo_bookmark_id || '',
    isFavorite: Boolean(row.is_favorite),
    isManual: Boolean(row.is_manual),
    tags: JSON.parse((row.tags as string) || '[]'),
    createdAt: row.created_at || '',
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/data — clear everything
// ---------------------------------------------------------------------------
app.delete('/api/data', (_req, res) => {
  resetDb();
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Open Library helpers
// ---------------------------------------------------------------------------
interface OLSearchDoc {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  subject?: string[];
  cover_i?: number;
  key?: string;
}

async function fetchOpenLibraryMetadata(
  title: string,
  author: string,
  isbn: string,
): Promise<{
  coverUrl: string;
  description: string;
  subjects: string[];
  publishYear: number;
  pageCount: number;
  olKey: string;
}> {
  const empty = { coverUrl: '', description: '', subjects: [], publishYear: 0, pageCount: 0, olKey: '' };

  // Try ISBN lookup first if available
  if (isbn) {
    try {
      const isbnRes = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`,
      );
      if (isbnRes.ok) {
        const isbnData = (await isbnRes.json()) as Record<string, {
          title?: string;
          cover?: { medium?: string; large?: string };
          subjects?: { name: string }[];
          number_of_pages?: number;
          publish_date?: string;
          key?: string;
          excerpts?: { text: string }[];
        }>;
        const entry = Object.values(isbnData)[0];
        if (entry) {
          return {
            coverUrl: entry.cover?.large || entry.cover?.medium || '',
            description: entry.excerpts?.[0]?.text || '',
            subjects: (entry.subjects || []).slice(0, 5).map((s) => s.name),
            publishYear: entry.publish_date ? parseInt(entry.publish_date, 10) || 0 : 0,
            pageCount: entry.number_of_pages || 0,
            olKey: entry.key || '',
          };
        }
      }
    } catch { /* fall through to title search */ }
  }

  // Fallback: search by title + author
  const query = author ? `${title} ${author}` : title;
  try {
    const searchRes = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1&fields=title,author_name,first_publish_year,number_of_pages_median,subject,cover_i,key`,
    );
    if (!searchRes.ok) return empty;

    const searchData = (await searchRes.json()) as { docs: OLSearchDoc[] };
    const doc = searchData.docs?.[0];
    if (!doc) return empty;

    const coverUrl = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : '';

    return {
      coverUrl,
      description: '',
      subjects: (doc.subject || []).slice(0, 5),
      publishYear: doc.first_publish_year || 0,
      pageCount: doc.number_of_pages_median || 0,
      olKey: doc.key || '',
    };
  } catch {
    return empty;
  }
}

// ---------------------------------------------------------------------------
// GET /api/books/:id/metadata — fetch & cache book metadata from Open Library
// ---------------------------------------------------------------------------
app.get('/api/books/:id/metadata', async (req, res) => {
  const bookId = Number(req.params.id);
  const db = getDb();

  // Check cache
  const cached = db.prepare('SELECT * FROM book_metadata WHERE book_id = ?').get(bookId) as
    | Record<string, unknown>
    | undefined;

  if (cached) {
    res.json({
      coverUrl: cached.cover_url || '',
      description: cached.description || '',
      subjects: JSON.parse((cached.subjects as string) || '[]'),
      publishYear: cached.publish_year || 0,
      pageCount: cached.page_count || 0,
      olKey: cached.ol_key || '',
    });
    return;
  }

  // Get book info
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId) as
    | Record<string, unknown>
    | undefined;

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  try {
    const metadata = await fetchOpenLibraryMetadata(
      (book.title as string) || '',
      (book.author as string) || '',
      (book.isbn as string) || '',
    );

    db.prepare(`
      INSERT OR REPLACE INTO book_metadata (book_id, cover_url, description, subjects, publish_year, page_count, ol_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      bookId,
      metadata.coverUrl,
      metadata.description,
      JSON.stringify(metadata.subjects),
      metadata.publishYear,
      metadata.pageCount,
      metadata.olKey,
    );

    res.json(metadata);
  } catch (err) {
    console.error('Metadata fetch failed:', err);
    // Store empty record to avoid hammering the API
    db.prepare('INSERT OR REPLACE INTO book_metadata (book_id) VALUES (?)').run(bookId);
    res.json({ coverUrl: '', description: '', subjects: [], publishYear: 0, pageCount: 0, olKey: '' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/books/:id/metadata/search — search Open Library by ISBN or title (preview, no save)
// ---------------------------------------------------------------------------
app.post('/api/books/:id/metadata/search', async (req, res) => {
  const { isbn, title } = req.body as { isbn?: string; title?: string };

  if (!isbn && !title) {
    res.status(400).json({ error: 'Provide isbn or title' });
    return;
  }

  try {
    const metadata = await fetchOpenLibraryMetadata(
      title || '',
      '',
      isbn || '',
    );
    res.json(metadata);
  } catch (err) {
    console.error('Cover search failed:', err);
    res.json({ coverUrl: '', description: '', subjects: [], publishYear: 0, pageCount: 0, olKey: '' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/books/:id/metadata — update cached metadata (e.g. after user confirms new cover)
// ---------------------------------------------------------------------------
app.put('/api/books/:id/metadata', async (req, res) => {
  const bookId = Number(req.params.id);
  const { coverUrl, description, subjects, publishYear, pageCount, olKey } = req.body as {
    coverUrl?: string;
    description?: string;
    subjects?: string[];
    publishYear?: number;
    pageCount?: number;
    olKey?: string;
  };

  const db = getDb();

  // Ensure the book exists
  const book = db.prepare('SELECT id FROM books WHERE id = ?').get(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  db.prepare(`
    INSERT OR REPLACE INTO book_metadata (book_id, cover_url, description, subjects, publish_year, page_count, ol_key, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    bookId,
    coverUrl ?? '',
    description ?? '',
    JSON.stringify(subjects ?? []),
    publishYear ?? 0,
    pageCount ?? 0,
    olKey ?? '',
  );

  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Static UI (production / Docker) — serve built front-end from ../ui/dist
// ---------------------------------------------------------------------------
const uiDist = path.resolve(__dirname, '..', '..', 'ui', 'dist');
if (fs.existsSync(uiDist)) {
  app.use(express.static(uiDist));
  // SPA fallback — let React Router handle client-side routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(uiDist, 'index.html'));
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
initDb();
app.listen(PORT, () => {
  console.log(`Kobo server running → http://localhost:${PORT}`);
});
