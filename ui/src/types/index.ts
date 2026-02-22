// Book — represents a book from the Kobo library or manually added
export interface Book {
  id: number;
  title: string;
  author: string;
  highlightCount: number;
  isbn: string;
  publisher: string;
  language: string;
  koboId: string;
  isManual: boolean;
  createdAt: string;
  updatedAt: string;
}

// Highlight — represents a single highlight/annotation
export interface Highlight {
  id: number;
  bookId: number;
  text: string;
  annotation: string;
  chapter: string;
  chapterProgress: number;
  color: HighlightColor;
  dateCreated: string;
  dateModified: string;
  positionPart: number;
  positionPara: number;
  positionSeg: number;
  koboBookmarkId: string;
  isFavorite: boolean;
  isManual: boolean;
  tags: string[];
  createdAt: string;
}

// Highlight color constants matching Kobo integers
export const HighlightColor = {
  Yellow: 0,
  Blue: 1,
  Pink: 2,
  Orange: 3,
} as const;

export type HighlightColor = (typeof HighlightColor)[keyof typeof HighlightColor];

// Color display information
export const HIGHLIGHT_COLORS: Record<HighlightColor, { name: string; hex: string; tailwind: string }> = {
  [HighlightColor.Yellow]: { name: 'Yellow', hex: '#FFEB3B', tailwind: 'bg-yellow-400' },
  [HighlightColor.Blue]:   { name: 'Blue',   hex: '#64B5F6', tailwind: 'bg-blue-400' },
  [HighlightColor.Pink]:   { name: 'Pink',   hex: '#EF5350', tailwind: 'bg-red-400' },
  [HighlightColor.Orange]: { name: 'Orange', hex: '#FFA726', tailwind: 'bg-orange-400' },
};

// Result from the server import endpoint
export interface ImportResult {
  booksAdded: number;
  booksUpdated: number;
  highlightsAdded: number;
  highlightsUpdated: number;
  totalRows: number;
}

// Sort options for highlights
export type SortField = 'position' | 'date' | 'color' | 'chapter';
export type SortDirection = 'asc' | 'desc';

// Filter state
export interface FilterState {
  colors: HighlightColor[];
  favoritesOnly: boolean;
}

// Book metadata from Open Library (cached on server)
export interface BookMetadata {
  coverUrl: string;
  description: string;
  subjects: string[];
  publishYear: number;
  pageCount: number;
  olKey: string;
}
