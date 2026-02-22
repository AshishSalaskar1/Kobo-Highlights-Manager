import { Usb, FolderOpen, Eye, FileSearch, MousePointerClick } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  { icon: Usb, text: 'Connect your Kobo e-reader to your computer via USB' },
  { icon: FolderOpen, text: 'Open the Kobo drive in your file browser' },
  { icon: Eye, text: 'Navigate to the .kobo hidden directory (you may need to enable hidden files)' },
  { icon: FileSearch, text: 'Find the KoboReader.sqlite file' },
  { icon: MousePointerClick, text: 'Drag and drop the file into the upload area above' },
] as const;

export function ImportInstructions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">How to find your Kobo highlights</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                <step.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm">{step.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
