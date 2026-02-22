import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Header } from './Header';
import { BookList } from '@/components/books/BookList';
import { AddBookDialog } from '@/components/books/AddBookDialog';
import { HighlightList } from '@/components/highlights/HighlightList';
import { AddHighlightDialog } from '@/components/highlights/AddHighlightDialog';
import { BookHero } from '@/components/highlights/BookHero';
import { DetailSheet } from '@/components/highlights/DetailSheet';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { ExportDialog } from '@/components/export/ExportDialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useUIStore } from '@/store/uiStore';
import { useFilteredHighlights } from '@/hooks/useFilteredHighlights';
import type { Book, Highlight } from '@/types';

export interface MainLayoutProps {
  books: Book[];
  highlights: Highlight[];
  toggleFavorite: (id: number) => void;
  resetDatabase: () => Promise<void>;
  addManualBook: (title: string, author: string) => Promise<void>;
  addManualHighlight: (
    bookId: number,
    data: { text: string; annotation?: string; chapter?: string; color?: number },
  ) => Promise<void>;
  updateManualHighlight: (
    highlightId: number,
    data: { text: string; annotation?: string; chapter?: string; color?: number },
  ) => Promise<void>;
}

export function MainLayout({ books, highlights, toggleFavorite, resetDatabase, addManualBook, addManualHighlight, updateManualHighlight }: MainLayoutProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const setIsLoaded = useUIStore((s) => s.setIsLoaded);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const selectedHighlightId = useUIStore((s) => s.selectedHighlightId);
  const setSelectedHighlightId = useUIStore((s) => s.setSelectedHighlightId);
  const selectedBookId = useUIStore((s) => s.selectedBookId);
  const [exportOpen, setExportOpen] = useState(false);
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [addHighlightOpen, setAddHighlightOpen] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);

  const filteredHighlights = useFilteredHighlights(highlights);

  const selectedHighlight = selectedHighlightId
    ? highlights.find((h) => h.id === selectedHighlightId) ?? null
    : null;

  const selectedBook = selectedHighlight
    ? books.find((b) => b.id === selectedHighlight.bookId) ?? null
    : null;

  const activeBook = selectedBookId
    ? books.find((b) => b.id === selectedBookId) ?? null
    : null;

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 p-4 font-semibold">Books</div>
      <Separator className="shrink-0" />
      <BookList books={books} onAddBook={() => setAddBookOpen(true)} />
      <Separator className="shrink-0" />
      <div className="shrink-0 p-3 space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsLoaded(false)}
        >
          <Upload className="size-4" />
          New Import
        </Button>
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive"
          onClick={async () => {
            if (window.confirm('This will delete all imported data. Continue?')) {
              await resetDatabase();
            }
          }}
        >
          Clear All Data
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className={`shrink-0 overflow-hidden border-r transition-[width] duration-200 hidden md:flex md:flex-col ${
            sidebarOpen ? 'w-72' : 'w-0 border-r-0'
          }`}
        >
          <div className="w-72 min-w-[18rem] h-full flex flex-col">
            {sidebarContent}
          </div>
        </aside>

        {/* Mobile sidebar (Sheet overlay) */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0 md:hidden">
            <SheetHeader className="sr-only">
              <SheetTitle>Books</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>

        {/* Main content area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <Toolbar onExport={() => setExportOpen(true)} />
          {activeBook && <BookHero book={activeBook} />}
          {/* Add Highlight button for manual books */}
          {activeBook?.isManual && (
            <div className="shrink-0 px-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddHighlightOpen(true)}
              >
                + Add Highlight
              </Button>
            </div>
          )}
          <HighlightList
            highlights={filteredHighlights}
            onSelectHighlight={(h) => setSelectedHighlightId(h.id)}
            onToggleFavorite={toggleFavorite}
            onEditHighlight={(h) => {
              setEditingHighlight(h);
              setAddHighlightOpen(true);
            }}
          />
          <DetailSheet
            highlight={selectedHighlight}
            book={selectedBook}
            onToggleFavorite={toggleFavorite}
            onClose={() => setSelectedHighlightId(null)}
          />
          <ExportDialog
            open={exportOpen}
            onOpenChange={setExportOpen}
            highlights={filteredHighlights}
            books={books}
          />
          <AddBookDialog
            open={addBookOpen}
            onOpenChange={setAddBookOpen}
            onAdd={addManualBook}
          />
          {activeBook && (
            <AddHighlightDialog
              open={addHighlightOpen}
              onOpenChange={(open) => {
                setAddHighlightOpen(open);
                if (!open) setEditingHighlight(null);
              }}
              editingHighlight={editingHighlight}
              onAdd={async (data) => {
                if (editingHighlight) {
                  await updateManualHighlight(editingHighlight.id, data);
                } else {
                  await addManualHighlight(activeBook.id, data);
                }
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
