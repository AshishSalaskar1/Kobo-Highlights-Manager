import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../lib/api';
import type { Book, Highlight, ImportResult } from '../types';
import { useUIStore } from '../store/uiStore';

export function useAppDb() {
  const [books, setBooks] = useState<Book[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);
  const initialised = useRef(false);

  const selectedBookId = useUIStore((s) => s.selectedBookId);
  const setSelectedBookId = useUIStore((s) => s.setSelectedBookId);
  const setIsLoaded = useUIStore((s) => s.setIsLoaded);

  // Fetch from server on mount
  useEffect(() => {
    (async () => {
      try {
        const booksData = await api.getBooks();
        setBooks(booksData);
        if (booksData.length > 0) {
          setIsLoaded(true);
          const highlightsData = await api.getHighlights();
          setHighlights(highlightsData);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsDbReady(true);
        initialised.current = true;
      }
    })();
  }, [setIsLoaded]);

  // Re-fetch highlights when the selected book changes
  useEffect(() => {
    if (!initialised.current) return;
    (async () => {
      try {
        const data =
          selectedBookId !== null
            ? await api.getHighlights(selectedBookId)
            : await api.getHighlights();
        setHighlights(data);
      } catch (err) {
        console.error('Failed to fetch highlights:', err);
      }
    })();
  }, [selectedBookId]);

  // Upload Kobo file → server parses & stores → refresh local state
  const importFile = useCallback(
    async (file: File): Promise<ImportResult> => {
      const result = await api.importFile(file);
      const booksData = await api.getBooks();
      setBooks(booksData);
      const highlightsData = await api.getHighlights();
      setHighlights(highlightsData);
      setIsLoaded(true);
      return result;
    },
    [setIsLoaded],
  );

  // Add a manual book
  const addManualBook = useCallback(
    async (title: string, author: string) => {
      const newBook = await api.addManualBook(title, author);
      const booksData = await api.getBooks();
      setBooks(booksData);
      setIsLoaded(true);
      // Auto-select the newly added book
      setSelectedBookId(newBook.id);
    },
    [setIsLoaded, setSelectedBookId],
  );

  // Add a manual highlight to the currently selected book
  const addManualHighlight = useCallback(
    async (bookId: number, data: { text: string; annotation?: string; chapter?: string; color?: number }) => {
      await api.addManualHighlight(bookId, data);
      // Refresh books (highlight count changed) and highlights
      const booksData = await api.getBooks();
      setBooks(booksData);
      const highlightsData =
        selectedBookId !== null
          ? await api.getHighlights(selectedBookId)
          : await api.getHighlights();
      setHighlights(highlightsData);
    },
    [selectedBookId],
  );

  // Edit an existing manual highlight
  const updateManualHighlight = useCallback(
    async (highlightId: number, data: { text: string; annotation?: string; chapter?: string; color?: number }) => {
      await api.updateHighlight(highlightId, data);
      const highlightsData =
        selectedBookId !== null
          ? await api.getHighlights(selectedBookId)
          : await api.getHighlights();
      setHighlights(highlightsData);
    },
    [selectedBookId],
  );

  // Toggle favourite — optimistic update, then persist
  const handleToggleFavorite = useCallback((highlightId: number) => {
    setHighlights((prev) =>
      prev.map((h) =>
        h.id === highlightId ? { ...h, isFavorite: !h.isFavorite } : h,
      ),
    );
    api.toggleFavorite(highlightId).catch((err) => {
      console.error('Failed to toggle favorite:', err);
      // Revert on error
      setHighlights((prev) =>
        prev.map((h) =>
          h.id === highlightId ? { ...h, isFavorite: !h.isFavorite } : h,
        ),
      );
    });
  }, []);

  // Clear all data on the server and reset local state
  const resetDatabase = useCallback(async () => {
    await api.resetData();
    setBooks([]);
    setHighlights([]);
    setIsLoaded(false);
  }, [setIsLoaded]);

  return {
    books,
    highlights,
    isDbReady,
    importFile,
    addManualBook,
    addManualHighlight,
    updateManualHighlight,
    toggleFavorite: handleToggleFavorite,
    resetDatabase,
  };
}
