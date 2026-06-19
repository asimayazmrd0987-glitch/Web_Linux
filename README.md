# WebUbuntu 🖥️

> A fully functional Ubuntu-style desktop environment running entirely in your browser.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-vercel-black?style=for-the-badge&logo=vercel)](https://web-linux-delta.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)

---

## ✨ What Makes It Unique

Unlike mockup UIs or simple component demos, **WebUbuntu** is a **real working desktop**:

- 🪟 **Window Manager**: Drag, resize, minimize, maximize, and Alt+Tab between windows
- 📁 **Simulated Filesystem**: Full in-memory file tree with directories, files, permissions, and path navigation
- 💻 **Working Terminal**: Bash-like shell with `cd`, `ls`, `mkdir`, `cat`, `pwd`, `clear`, and more
- 🗂️ **File Manager**: Browse folders, create files/folders, rename, and navigate breadcrumbs
- 🎮 **30+ Built-in Apps**: From productivity tools to games to dev utilities

---

## 🚀 Live Demo

**[➡️ web-linux-delta.vercel.app](https://web-linux-delta.vercel.app)**

Open it in any modern browser, no installation needed.

---

## 📸 Preview

```
┌─────────────────────────────────────────┐
│  🐧 WebUbuntu                    ─ □ ✕  │
├─────────────────────────────────────────┤
│  🖥️ Desktop                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │Terminal │  │ File    │  │ Snake   │  │
│  │  $ _    │  │ Manager │  │  🐍     │  │
│  └─────────┘  └─────────┘  └─────────┘  │
│                                         │
│  📎 Dock: 🗂️ 💻 📝 🧮 🌐 🎵 🎮         |
└─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| State Management | Custom Zustand-like store |
| Deployment | Vercel |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Super` (Windows/Meta) | Toggle App Launcher |
| `Ctrl + Alt + T` | Open Terminal |
| `Super + D` | Minimize All Windows |
| `Alt + Tab` | Switch Windows |

---

## 📦 Included Apps

### System
- File Manager, Terminal, Text Editor, Calculator, System Settings, System Monitor, Archive Manager

### Productivity
- Calendar, Notes, Todo List, Clock, Spreadsheet, Document Viewer, Reminders, Contacts, Password Manager, Whiteboard

### Internet
- Web Browser, Email, Chat, Weather, RSS Reader, FTP Client, Network Tools

### Media
- Music Player, Video Player, Image Viewer, Photo Editor, Voice Recorder, Screen Recorder, Media Converter

### Games 🎮
- Minesweeper, Snake, Tetris, Tic-Tac-Toe, 2048, Sudoku, Chess, Memory Game, Pong, Solitaire, Flappy Bird

### Dev Tools
- Code Editor, JSON Formatter, Regex Tester, Markdown Preview, Git Client, API Tester, Base64 Tool, Color Palette

### Creative
- Drawing, Color Picker, Image Gallery, ASCII Art

---

## 🏃 Run Locally

```bash
# Clone the repo
git clone https://github.com/asimayazmrd0987-glitch/Web_Linux.git
cd Web_Linux

# Install dependencies & start dev server
cd Web_Based_Ubuntu_Linux/app
npm install
npm run dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

---

## 🏗️ Build for Production

```bash
cd Web_Based_Ubuntu_Linux/app
npm run build
```

The static site will be generated in `Web_Based_Ubuntu_Linux/app/dist/`.

---

## 🎯 Why I Built This

I wanted to understand how desktop environments work under the hood — **window management**, **event handling**, **filesystem abstractions**, and **UI state management** by building one myself.

This project started as a learning exercise and grew into a fully interactive web desktop that anyone can try instantly, with zero setup.

---

## 🗺️ Project Structure

```
Web_Based_Ubuntu_Linux/app/src/
├── apps/              # All built-in applications
│   ├── Terminal.tsx
│   ├── FileManager.tsx
│   ├── Snake.tsx
│   └── ...
├── components/        # Desktop shell components
│   ├── WindowFrame.tsx      # Draggable, resizable window chrome
│   ├── WindowManager.tsx    # Renders all open windows
│   ├── Dock.tsx             # Bottom dock bar
│   ├── TopPanel.tsx         # Top status bar
│   └── AppLauncher.tsx      # Super-key app grid
├── hooks/
│   └── useOSStore.ts        # Global desktop state (windows, focus, etc.)
├── types/
│   └── index.ts             # TypeScript types
├── App.tsx                  # Root desktop shell
└── main.tsx                 # Entry point
```

---

## 🚧 Future Ideas

- [ ] Persist filesystem to `localStorage` so files survive refreshes
- [ ] Add a real backend shell via WebSocket (connect to actual Linux container)
- [ ] Multi-user sessions with login screen
- [ ] Custom themes and wallpaper support
- [ ] File drag-and-drop between apps

---

## 📄 License

MIT — feel free to fork, extend, or use as inspiration for your own projects.

---

<p align="center">
  Built with 💜 by <a href="https://github.com/asimayazmrd0987-glitch">asimayazmrd0987-glitch</a>
</p>
