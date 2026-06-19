WebUbuntu — A Full Ubuntu Desktop in Your Browser
WebUbuntu is a fully functional, browser-based Ubuntu-style desktop environment built from scratch with React + TypeScript + Vite. It replicates the look and feel of a real Linux desktop — complete with a window manager, dock, app launcher, terminal, file manager, and 30+ built-in applications — all running entirely client-side with no backend required.
What Makes It Unique
Unlike mockup UIs or simple component demos, WebUbuntu is a real working desktop:
Window Manager — Drag, resize, minimize, maximize, and Alt+Tab between windows
Simulated Filesystem — A full in-memory file tree with directories, files, permissions, and path navigation
Working Terminal — Bash-like shell with cd, ls, mkdir, cat, pwd, clear, and more
File Manager — Browse folders, create files/folders, rename, and navigate breadcrumbs
30+ Apps — From productivity tools (Calendar, Notes, Spreadsheet) to games (Snake, Tetris, Chess, 2048) to dev utilities (Code Editor, JSON Formatter, Git Client)
Live Demo
🔗 web-linux-delta.vercel.app
Tech Stack
Table
Layer	Technology
Framework	React 19 + TypeScript
Build Tool	Vite
Styling	Tailwind CSS
Icons	Lucide React
State Management	Custom Zustand-like store
Deployment	Vercel
Keyboard Shortcuts
Table
Shortcut	Action
Super (Windows/Meta)	Toggle App Launcher
Ctrl + Alt + T	Open Terminal
Super + D	Minimize All Windows
Alt + Tab	Switch Windows
Why I Built This
I wanted to understand how desktop environments work under the hood — window management, event handling, filesystem abstractions, and UI state management — by building one myself. This project started as a learning exercise and grew into a fully interactive web desktop that anyone can try instantly.
Run Locally
bash
cd Web_Based_Ubuntu_Linux/app
npm install
npm run dev
License
MIT — feel free to fork, extend, or use as inspiration for your own projects.