import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIStore } from '@/store/uiStore';
import { exportMarkdown } from '@/lib/export-markdown';
import { exportJson } from '@/lib/export-json';
import { exportPlaintext } from '@/lib/export-plaintext';
import type { Highlight, Book } from '@/types';

type ExportFormat = 'markdown' | 'json' | 'plaintext';
type ExportScope = 'current' | 'all';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlights: Highlight[];
  books: Book[];
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
  { value: 'plaintext', label: 'Plain Text' },
];

const FORMAT_META: Record<ExportFormat, { ext: string; mime: string }> = {
  markdown: { ext: 'md', mime: 'text/markdown' },
  json: { ext: 'json', mime: 'application/json' },
  plaintext: { ext: 'txt', mime: 'text/plain' },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportDialog({ open, onOpenChange, highlights, books }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [scope, setScope] = useState<ExportScope>('all');
  const selectedBookId = useUIStore((s) => s.selectedBookId);

  const hasSelectedBook = selectedBookId !== null;
  const selectedBook = hasSelectedBook
    ? books.find((b) => b.id === selectedBookId) ?? null
    : null;

  const scopedHighlights = useMemo(() => {
    if (scope === 'current' && selectedBookId !== null) {
      return highlights.filter((h) => h.bookId === selectedBookId);
    }
    return highlights;
  }, [highlights, scope, selectedBookId]);

  const scopedBooks = useMemo(() => {
    if (scope === 'current' && selectedBookId !== null) {
      return books.filter((b) => b.id === selectedBookId);
    }
    return books;
  }, [books, scope, selectedBookId]);

  const preview = useMemo(() => {
    if (scopedHighlights.length === 0) return 'No highlights to export.';
    switch (format) {
      case 'markdown':
        return exportMarkdown(scopedHighlights, scopedBooks);
      case 'json':
        return exportJson(scopedHighlights, scopedBooks);
      case 'plaintext':
        return exportPlaintext(scopedHighlights, scopedBooks);
    }
  }, [format, scopedHighlights, scopedBooks]);

  const handleDownload = () => {
    const meta = FORMAT_META[format];
    const suffix =
      scope === 'current' && selectedBook
        ? slugify(selectedBook.title)
        : 'all';
    const filename = `kobo-highlights-${suffix}.${meta.ext}`;
    downloadFile(preview, filename, meta.mime);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Highlights</DialogTitle>
          <DialogDescription>
            Choose a format and scope, then download your highlights.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3">
          {/* Format selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Format</label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger size="sm" className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scope selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Scope</label>
            <Select value={scope} onValueChange={(v) => setScope(v as ExportScope)}>
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Books</SelectItem>
                {hasSelectedBook && (
                  <SelectItem value="current">
                    {selectedBook?.title ?? 'Current Book'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        <ScrollArea className="bg-muted h-64 rounded-md border p-1">
          <pre className="whitespace-pre-wrap p-3 font-mono text-xs">
            {preview}
          </pre>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={scopedHighlights.length === 0}>
            <Download className="size-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
