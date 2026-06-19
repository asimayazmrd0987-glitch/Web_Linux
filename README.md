# Web Ubuntu (React Web Desktop)
# Link: https://web-linux-delta.vercel.app/

A browser-based Ubuntu-like desktop environment implemented as a **React + TypeScript + Vite** single-page app.

> Note: This repository provides the **web desktop UI** (window manager, dock, launcher, and apps).

## Features
- Ubuntu-style desktop shell: wallpaper, icons, dock, top panel
- Window manager: open/close/minimize/focus, drag handling, Alt+Tab switcher
- Built-in apps (implemented under `Web_Based_Ubuntu Linux/app/src/apps/*`)
- In-browser “Terminal” with bash-like commands backed by a simulated in-app filesystem

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)

## Run locally (for an individual)

### Option A: Development mode (recommended)
1. Open a terminal in this repository root.
2. Go to the web app folder and install dependencies:

```bash
cd "Web_Based_Ubuntu Linux/app"
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the URL printed by Vite in your browser (usually http://localhost:5173).

### Option B: Production build
```bash
cd "Web_Based_Ubuntu Linux/app"
npm install
npm run build
```

The built site will be generated in `Web_Based_Ubuntu Linux/app/dist/`.


## Key shortcuts
From `Web_Based_Ubuntu Linux/app/src/App.tsx`:
- **Super (Meta)**: toggle app launcher
- **Ctrl + Alt + T**: open Terminal
- **Super + D**: minimize all windows
- **Alt + Tab**: window switching

## Included apps (by category)
These are the app entries in `Web_Based_Ubuntu Linux/app/src/apps/registry.ts`.

**System**
- File Manager, Terminal, Text Editor, Calculator, System Settings, System Monitor, Archive Manager

**Productivity**
- Calendar, Notes, Todo List, Clock, Spreadsheet, Document Viewer, Reminders, Contacts, Password Manager, Whiteboard

**Internet**
- Web Browser, Email, Chat, Weather, RSS Reader, FTP Client, Network Tools

**Media**
- Music Player, Video Player, Image Viewer, Photo Editor, Voice Recorder, Screen Recorder, Media Converter

**Games**
- Minesweeper, Snake, Tetris, Tic-Tac-Toe, 2048, Sudoku, Chess, Memory Game, Pong, Solitaire, Flappy Bird

**Dev Tools**
- Code Editor, JSON Formatter, Regex Tester, Markdown Preview, Git Client, API Tester, Base64 Tool, Color Palette

**Creative**
- Drawing, Color Picker, Image Gallery, ASCII Art

## License
MIT (see `LICENSE`).

