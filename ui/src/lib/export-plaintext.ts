import type { Highlight, Book } from '../types';

export function exportPlaintext(highlights: Highlight[], books: Book[]): string {
  const bookMap = new Map(books.map((b) => [b.id, b]));

  // Group highlights by bookId
  const grouped = new Map<number, Highlight[]>();
  for (const h of highlights) {
    const list = grouped.get(h.bookId) ?? [];
    list.push(h);
    grouped.set(h.bookId, list);
  }

  const sections: string[] = [];

  for (const [bookId, bookHighlights] of grouped) {
    const book = bookMap.get(bookId);
    const title = book ? `${book.title} — ${book.author}` : 'Unknown Book';
    const lines: string[] = [title, '═'.repeat(title.length), ''];

    // Group by chapter within book
    const chapterMap = new Map<string, Highlight[]>();
    for (const h of bookHighlights) {
      const ch = h.chapter || 'Uncategorised';
      const list = chapterMap.get(ch) ?? [];
      list.push(h);
      chapterMap.set(ch, list);
    }

    for (const [chapter, chapterHighlights] of chapterMap) {
      lines.push(chapter, '─'.repeat(chapter.length), '');
      chapterHighlights.forEach((h, i) => {
        lines.push(`${i + 1}. ${h.text}`);
        if (h.annotation) {
          lines.push(`   Note: ${h.annotation}`);
        }
        lines.push('');
      });
    }

    sections.push(lines.join('\n'));
  }

  return sections.join('\n\n');
}
