import { useState, useEffect } from 'react';
import { Bold, Italic, Heading2, List, Quote } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HIGHLIGHT_COLORS, HighlightColor } from '@/types';
import type { Highlight } from '@/types';
import { cn } from '@/lib/utils';

export interface HighlightFormData {
  text: string;
  annotation?: string;
  chapter?: string;
  color?: number;
}

interface AddHighlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: HighlightFormData) => Promise<void>;
  /** When provided, the dialog operates in edit mode */
  editingHighlight?: Highlight | null;
}

const markdownActions = [
  { icon: Bold, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: Italic, label: 'Italic', prefix: '_', suffix: '_' },
  { icon: Heading2, label: 'Heading', prefix: '## ', suffix: '' },
  { icon: List, label: 'List', prefix: '- ', suffix: '' },
  { icon: Quote, label: 'Quote', prefix: '> ', suffix: '' },
] as const;

export function AddHighlightDialog({ open, onOpenChange, onAdd, editingHighlight }: AddHighlightDialogProps) {
  const [text, setText] = useState('');
  const [annotation, setAnnotation] = useState('');
  const [chapter, setChapter] = useState('');
  const [color, setColor] = useState<HighlightColor>(HighlightColor.Yellow);
  const [loading, setLoading] = useState(false);

  const isEditing = !!editingHighlight;

  // Pre-fill fields when editing
  useEffect(() => {
    if (editingHighlight && open) {
      setText(editingHighlight.text || '');
      setAnnotation(editingHighlight.annotation || '');
      setChapter(editingHighlight.chapter || '');
      setColor(editingHighlight.color ?? HighlightColor.Yellow);
    } else if (!open) {
      setText('');
      setAnnotation('');
      setChapter('');
      setColor(HighlightColor.Yellow);
    }
  }, [editingHighlight, open]);

  const insertMarkdown = (prefix: string, suffix: string) => {
    const textarea = document.getElementById('highlight-text') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = `${before}${prefix}${selected}${suffix}${after}`;
    setText(newText);

    // Restore cursor position after the inserted text
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + prefix.length + selected.length + suffix.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      await onAdd({
        text: text.trim(),
        annotation: annotation.trim() || undefined,
        chapter: chapter.trim() || undefined,
        color,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Highlight' : 'Add Highlight'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this highlight.'
              : 'Add a highlight or passage to this book.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Markdown-style editor */}
          <div className="space-y-2">
            <label htmlFor="highlight-text" className="text-sm font-medium">
              Highlight Text <span className="text-destructive">*</span>
            </label>

            {/* Formatting toolbar */}
            <div className="flex items-center gap-1 rounded-t-md border border-b-0 bg-muted/50 px-2 py-1">
              {markdownActions.map(({ icon: Icon, label, prefix, suffix }) => (
                <Button
                  key={label}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  title={label}
                  onClick={() => insertMarkdown(prefix, suffix)}
                >
                  <Icon className="size-3.5" />
                </Button>
              ))}
            </div>

            <textarea
              id="highlight-text"
              placeholder="Paste or type your highlight text…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="w-full resize-y rounded-b-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono leading-relaxed"
              autoFocus
            />
          </div>

          {/* Chapter (optional) */}
          <div className="space-y-2">
            <label htmlFor="highlight-chapter" className="text-sm font-medium">
              Chapter <span className="text-xs text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="highlight-chapter"
              placeholder="e.g. Chapter 3: The Cognitive Revolution"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
            />
          </div>

          {/* Annotation (optional) */}
          <div className="space-y-2">
            <label htmlFor="highlight-annotation" className="text-sm font-medium">
              Note <span className="text-xs text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="highlight-annotation"
              placeholder="Your personal note about this highlight…"
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Color</span>
            <div className="flex items-center gap-2">
              {(Object.entries(HIGHLIGHT_COLORS) as [string, { name: string; hex: string }][]).map(
                ([key, info]) => {
                  const colorVal = Number(key) as HighlightColor;
                  return (
                    <button
                      key={key}
                      type="button"
                      title={info.name}
                      className={cn(
                        'size-6 rounded-full border-2 transition-transform',
                        color === colorVal
                          ? 'scale-110 border-foreground'
                          : 'border-transparent hover:scale-105',
                      )}
                      style={{ backgroundColor: info.hex }}
                      onClick={() => setColor(colorVal)}
                    />
                  );
                },
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!text.trim() || loading}>
              {loading ? (isEditing ? 'Saving…' : 'Adding…') : (isEditing ? 'Save Changes' : 'Add Highlight')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
