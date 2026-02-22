
<div align="center">


## Kobo Highlight Manager

*Your Kobo highlights deserve better than a buried SQLite file.*

Import, browse, search, filter, and export every highlight and annotation from your Kobo e-reader through a clean, modern web interface.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

</div>

[![Hero_Banner.png](https://i.postimg.cc/wv49FpPX/Hero_Banner.png)](https://postimg.cc/47tCNrXy)

---

<!-- Screenshot: Full app overview showing book sidebar + highlight cards -->
<!-- ![App Overview](docs/assets/screenshot-overview.png) -->

## Why This Exists

Kobo e-readers store highlights and annotations in a local SQLite database (`KoboReader.sqlite`). Accessing them means navigating hidden folders, running raw SQL queries, or relying on Kobo's limited built-in tools. Kobo Highlight Manager solves this by extracting that data and presenting it in an interface designed for reading, revisiting, and organizing your notes.

Drop your Kobo database file into the app, and every highlight appears instantly: grouped by book, searchable, filterable, and exportable.

## How It Works

1. Connect your Kobo to your computer and copy the `KoboReader.sqlite` file from the hidden `.kobo` folder.
2. Drop the file into the web app. The server parses the Kobo database and extracts every highlight.
3. Browse, search, filter, favorite, and export your highlights in any format you need.

Re-importing is safe. The upsert logic detects changes and updates existing entries without creating duplicates.

## Features
[![Chat_GPT_Image_Feb_22_2026_02_01_19_PM.png](https://i.postimg.cc/nVT3RL04/Chat_GPT_Image_Feb_22_2026_02_01_19_PM.png)](https://postimg.cc/vDg7DGRT)

### 📥 Drag & Drop Import

Drop your `KoboReader.sqlite` file into the browser. The backend extracts books, highlights, annotations, reading positions, and timestamps in one pass. Re-importing is safe: upsert logic prevents duplicates and surfaces import stats (total, updated, errors).

### 📚 Book Library with Covers

A sidebar lists every book alongside its highlight count. Each book gets a hero section with auto-fetched cover art, overridable via ISBN, title search, or a custom URL.

### 🔍 Search, Filter, and Sort

Search across your entire library instantly. Filter by highlight color, favorites, or specific book. Sort by reading position, chapter, or date created. Filter state persists across sessions.

### 💛 Favorites

Heart any highlight with a single click. The UI updates optimistically and syncs with the server in the background, rolling back automatically on failure.

### 📖 Highlight Detail View

Click a highlight to see its full text, annotation, chapter, color, reading position, and creation timestamp. Long highlights expand inline with a "Show more" toggle.

### ✏️ Manual Entries

Add books, highlights, and annotations manually for content that lives outside your Kobo: physical books, PDFs, Kindle notes, or web articles.

### 📤 Multi-Format Export

Export to Markdown (Obsidian/Notion ready), JSON, or plain text. Choose a single book or your entire library. Markdown output groups highlights by book and chapter with blockquote formatting.

### 🎨 Light and Dark Mode

Theme support via `next-themes`. The app respects your system preference and lets you toggle manually.

### 🚀 Virtualized Rendering

Thousands of highlights scroll smoothly thanks to `@tanstack/react-virtual`, which renders only the visible items.

<!-- Screenshot: Side-by-side light vs dark mode -->
<!-- ![Themes](docs/assets/screenshot-themes.png) -->

## Tech Stack

| Layer    | Technology                                                    |
|----------|---------------------------------------------------------------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui      |
| Backend  | Node.js, Express, TypeScript, better-sqlite3                  |
| State    | Zustand with persistence middleware                           |
| UI       | Radix UI primitives, Lucide icons, cmdk, Sonner               |
| Upload   | react-dropzone (client), multer (server)                      |
| Deploy   | Docker multi-stage build                                      |

## How to Use

### Step 1: Find Your Kobo Database

1. Connect your Kobo e-reader to your computer via USB.
2. Open the Kobo drive and navigate to the hidden `.kobo` folder.
3. Copy `KoboReader.sqlite` to your computer.

> [!TIP]
> On macOS or Linux, press `Cmd+Shift+.` or `Ctrl+H` to reveal hidden files if the `.kobo` folder is not visible.

### Step 2: Import

Open the app in your browser and drag the `KoboReader.sqlite` file onto the upload area (or click to browse). A toast notification confirms how many highlights were imported and how many were updated.

### Step 3: Browse and Organize

* Select a book from the sidebar to view its highlights.
* Use the search bar to find highlights by text content.
* Filter by highlight color or toggle the favorites filter.
* Sort by reading position, date, or chapter.

### Step 4: Export

Click the export button, pick a format (Markdown, JSON, or plain text), choose the scope (current book or all books), and download.

## Setup

### Option 1: Docker (Recommended)

No Node.js installation required. One command gets everything running.

```bash
git clone https://github.com/your-username/kobo-highlight-manager.git
cd kobo-highlight-manager

docker build -t kobo-highlight-manager .
docker run -p 3001:3001 kobo-highlight-manager
```

Open <http://localhost:3001> and you are set.

To persist data between container restarts, mount a volume:

```bash
docker run -p 3001:3001 \
  -v kobo-data:/app/server/data \
  kobo-highlight-manager
```

### Option 2: Manual Setup

Requires **Node.js 18+**.

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/kobo-highlight-manager.git
cd kobo-highlight-manager
```

#### 2. Install dependencies

```bash
cd server && npm install
cd ../ui && npm install
```

#### 3. Start the server

```bash
cd server
npm run dev
```

The API starts on `http://localhost:3001`.

#### 4. Start the UI

In a second terminal:

```bash
cd ui
npm run dev
```

The UI starts on `http://localhost:5173` and proxies API requests to the server.

## Architecture

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

The project follows a client-server monorepo pattern. The React SPA handles all presentation and client-side filtering. The Express backend receives the Kobo database upload, parses it with `better-sqlite3`, and serves highlights through a REST API. All application data lives in a local SQLite database (`highlights.db`).

## API Reference

| Method   | Route                          | Purpose                                   |
|----------|--------------------------------|-------------------------------------------|
| `POST`   | `/api/import`                  | Upload and parse `KoboReader.sqlite`      |
| `GET`    | `/api/books`                   | List all books with highlight counts      |
| `GET`    | `/api/highlights?bookId=N`     | List highlights, optionally filter by book |
| `PATCH`  | `/api/highlights/:id/favorite` | Toggle a highlight's favorite status      |
| `DELETE` | `/api/data`                    | Reset all data                            |

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, and open a pull request. For larger changes, open an issue first to discuss what you would like to change.

## License

This project is licensed under the [MIT License](LICENSE).


## Application Screenshots

### Upload File View
[![Upload_File.png](https://i.postimg.cc/Fz13nhKN/Upload_File.png)](https://postimg.cc/fSnVVnXr)

### Main View
[![Book_Highlight_View.png](https://i.postimg.cc/2yJvsgqp/Book_Highlight_View.png)](https://postimg.cc/jnHLNgQv)
 
### Edit Cover Image
[![Edit_Cover_Image.png](https://i.postimg.cc/mkqMvKPv/Edit_Cover_Image.png)](https://postimg.cc/7J3f7sM9)

### Export Options
[![Export_Option.png](https://i.postimg.cc/fyFXG1Vp/Export_Option.png)](https://postimg.cc/p5fp8GYJ)

### Add/Edit Highlights
[![Highlights_Popup.png](https://i.postimg.cc/L57fcGJG/Highlights_Popup.png)](https://postimg.cc/30XdpSCZ)
[![Add_Highlight.png](https://i.postimg.cc/BbyDrRjy/Add_Highlight.png)](https://postimg.cc/rR1KWnCC)
