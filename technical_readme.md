---
title: Kobo Highlight Manager Technical Overview
description: Architecture, tech stack, and data flow documentation for the Kobo Highlight Manager project
author: Ashish
ms.date: 2026-02-22
ms.topic: overview
keywords:
  - kobo
  - highlights
  - architecture
  - technical overview
---

## Purpose

A tool to import, browse, search, filter, and export highlights and annotations from a Kobo e-reader. You upload the `KoboReader.sqlite` database file from your Kobo device, and the app parses, stores, and lets you interact with your highlights.

## High-Level Architecture

```text
┌─────────────┐       REST API        ┌──────────────┐
│   React UI  │  ◄──────────────────► │ Express API  │
│  (Vite SPA) │   localhost:5173      │  (Node.js)   │
│  Port 5173  │   proxied to :3001    │  Port 3001   │
└─────────────┘                       └──────┬───────┘
                                             │
                                     ┌───────▼───────┐
                                     │  SQLite DB    │
                                     │ highlights.db │
                                     └───────────────┘
```

The project follows a classic client-server monorepo pattern with two separate apps:

| Layer      | Directory      | Role                                              |
|------------|----------------|----------------------------------------------------|
| Frontend   | `ui/`          | React SPA presenting highlights, search, and export |
| Backend    | `server/`      | Express REST API for import parsing and persistence |
| Data       | `server/data/` | SQLite database (`highlights.db`)                  |
| Sample     | `sample_data/` | A sample `KoboReader.sqlite` for testing           |

## Tech Stack

### Backend (`server/`)

| Technology      | Purpose                                                              |
|-----------------|----------------------------------------------------------------------|
| Node.js Express | HTTP server and REST API                                             |
| TypeScript      | Type safety (compiled via `tsx`)                                     |
| better-sqlite3  | Synchronous SQLite driver for both the app DB and reading the Kobo DB |
| multer          | File upload handling (receives the `KoboReader.sqlite`)              |
| cors            | Cross-origin support for dev (UI on `:5173`, API on `:3001`)        |
| tsx             | Dev runner with hot-reload (`tsx watch`)                             |

### Frontend (`ui/`)

| Technology            | Purpose                                             |
|-----------------------|-----------------------------------------------------|
| React 19              | UI framework                                        |
| TypeScript            | Type safety                                         |
| Vite 7                | Dev server and bundler                              |
| Tailwind CSS 4        | Utility-first styling                               |
| shadcn/ui + Radix UI  | Pre-built accessible UI components                  |
| Zustand               | Lightweight global state management with persistence |
| Lucide React          | Icon library                                        |
| react-dropzone        | Drag-and-drop file upload for the import flow       |
| @tanstack/react-virtual | Virtualized list rendering for large highlight sets |
| Sonner                | Toast notifications                                 |
| cmdk                  | Command palette style search                        |

## API Endpoints

| Method  | Route                          | Purpose                                                 |
|---------|--------------------------------|---------------------------------------------------------|
| `POST`  | `/api/import`                  | Upload `KoboReader.sqlite`, extract highlights, upsert  |
| `GET`   | `/api/books`                   | List all books with highlight counts                    |
| `GET`   | `/api/highlights?bookId=N`     | List highlights (optionally filtered by book)           |
| `PATCH` | `/api/highlights/:id/favorite` | Toggle a highlight's favorite status                    |
| `DELETE`| `/api/data`                    | Wipe all data (reset)                                   |

## Database Schema

Three tables live in `server/src/db.ts`:

* `books`: title, author, ISBN, publisher, language, `kobo_id` (unique)
* `highlights`: text, annotation, chapter, color, position, `kobo_bookmark_id` (unique), favorites, tags
* `imports`: audit log of each import (counts, timestamps, status)

## Frontend Structure

```text
ui/src/
├── App.tsx                       Root: shows ImportView or MainLayout
├── store/uiStore.ts              Zustand store (selectedBook, search, sort, filters)
├── hooks/
│   ├── useAppDb.ts               Data fetching hook (calls api.ts, manages state)
│   └── useFilteredHighlights.ts  Client-side search/sort/filter logic
├── lib/
│   ├── api.ts                    Fetch wrappers for the REST API
│   ├── kobo-parser.ts            Position comparison utility
│   ├── export-json.ts            Export highlights as JSON
│   ├── export-markdown.ts        Export highlights as Markdown
│   ├── export-plaintext.ts       Export highlights as plain text
│   └── utils.ts                  Tailwind class merge helper
├── components/
│   ├── import/                   DropZone, ImportInstructions, ImportView
│   ├── books/                    BookList, BookListItem (sidebar)
│   ├── highlights/               HighlightCard, HighlightList, DetailSheet
│   ├── toolbar/                  SearchBar, FilterControls, SortControls, Toolbar
│   ├── export/                   ExportDialog
│   ├── layout/                   Header, MainLayout
│   └── ui/                       shadcn primitives (button, card, dialog, etc.)
└── types/index.ts                Book, Highlight, HighlightColor types
```

## Data Flow

1. The user drops `KoboReader.sqlite` onto the UI via `react-dropzone`.
2. The file uploads to `POST /api/import`.
3. The server opens the Kobo DB with `better-sqlite3` and runs an extraction SQL joining `Bookmark` and `content` tables.
4. Extracted rows are upserted into the app's `highlights.db` and counts are returned.
5. The `useAppDb` hook calls `GET /api/books` and `GET /api/highlights` on mount, populating React state.
6. `useFilteredHighlights` applies client-side search, sort, and color/favorite filters.
7. Users can toggle favorites (optimistic UI + `PATCH`), view a detail sheet, and export as JSON, Markdown, or plaintext.
8. Navigation state (selected book, search query, sort, filters, view mode) lives in Zustand with `persist` middleware so it survives page refreshes.

## Key Design Decisions

* Server-side Kobo parsing keeps the browser free of SQLite WASM complexities.
* Upsert-based imports use `ON CONFLICT ... DO UPDATE` so re-importing the same Kobo DB is idempotent and updates changed highlights.
* Client-side filtering via `useFilteredHighlights` works well since the per-user highlight dataset is manageable in size.
* `@tanstack/react-virtual` provides virtualized rendering for smooth scrolling even with thousands of highlights.
* Optimistic updates on favorite toggling update the UI instantly and roll back on API failure.
