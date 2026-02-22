import type { Book, Highlight, ImportResult, BookMetadata } from '../types';

const BASE = '/api';

export async function getBooks(): Promise<Book[]> {
  const res = await fetch(`${BASE}/books`);
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}

export async function getHighlights(bookId?: number): Promise<Highlight[]> {
  const url =
    bookId != null
      ? `${BASE}/highlights?bookId=${bookId}`
      : `${BASE}/highlights`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch highlights');
  return res.json();
}

export async function importFile(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/import`, { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Import failed' }));
    throw new Error(body.error || 'Import failed');
  }
  return res.json();
}

export async function toggleFavorite(id: number): Promise<void> {
  const res = await fetch(`${BASE}/highlights/${id}/favorite`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to toggle favorite');
}

export async function resetData(): Promise<void> {
  const res = await fetch(`${BASE}/data`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to reset data');
}

export async function addManualBook(title: string, author: string): Promise<Book> {
  const res = await fetch(`${BASE}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, author }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Failed to add book' }));
    throw new Error(body.error || 'Failed to add book');
  }
  return res.json();
}

export async function addManualHighlight(
  bookId: number,
  data: { text: string; annotation?: string; chapter?: string; color?: number },
): Promise<Highlight> {
  const res = await fetch(`${BASE}/books/${bookId}/highlights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Failed to add highlight' }));
    throw new Error(body.error || 'Failed to add highlight');
  }
  return res.json();
}

export async function updateHighlight(
  highlightId: number,
  data: { text: string; annotation?: string; chapter?: string; color?: number },
): Promise<Highlight> {
  const res = await fetch(`${BASE}/highlights/${highlightId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Failed to update highlight' }));
    throw new Error(body.error || 'Failed to update highlight');
  }
  return res.json();
}

export async function getBookMetadata(bookId: number): Promise<BookMetadata> {
  const res = await fetch(`${BASE}/books/${bookId}/metadata`);
  if (!res.ok) throw new Error('Failed to fetch book metadata');
  return res.json();
}

export async function searchBookCover(
  bookId: number,
  query: { isbn?: string; title?: string },
): Promise<BookMetadata> {
  const res = await fetch(`${BASE}/books/${bookId}/metadata/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!res.ok) throw new Error('Failed to search for cover');
  return res.json();
}

export async function updateBookMetadata(
  bookId: number,
  metadata: BookMetadata,
): Promise<void> {
  const res = await fetch(`${BASE}/books/${bookId}/metadata`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) throw new Error('Failed to update metadata');
}
