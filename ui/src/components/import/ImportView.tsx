import { useState, useCallback } from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { DropZone } from './DropZone';
import { ImportInstructions } from './ImportInstructions';
import type { ImportResult } from '@/types';

interface ImportViewProps {
  importFile: (file: File) => Promise<ImportResult>;
}

export function ImportView({ importFile }: ImportViewProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileAccepted = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setError(null);
      try {
        const result = await importFile(file);
        toast.success(`Imported ${result.totalRows} highlights`, {
          description: `${result.highlightsAdded} new, ${result.highlightsUpdated} updated`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        toast.error('Import failed', { description: msg });
      } finally {
        setIsImporting(false);
      }
    },
    [importFile],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl space-y-8">
        {/* Branding */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <BookOpen className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Kobo Highlight Manager</h1>
          <p className="text-sm text-muted-foreground">
            Import your Kobo highlights and manage them in one place
          </p>
        </div>

        {/* Drop zone / loading */}
        {isImporting ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <p className="text-center text-sm text-muted-foreground">Importing your highlights…</p>
          </div>
        ) : (
          <DropZone onFileAccepted={handleFileAccepted} disabled={isImporting} />
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Instructions */}
        <ImportInstructions />
      </div>
    </div>
  );
}
