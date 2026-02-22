import { BookOpen, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { BookListItem } from './BookListItem';
import type { Book } from '@/types';

interface BookListProps {
  books: Book[];
  onAddBook: () => void;
}

export function BookList({ books, onAddBook }: BookListProps) {
  const selectedBookId = useUIStore((s) => s.selectedBookId);
  const setSelectedBookId = useUIStore((s) => s.setSelectedBookId);

  const totalHighlights = books.reduce((sum, b) => sum + b.highlightCount, 0);

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-0.5 p-2">
        {/* All Highlights + Add button row */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedBookId(null)}
            className={cn(
              'flex flex-1 items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
              selectedBookId === null
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                : 'hover:bg-blue-50 dark:hover:bg-blue-900/15',
            )}
          >
            <BookOpen className="size-4 shrink-0" />
            <span className="flex-1 font-medium">All Highlights</span>
            <Badge variant="secondary">{totalHighlights}</Badge>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 size-8"
            title="Add book manually"
            onClick={onAddBook}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Book list */}
        {books.map((book) => (
          <BookListItem
            key={book.id}
            book={book}
            isSelected={selectedBookId === book.id}
            onSelect={setSelectedBookId}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
