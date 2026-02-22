import { ArrowUp, ArrowDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';
import type { SortField } from '@/types';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'position', label: 'Position' },
  { value: 'date', label: 'Date' },
  { value: 'color', label: 'Color' },
  { value: 'chapter', label: 'Chapter' },
];

export function SortControls() {
  const sortField = useUIStore((s) => s.sortField);
  const setSortField = useUIStore((s) => s.setSortField);
  const sortDirection = useUIStore((s) => s.sortDirection);
  const setSortDirection = useUIStore((s) => s.setSortDirection);

  const toggleDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-1">
      <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
        <SelectTrigger size="sm" className="w-[110px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleDirection}
        aria-label={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sortDirection === 'asc' ? (
          <ArrowUp className="size-4" />
        ) : (
          <ArrowDown className="size-4" />
        )}
      </Button>
    </div>
  );
}
