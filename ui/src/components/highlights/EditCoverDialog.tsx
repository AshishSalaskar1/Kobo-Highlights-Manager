import { useState } from 'react';
import { BookOpen, Loader2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchBookCover, updateBookMetadata } from '@/lib/api';
import type { BookMetadata } from '@/types';

interface EditCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: number;
  bookTitle: string;
  currentCoverUrl: string;
  onCoverUpdated: (metadata: BookMetadata) => void;
}

type SearchMode = 'isbn' | 'title' | 'url';

export function EditCoverDialog({
  open,
  onOpenChange,
  bookId,
  bookTitle,
  currentCoverUrl,
  onCoverUpdated,
}: EditCoverDialogProps) {
  const [mode, setMode] = useState<SearchMode>('title');
  const [query, setQuery] = useState(bookTitle);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<BookMetadata | null>(null);
  const [previewImgError, setPreviewImgError] = useState(false);
  const [error, setError] = useState('');

  function resetState() {
    setPreview(null);
    setPreviewImgError(false);
    setError('');
    setSearching(false);
    setSaving(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetState();
    onOpenChange(next);
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setPreview(null);
    setPreviewImgError(false);

    try {
      const result = await searchBookCover(
        bookId,
        mode === 'isbn' ? { isbn: query.trim() } : { title: query.trim() },
      );

      if (!result.coverUrl) {
        setError('No cover image found. Try a different search term.');
      } else {
        setPreview(result);
      }
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  function handleUrlPreview() {
    const url = query.trim();
    if (!url) return;
    setError('');
    setPreview(null);
    setPreviewImgError(false);

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL.');
      return;
    }

    setPreview({
      coverUrl: url,
      description: '',
      subjects: [],
      publishYear: 0,
      pageCount: 0,
      olKey: '',
    });
  }

  async function handleConfirm() {
    if (!preview) return;
    setSaving(true);
    try {
      await updateBookMetadata(bookId, preview);
      onCoverUpdated(preview);
      handleOpenChange(false);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Cover Image</DialogTitle>
          <DialogDescription>
            Search for a new cover by ISBN, title, or paste an image URL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === 'title' ? 'default' : 'outline'}
              onClick={() => { setMode('title'); setQuery(bookTitle); resetState(); }}
            >
              By Title
            </Button>
            <Button
              size="sm"
              variant={mode === 'isbn' ? 'default' : 'outline'}
              onClick={() => { setMode('isbn'); setQuery(''); resetState(); }}
            >
              By ISBN
            </Button>
            <Button
              size="sm"
              variant={mode === 'url' ? 'default' : 'outline'}
              onClick={() => { setMode('url'); setQuery(''); resetState(); }}
            >
              By URL
            </Button>
          </div>

          {/* Search input */}
          <div className="flex gap-2">
            <Input
              placeholder={
                mode === 'isbn'
                  ? 'Enter ISBN…'
                  : mode === 'url'
                    ? 'Paste image URL…'
                    : 'Enter book title…'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { mode === 'url' ? handleUrlPreview() : handleSearch(); } }}
            />
            <Button
              onClick={mode === 'url' ? handleUrlPreview : handleSearch}
              disabled={mode === 'url' ? !query.trim() : (searching || !query.trim())}
            >
              {searching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Preview comparison */}
          {preview && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Preview</p>
              <div className="flex items-center gap-6">
                {/* Current */}
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <div className="h-32 w-22 overflow-hidden rounded-md border bg-muted shadow-sm">
                    {currentCoverUrl ? (
                      <img
                        src={currentCoverUrl}
                        alt="Current cover"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <BookOpen className="size-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <span className="text-lg text-muted-foreground">→</span>

                {/* New */}
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-xs text-muted-foreground">New</p>
                  <div className="h-32 w-22 overflow-hidden rounded-md border bg-muted shadow-sm ring-2 ring-primary">
                    {preview.coverUrl && !previewImgError ? (
                      <img
                        src={preview.coverUrl}
                        alt="New cover"
                        className="h-full w-full object-cover"
                        onError={() => setPreviewImgError(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <BookOpen className="size-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Confirm / Cancel */}
              <div className="flex gap-2 pt-1">
                <Button onClick={handleConfirm} disabled={saving || previewImgError} className="flex-1">
                  {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Use This Cover
                </Button>
                <Button variant="outline" onClick={() => { setPreview(null); setError(''); }} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
