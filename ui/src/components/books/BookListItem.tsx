import { PenLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Book } from '@/types';

interface BookListItemProps {
  book: Book;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export function BookListItem({ book, isSelected, onSelect }: BookListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(book.id)}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-all',
        isSelected
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-l-[3px] border-l-blue-500 pl-2.5 font-semibold'
          : 'hover:bg-blue-50 dark:hover:bg-blue-900/15 border-l-[3px] border-l-transparent',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {book.isManual && (
            <PenLine
              className={cn(
                'size-3 shrink-0',
                isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground',
              )}
              title="Manually added"
            />
          )}
          <p className="wrap-break-word leading-snug">{book.title}</p>
        </div>
        <p className={cn(
          'wrap-break-word text-xs',
          isSelected ? 'text-blue-700/70 dark:text-blue-300/70' : 'text-muted-foreground',
        )}>{book.author}</p>
      </div>
      <Badge
        variant={isSelected ? 'default' : 'secondary'}
        className={cn('shrink-0', isSelected && 'bg-blue-500 text-white dark:bg-blue-600')}
      >
        {book.highlightCount}
      </Badge>
    </button>
  );
}
