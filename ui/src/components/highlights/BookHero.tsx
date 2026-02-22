import { useEffect, useState } from 'react';
import { BookOpen, Calendar, FileText, Pencil, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EditCoverDialog } from './EditCoverDialog';
import { getBookMetadata } from '@/lib/api';
import type { Book, BookMetadata } from '@/types';

interface BookHeroProps {
  book: Book;
}

export function BookHero({ book }: BookHeroProps) {
  const [state, setState] = useState<{
    metadata: BookMetadata | null;
    loading: boolean;
    imgError: boolean;
    bookId: number | null;
  }>({ metadata: null, loading: true, imgError: false, bookId: null });

  // Reset state when the book changes, then fetch
  if (state.bookId !== book.id) {
    setState({ metadata: null, loading: true, imgError: false, bookId: book.id });
  }

  useEffect(() => {
    let cancelled = false;

    getBookMetadata(book.id)
      .then((data) => {
        if (!cancelled) setState((s) => ({ ...s, metadata: data, loading: false }));
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, metadata: null, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [book.id]);

  const { metadata, loading, imgError } = state;
  const setImgError = (v: boolean) => setState((s) => ({ ...s, imgError: v }));
  const [editOpen, setEditOpen] = useState(false);

  const hasCover = metadata?.coverUrl && !imgError;

  function handleCoverUpdated(newMetadata: BookMetadata) {
    setState((s) => ({ ...s, metadata: newMetadata, imgError: false }));
  }

  return (
    <div className="shrink-0 border-b bg-muted/30">
      <div className="flex items-start gap-4 px-4 py-3">
        {/* Book cover */}
        <div className="group relative h-60 w-42 shrink-0 overflow-hidden rounded-md border bg-muted shadow-sm">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : hasCover ? (
            <img
              src={metadata.coverUrl}
              alt={`Cover of ${book.title}`}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="size-6 text-muted-foreground/50" />
            </div>
          )}
          {/* Edit overlay */}
          {!loading && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-1.5 right-1.5 size-7 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
              onClick={() => setEditOpen(true)}
              title="Edit cover image"
            >
              <Pencil className="size-3.5" />
            </Button>
          )}
        </div>

        <EditCoverDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          bookId={book.id}
          bookTitle={book.title}
          currentCoverUrl={hasCover ? metadata.coverUrl : ''}
          onCoverUpdated={handleCoverUpdated}
        />

        {/* Book info */}
        <div className="min-w-0 flex-1 space-y-2 py-1">
          <h2 className="text-xl font-bold leading-snug line-clamp-2">
            {book.title}
          </h2>
          {book.author && (
            <p className="text-base text-muted-foreground">
              {book.author}
            </p>
          )}

          {/* Meta details — stacked vertically */}
          <div className="flex flex-col gap-1.5 pt-1">
            {!loading && metadata?.publishYear ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                First published {metadata.publishYear}
              </span>
            ) : null}

            {!loading && metadata?.pageCount ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="size-4" />
                {metadata.pageCount} pages
              </span>
            ) : null}

            {book.publisher && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                Published by {book.publisher}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="size-4" />
              {book.highlightCount} highlight{book.highlightCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Subjects/tags */}
          {!loading && metadata?.subjects && metadata.subjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Tag className="size-4 text-muted-foreground" />
              {metadata.subjects.slice(0, 3).map((s) => (
                <Badge key={s} variant="outline" className="text-xs px-2 py-0.5">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
