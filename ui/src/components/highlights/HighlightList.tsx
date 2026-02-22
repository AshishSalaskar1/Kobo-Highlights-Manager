import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BookOpen } from 'lucide-react';
import { HighlightCard } from './HighlightCard';
import type { Highlight } from '@/types';

export interface HighlightListProps {
  highlights: Highlight[];
  onSelectHighlight: (highlight: Highlight) => void;
  onToggleFavorite: (id: number) => void;
  onEditHighlight?: (highlight: Highlight) => void;
}

export function HighlightList({ highlights, onSelectHighlight, onToggleFavorite, onEditHighlight }: HighlightListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: highlights.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  if (highlights.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <BookOpen className="size-10 text-muted-foreground/50" />
        <div>
          <p className="font-medium text-muted-foreground">No highlights found</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Try adjusting your filters or selecting a different book.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Count header */}
      <div className="shrink-0 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {highlights.length} highlight{highlights.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Virtualized scroll container */}
      <div ref={parentRef} className="flex-1 overflow-y-auto px-4 pb-4">
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full pb-3"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <HighlightCard
                highlight={highlights[virtualItem.index]}
                onSelect={onSelectHighlight}
                onToggleFavorite={onToggleFavorite}
                onEdit={onEditHighlight}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
