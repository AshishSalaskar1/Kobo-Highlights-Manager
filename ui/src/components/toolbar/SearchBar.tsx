import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';

export function SearchBar() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when the store value changes externally
  // (e.g. resetFilters, or typing in the Header search bar)
  const prevStoreQuery = useRef(searchQuery);
  useEffect(() => {
    if (searchQuery !== prevStoreQuery.current) {
      prevStoreQuery.current = searchQuery;
      setLocalQuery(searchQuery);
    }
  }, [searchQuery]);

  // Debounce local input → store
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [localQuery, setSearchQuery]);

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
  };

  return (
    <div className="relative w-full max-w-xs">
      <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        placeholder="Search highlights…"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        className="pl-8 pr-8"
      />
      {localQuery && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-1.5 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
