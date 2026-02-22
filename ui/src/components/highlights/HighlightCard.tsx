import { useState } from 'react';
import { Heart, MessageSquare, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HIGHLIGHT_COLORS } from '@/types';
import type { Highlight } from '@/types';

export interface HighlightCardProps {
  highlight: Highlight;
  onSelect: (highlight: Highlight) => void;
  onToggleFavorite: (id: number) => void;
  onEdit?: (highlight: Highlight) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const DEFAULT_COLOR = { name: 'Default', hex: '#9E9E9E', tailwind: 'bg-gray-400' };

export function HighlightCard({ highlight, onSelect, onToggleFavorite, onEdit }: HighlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colorInfo = HIGHLIGHT_COLORS[highlight.color] ?? DEFAULT_COLOR;

  return (
    <div
      role="button"
      tabIndex={0}
      className="relative flex cursor-pointer overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent/50"
      onClick={() => onSelect(highlight)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(highlight);
        }
      }}
    >
      {/* Left color stripe */}
      <div
        className="w-1.5 shrink-0"
        style={{ backgroundColor: colorInfo.hex }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        {/* Highlight text */}
        <p
          className={`text-sm leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}
        >
          {highlight.text}
        </p>

        {/* Show more / less toggle */}
        {(highlight.text || '').length > 200 && (
          <button
            type="button"
            className="self-start text-xs font-medium text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Annotation badge */}
        {highlight.annotation && (
          <div className="flex items-center gap-1.5">
            <MessageSquare className="size-3 text-muted-foreground" />
            <Badge variant="secondary" className="max-w-[80%] truncate text-xs">
              {highlight.annotation}
            </Badge>
          </div>
        )}

        {/* Bottom row: chapter, date, favorite */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            {highlight.chapter && (
              <span className="truncate">{highlight.chapter}</span>
            )}
            {highlight.chapter && highlight.dateCreated && (
              <span className="shrink-0">·</span>
            )}
            {highlight.dateCreated && (
              <span className="shrink-0">{formatDate(highlight.dateCreated)}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {highlight.isManual && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 size-8"
                aria-label="Edit highlight"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(highlight);
                }}
              >
                <Pencil className="size-4 text-muted-foreground" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 size-8"
              aria-label={highlight.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(highlight.id);
              }}
            >
              <Heart
                className={`size-5 ${
                  highlight.isFavorite
                    ? 'fill-red-500 text-red-500'
                    : 'text-muted-foreground'
                }`}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
