import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ImportView } from '@/components/import/ImportView';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAppDb } from '@/hooks/useAppDb';
import { useUIStore } from '@/store/uiStore';
import { ThemeProvider } from 'next-themes';

function App() {
  const { books, highlights, isDbReady, importFile, toggleFavorite, resetDatabase, addManualBook, addManualHighlight, updateManualHighlight } = useAppDb();
  const isLoaded = useUIStore((s) => s.isLoaded);

  if (!isDbReady) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Skeleton className="h-8 w-48" />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen bg-background text-foreground">
      {isLoaded ? (
        <MainLayout
          books={books}
          highlights={highlights}
          toggleFavorite={toggleFavorite}
          resetDatabase={resetDatabase}
          addManualBook={addManualBook}
          addManualHighlight={addManualHighlight}
          updateManualHighlight={updateManualHighlight}
        />
      ) : (
        <ImportView importFile={importFile} />
      )}
      <Toaster />
    </div>
    </ThemeProvider>
  );
}

export default App;
