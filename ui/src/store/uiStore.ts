import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SortField, SortDirection, FilterState, HighlightColor } from '../types';

interface UIState {
  // Navigation
  selectedBookId: number | null;
  isLoaded: boolean;
  isImporting: boolean;

  // Search & filter
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  filters: FilterState;

  // UI preferences
  viewMode: 'cards' | 'list';
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;

  // Detail sheet
  selectedHighlightId: number | null;

  // Actions
  setSelectedBookId: (id: number | null) => void;
  setIsLoaded: (loaded: boolean) => void;
  setIsImporting: (importing: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  toggleColorFilter: (color: HighlightColor) => void;
  setFavoritesOnly: (favOnly: boolean) => void;
  setViewMode: (mode: 'cards' | 'list') => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setSelectedHighlightId: (id: number | null) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  colors: [],
  favoritesOnly: false,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedBookId: null,
      isLoaded: false,
      isImporting: false,
      searchQuery: '',
      sortField: 'position' as SortField,
      sortDirection: 'asc' as SortDirection,
      filters: { ...defaultFilters },
      viewMode: 'cards' as const,
      sidebarOpen: true,
      mobileSidebarOpen: false,
      selectedHighlightId: null,

      setSelectedBookId: (id) => set({ selectedBookId: id }),
      setIsLoaded: (loaded) => set({ isLoaded: loaded }),
      setIsImporting: (importing) => set({ isImporting: importing }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortField: (field) => set({ sortField: field }),
      setSortDirection: (dir) => set({ sortDirection: dir }),
      toggleColorFilter: (color) =>
        set((state) => {
          const colors = state.filters.colors.includes(color)
            ? state.filters.colors.filter((c) => c !== color)
            : [...state.filters.colors, color];
          return { filters: { ...state.filters, colors } };
        }),
      setFavoritesOnly: (favOnly) =>
        set((state) => ({ filters: { ...state.filters, favoritesOnly: favOnly } })),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setSelectedHighlightId: (id) => set({ selectedHighlightId: id }),
      resetFilters: () => set({ filters: { ...defaultFilters }, searchQuery: '' }),
    }),
    {
      name: 'kobo-ui-preferences',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sidebarOpen: state.sidebarOpen,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
      }),
    }
  )
);
