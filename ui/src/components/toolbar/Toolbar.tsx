import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SearchBar } from './SearchBar';
import { SortControls } from './SortControls';
import { FilterControls } from './FilterControls';

export interface ToolbarProps {
  onExport: () => void;
}

export function Toolbar({ onExport }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
      <SearchBar />
      <Separator orientation="vertical" className="hidden h-6 sm:block" />
      <SortControls />
      <Separator orientation="vertical" className="hidden h-6 sm:block" />
      <FilterControls />
      <div className="ml-auto">
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="size-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
