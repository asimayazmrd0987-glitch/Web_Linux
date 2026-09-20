![](https://capsule-render.vercel.app/api?type=waving&color=0:FF0055,100:FFAA00&height=120&section=header&text=WEB%20LINUX&fontSize=36&fontColor=ffffff&animation=fadeIn)

---

<p align="center">
  <b>Web Linux</b> is a fully functional, browser-based simulation of the Ubuntu desktop environment. It runs entirely in your browser with no installation, no backend, and no data ever leaving your device — making it ideal for demos, education, and private experimentation.
</p>

---

# What is Web Linux?

Web Linux is not a static mock-up. It is a **working desktop operating system** rendered in the browser, complete with:

- A functional window manager (move, resize, minimize, maximize, close)
- A taskbar with activities, clock (live date/time), and system tray
- A dock with pinned applications
- A desktop with draggable icons and file drop-zones
- 60+ working applications, each with their own state, UI, and logic

It is designed to feel native and responsive — like opening a real Ubuntu session — while running safely inside any modern browser tab.

---

## 🚀 Live Demo

👉 **[Try it now on Vercel](https://web-linux-delta.vercel.app/)** —> open the link and start using a full Linux desktop instantly. No sign-up, no download, no cookies.

---

## Features

### Desktop Environment
- **GNOME-style top panel** with Activities button, live clock with tooltip, and a unified system tray
- **Dock** with pinned applications, animated launch, and running indicators
- **Draggable desktop icons** with grid-snapping and collision detection (no overlapping icons)
- **File-drop zones** that react only to real files, not icon drags
- **Custom Ubuntu-orange theming** with frosted glass (backdrop-blur) surfaces
- **Dark / Light mode** toggle

### 🌐 Built-in Browser
A fully functional web browser with:
- Multi-tab support with history (back / forward / refresh)
- Bookmarks bar with persistent storage
- **Real YouTube player** using the official `/embed/` endpoint — paste any YouTube link and it plays inside the browser
- **Real OpenStreetMap** embed for live maps
- Simulated pages for sites that block embedding (Google, Twitter, etc.) with working search forms
- **Simulated privacy toolbar**: VPN toggle (with randomized IP display), ad blocker, VM mode indicator
- **Download manager** with progress bars, triggered from simulated pages
- Homepage with quick links, search, and news feed

### 🧮 Calculator
- **Standard mode** (basic arithmetic, percentage, memory)
- **Scientific mode** (sin, cos, tan, log, ln, sqrt, factorial, constants π and e)
- Full keyboard support
- Persistent calculation history
- Memory functions (MC, MR, M+, M−)

### 💻 Terminal
- Command-line interface with command parsing
- Basic Unix-like commands (`ls`, `pwd`, `echo`, `clear`, `help`, `whoami`, `date`, `uptime`)
- Command history navigation with arrow keys

### 📁 File Manager
- Folder navigation with breadcrumbs
- File and folder creation / deletion
- Drag-and-drop support

### Games
Snake • Tetris • Chess • Flappy Bird • Minesweeper • 2048 • Pong • Solitaire • Sudoku • Tic-Tac-Toe • Memory Match

### Developer Tools
- **Code Editor** with syntax highlighting and live HTML preview
- **API Tester** for HTTP requests
- **JSON Formatter**
- **Regex Tester**
- **Git Client** (UI)
- **FTP Client** (UI)

### Creative & Media
- **Drawing** canvas
- **Whiteboard**
- **Photo Editor**
- **Music Player** and **Video Player**
- **Voice Recorder**
- **Screen Recorder**
- **Matrix Rain** effect

### Productivity
- **Text Editor**
- **Notes**
- **Todo** list
- **Reminders**
- **Calendar**
- **Contacts**
- **Email** (UI)
- **Spreadsheet**
- **Document Viewer**
- **RSS Reader**

### Security & System
- **Password Manager**
- **System Monitor** (CPU, memory, network simulation)
- **Network Tools**
- **Settings** app with wallpaper upload and sound testing
- **Archive Manager**
- **Base64 Tool**
- **Color Picker** and **Color Palette**

### Miscellaneous
- **Weather** widget
- **Clock** and **Stopwatch**
- **Chat** interface
- **Ascii Art** generator
- **Image Gallery** and **Image Viewer**
- **Media Converter**

---

## System Integration (Where Possible)

Web Linux reads **real hardware data** when the browser permits:

| Data | Source | Notes |
|---|---|---|
| Battery % and charging state | `navigator.getBattery()` | Live updates; graceful fallback on Firefox/Safari |
| Online / offline status | `navigator.onLine` + events | Instant detection |
| Network signal | `navigator.connection.effectiveType` | Mapped to signal bars (privacy-safe approximation) |
| System theme preference | `prefers-color-scheme` | Auto-detects user's OS setting |

For data the browser sandbox blocks (exact Wi-Fi SSID, RSSI, controlling hardware), the UI is **honest** — it shows simulated values and clearly labels them.

---

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and optimized production builds
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **date-fns** for date/time formatting
- **Zustand-style** state management via `useOSStore` hook (useReducer + Context)
- Pure CSS animations (no Framer Motion dependency)
- No backend, no third-party network calls — 100% client-side

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Abyss-Corp/Web-Linux.git
cd Web-Linux/Web_Based_Ubuntu_Linux/app

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 📂 Project Structure
```
Web_Based_Ubuntu_Linux/app/
├── public/
│   └── favicon.svg              # Ubuntu-orange terminal icon
├── src/
│   ├── apps/                    # All 60+ applications (one file each)
│   │   ├── Browser.tsx
│   │   ├── Calculator.tsx
│   │   ├── Terminal.tsx
│   │   ├── FileManager.tsx
│   │   ├── Snake.tsx, Tetris.tsx, ...
│   │   ├── Settings.tsx
│   │   ├── AppRouter.tsx        # Maps appId → component
│   │   └── registry.ts          # App metadata + icon mapping
│   ├── components/              # Desktop shell
│   │   ├── Desktop.tsx          # Desktop + icons
│   │   ├── TopPanel.tsx         # Top bar (activities, clock, tray)
│   │   ├── Dock.tsx             # Bottom dock
│   │   ├── AppLauncher.tsx      # Full-screen app grid
│   │   ├── Window.tsx           # Draggable, resizable window
│   │   └── ...
│   ├── hooks/
│   │   ├── useOSStore.tsx       # Global OS state + reducer
│   │   └── useSystemStats.ts    # Real battery / network telemetry
│   ├── lib/                     # Utilities
│   ├── types/                   # TypeScript type definitions
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles + custom scrollbars
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 🤝 Contributing
Contributions are welcome — whether it is a typo fix, a bug report, or a full new application.
Fork the repository
Create a feature branch (git checkout -b feature/amazing-app)
Commit your changes (git commit -m "feat: add amazing app")
Push to your fork (git push origin feature/amazing-app)
Open a Pull Request
Adding a New Application
Create a new file in src/apps/YourApp.tsx
Export a default React component
Register it in src/apps/registry.ts with an id, name, category, and icon
The app will automatically appear in the launcher and be launchable from the OS state
Bug Reports
Open an issue with:
Steps to reproduce
Expected vs. actual behavior
Screenshot if applicable

---

## 🔒 Privacy & Security
No backend. The application is entirely client-side.
No third-party network calls. Your data stays in your browser.
No telemetry, no analytics, no cookies.
Works offline after the first load (cacheable via Vite PWA plugin if enabled).
The only data written to your device is localStorage entries for:
Bookmarks (browser_bookmarks)
Calculator history (calc_history)
Calculator memory (calc_memory)
Theme preference
Custom wallpaper
You can clear all of this at any time from your browser's storage settings.

---

## ⚠️ Known Limitations
No real system control. The browser sandbox prevents direct hardware or OS interaction.
Some external sites cannot be embedded in the built-in browser due to their X-Frame-Options / CSP headers. The browser shows a simulated page with an "open externally" link instead.
Single-session. Window positions and open apps reset on page reload (intentional — keeps the tool stateless).
Desktop icon positions reset on reload (same reason).
These are architectural choices for privacy and portability, not oversights.

---

## 🗺️ Roadmap
Pan/zoom on desktop canvas for large icon grids
Multi-monitor simulation
Customizable keyboard shortcuts
Persistent desktop state (optional opt-in)
Additional languages (i18n)
More applications: Paint, Music Composer, Database Manager
Accessibility pass (keyboard navigation, screen-reader labels, high-contrast theme)

---

## 📜 License
This project is licensed under the MIT License — see the LICENSE file for details.

---

## 🙏 Acknowledgments
Ubuntu and Canonical for design inspiration
GNOME for the desktop interaction model
Lucide for the beautiful icon set
Tailwind CSS team for the utility-first framework
The open-source community for making tools like this possible

---

<p align="center">
<b>Made with Dedecation for the open-source community</b><br/>
<sub>If this project helped you, consider giving it a ⭐ on GitHub!</sub>
</p>
