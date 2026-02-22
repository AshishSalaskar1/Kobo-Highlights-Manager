import type { Highlight, Book } from '../types';

export function exportJson(highlights: Highlight[], books: Book[]): string {
  const bookMap = new Map(books.map((b) => [b.id, b]));

  // Group highlights by bookId
  const grouped = new Map<number, Highlight[]>();
  for (const h of highlights) {
    const list = grouped.get(h.bookId) ?? [];
    list.push(h);
    grouped.set(h.bookId, list);
  }

  const structured = Array.from(grouped.entries()).map(([bookId, bookHighlights]) => {
    const book = bookMap.get(bookId);
    return {
      book: {
        title: book?.title ?? 'Unknown',
        author: book?.author ?? 'Unknown',
      },
      highlights: bookHighlights.map((h) => ({
        text: h.text,
        annotation: h.annotation || null,
        chapter: h.chapter || null,
        color: h.color,
        dateCreated: h.dateCreated,
        isFavorite: h.isFavorite,
      })),
    };
  });

  return JSON.stringify(structured, null, 2);
}
