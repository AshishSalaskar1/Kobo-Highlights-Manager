import { Heart, BookOpen, Calendar, MapPin, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HIGHLIGHT_COLORS } from '@/types';
import type { Highlight, Book } from '@/types';

export interface DetailSheetProps {
  highlight: Highlight | null;
  book: Book | null;
  onToggleFavorite: (id: number) => void;
  onClose: () => void;
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DetailSheet({ highlight, book, onToggleFavorite, onClose }: DetailSheetProps) {
  if (!highlight) return null;

  const colorInfo = HIGHLIGHT_COLORS[highlight.color] ?? { name: 'Default', hex: '#9E9E9E', tailwind: 'bg-gray-400' };

  return (
    <Dialog open={!!highlight} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Highlight Details</DialogTitle>
          <DialogDescription className="sr-only">
            Full details of the selected highlight
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pb-2">
          {/* Favorite toggle */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={highlight.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => onToggleFavorite(highlight.id)}
            >
              <Heart
                className={`size-4 ${
                  highlight.isFavorite
                    ? 'fill-red-500 text-red-500'
                    : 'text-muted-foreground'
                }`}
              />
            </Button>
          </div>

          {/* Color indicator + full text */}
          <div className="flex gap-3">
            <div
              className="mt-1 h-full w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: colorInfo.hex }}
            />
            <p className="text-sm leading-relaxed">{highlight.text}</p>
          </div>

          {/* Annotation */}
          {highlight.annotation && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Annotation</p>
              <p className="text-sm">{highlight.annotation}</p>
            </div>
          )}

          <Separator />

          {/* Book info */}
          {book && (
            <div className="flex items-start gap-2">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{book.title}</p>
                <p className="text-xs text-muted-foreground">{book.author}</p>
              </div>
            </div>
          )}

          {/* Chapter */}
          {highlight.chapter && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm">{highlight.chapter}</p>
            </div>
          )}

          {/* Position info */}
          {(highlight.positionPart > 0 || highlight.positionPara > 0 || highlight.positionSeg > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {highlight.positionPart > 0 && (
                <Badge variant="outline" className="text-xs">Part {highlight.positionPart}</Badge>
              )}
              {highlight.positionPara > 0 && (
                <Badge variant="outline" className="text-xs">¶{highlight.positionPara}</Badge>
              )}
              {highlight.positionSeg > 0 && (
                <Badge variant="outline" className="text-xs">§{highlight.positionSeg}</Badge>
              )}
            </div>
          )}

          {/* Color */}
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <div
                className="size-3 rounded-full"
                style={{ backgroundColor: colorInfo.hex }}
              />
              <span className="text-sm">{colorInfo.name}</span>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{formatDateTime(highlight.dateCreated)}</p>
              </div>
            </div>
            {highlight.dateModified && highlight.dateModified !== highlight.dateCreated && (
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Modified</p>
                  <p className="text-sm">{formatDateTime(highlight.dateModified)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
