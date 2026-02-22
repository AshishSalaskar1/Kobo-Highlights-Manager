import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileAccepted, disabled = false }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/x-sqlite3': ['.sqlite'] },
    maxFiles: 1,
    disabled,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        'cursor-pointer border-2 border-dashed transition-colors',
        isDragActive && !isDragReject && 'border-primary bg-primary/5',
        isDragReject && 'border-destructive bg-destructive/5',
        !isDragActive && 'border-muted-foreground/25 hover:border-primary/50',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        <input {...getInputProps()} />
        <div
          className={cn(
            'rounded-full p-4 transition-colors',
            isDragActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {isDragActive ? <FileUp className="size-8" /> : <Upload className="size-8" />}
        </div>
        <div className="text-center">
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop your file here' : 'Drag & drop your Kobo database'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDragReject
              ? 'Only .sqlite files are accepted'
              : 'or click to browse for KoboReader.sqlite'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
