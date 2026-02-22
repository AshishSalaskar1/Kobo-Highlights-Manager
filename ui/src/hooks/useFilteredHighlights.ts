import { useMemo } from 'react';
import type { Highlight } from '../types';
import { useUIStore } from '../store/uiStore';
import { compareByPosition } from '../lib/kobo-parser';

export function useFilteredHighlights(highlights: Highlight[]): Highlight[] {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const sortField = useUIStore((s) => s.sortField);
  const sortDirection = useUIStore((s) => s.sortDirection);
  const filters = useUIStore((s) => s.filters);

  return useMemo(() => {
    let result = [...highlights];

    // Apply color filter
    if (filters.colors.length > 0) {
      result = result.filter((h) => filters.colors.includes(h.color));
    }

    // Apply favorites filter
    if (filters.favoritesOnly) {
      result = result.filter((h) => h.isFavorite);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (h) =>
          (h.text || '').toLowerCase().includes(query) ||
          (h.annotation || '').toLowerCase().includes(query) ||
          (h.chapter || '').toLowerCase().includes(query)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'position':
          cmp = compareByPosition(a, b);
          break;
        case 'date':
          cmp = (a.dateCreated || '').localeCompare(b.dateCreated || '');
          break;
        case 'color':
          cmp = a.color - b.color;
          break;
        case 'chapter':
          cmp = (a.chapter || '').localeCompare(b.chapter || '');
          break;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [highlights, searchQuery, sortField, sortDirection, filters]);
}
