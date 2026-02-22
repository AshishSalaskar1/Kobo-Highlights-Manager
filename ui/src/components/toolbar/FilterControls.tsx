import { Heart, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';
import { HighlightColor, HIGHLIGHT_COLORS } from '@/types';
import { cn } from '@/lib/utils';

const COLOR_ENTRIES = [
  HighlightColor.Yellow,
  HighlightColor.Blue,
  HighlightColor.Pink,
  HighlightColor.Orange,
] as const;

export function FilterControls() {
  const filters = useUIStore((s) => s.filters);
  const toggleColorFilter = useUIStore((s) => s.toggleColorFilter);
  const setFavoritesOnly = useUIStore((s) => s.setFavoritesOnly);
  const resetFilters = useUIStore((s) => s.resetFilters);

  const hasActiveFilters =
    filters.colors.length > 0 || filters.favoritesOnly;

  return (
    <div className="flex items-center gap-2">
      {/* Color filter circles */}
      <div className="flex items-center gap-1">
        {COLOR_ENTRIES.map((color) => {
          const info = HIGHLIGHT_COLORS[color];
          const isActive = filters.colors.includes(color);
          return (
            <button
              key={color}
              onClick={() => toggleColorFilter(color)}
              aria-label={`Filter ${info.name}`}
              aria-pressed={isActive}
              className={cn(
                'size-6 rounded-full transition-all',
                info.tailwind,
                isActive
                  ? 'ring-ring scale-110 ring-2 ring-offset-1'
                  : 'opacity-60 hover:opacity-100',
              )}
            />
          );
        })}
      </div>

      {/* Favorites toggle */}
      <Button
        variant={filters.favoritesOnly ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setFavoritesOnly(!filters.favoritesOnly)}
        aria-label="Favorites only"
        aria-pressed={filters.favoritesOnly}
      >
        <Heart
          className={cn('size-4', filters.favoritesOnly && 'fill-current')}
        />
        Favorites
      </Button>

      {/* Reset filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          aria-label="Reset filters"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}
