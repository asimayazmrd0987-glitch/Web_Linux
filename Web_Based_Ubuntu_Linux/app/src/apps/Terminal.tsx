// ============================================================
// Terminal — Bash-like command processing
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

const COMMANDS: Record<string, (args: string[], ctx: TerminalContext) => string | string[]> = {
  help: () => [
    'Available commands:',
    '  ls [path]     - List directory contents',
    '  cd [path]     - Change directory',
    '  pwd           - Print working directory',
    '  mkdir <name>  - Create directory',
    '  rm <name>     - Remove file or directory',
    '  cat <file>    - Display file contents',
    '  echo <text>   - Print text',
    '  clear         - Clear terminal',
    '  whoami        - Print current user',
    '  date          - Print current date and time',
    '  uname         - Print system info',
    '  neofetch      - Display system information',
    '  calc <expr>   - Calculate expression',
    '  touch <file>  - Create empty file',
    '  history       - Show command history',
    '  help          - Show this help message',
  ],

  ls: (args, ctx) => {
    const targetPath = args[0] || ctx.currentPath;
    const node = ctx.findNodeByPath(targetPath);
    if (!node) return `ls: cannot access '${targetPath}': No such file or directory`;
    if (node.type === 'file') return node.name;
    const children = ctx.getChildren(node.id);
    if (children.length === 0) return '';
    return children.map((c) => {
      const prefix = c.type === 'folder' ? '\x1b[34m' : '\x1b[0m';
      const suffix = '\x1b[0m';
      return `${prefix}${c.name}${suffix}`;
    });
  },

  cd: (args, ctx) => {
    if (!args[0] || args[0] === '~') {
      ctx.setCurrentPath('/home/user');
      return '';
    }
    let target = args[0];
    if (target.startsWith('/')) {
      const node = ctx.findNodeByPath(target);
      if (!node) return `cd: no such file or directory: ${target}`;
      if (node.type !== 'folder') return `cd: not a directory: ${target}`;
      ctx.setCurrentPath(target);
      return '';
    }
    // Relative path
    const currentParts = ctx.currentPath.split('/').filter(Boolean);
    const parts = target.split('/').filter(Boolean);
    for (const part of parts) {
      if (part === '..') {
        currentParts.pop();
      } else if (part !== '.') {
        currentParts.push(part);
      }
    }
    const newPath = '/' + currentParts.join('/');
    const node = ctx.findNodeByPath(newPath);
    if (!node) return `cd: no such file or directory: ${target}`;
    if (node.type !== 'folder') return `cd: not a directory: ${target}`;
    ctx.setCurrentPath(newPath);
    return '';
  },

  pwd: (_args, ctx) => ctx.currentPath,

  mkdir: (args, ctx) => {
    if (!args[0]) return 'mkdir: missing operand';
    const currentNode = ctx.findNodeByPath(ctx.currentPath);
    if (!currentNode) return 'mkdir: cannot create directory';
    ctx.createFolder(currentNode.id, args[0]);
    return '';
  },

  touch: (args, ctx) => {
    if (!args[0]) return 'touch: missing file operand';
    const currentNode = ctx.findNodeByPath(ctx.currentPath);
    if (!currentNode) return 'touch: cannot create file';
    ctx.createFile(currentNode.id, args[0]);
    return '';
  },

  rm: (args, ctx) => {
    if (!args[0]) return 'rm: missing operand';
    const currentNode = ctx.findNodeByPath(ctx.currentPath);
    if (!currentNode) return 'rm: cannot remove';
    const children = ctx.getChildren(currentNode.id);
    const target = children.find((c) => c.name === args[0]);
    if (!target) return `rm: cannot remove '${args[0]}': No such file or directory`;
    ctx.deleteNode(target.id);
    return '';
  },

  cat: (args, ctx) => {
    if (!args[0]) return 'cat: missing file operand';
    const currentNode = ctx.findNodeByPath(ctx.currentPath);
    if (!currentNode) return 'cat: cannot read file';
    const children = ctx.getChildren(currentNode.id);
    const target = children.find((c) => c.name === args[0]);
    if (!target) return `cat: '${args[0]}': No such file or directory`;
    if (target.type === 'folder') return `cat: '${args[0]}': Is a directory`;
    const content = ctx.readFile(target.id);
    return content || '';
  },

  echo: (args) => args.join(' '),

  clear: (_args, ctx) => {
    ctx.clear();
    return '';
  },

  whoami: () => 'user',

  date: () => new Date().toString(),

  uname: () => 'UbuntuOS Web 1.0.0-generic x86_64',

  neofetch: () => [
    '\x1b[35m       _    _  _   _  ____   ___  ____   _____ \x1b[0m',
    '\x1b[35m      / \\  | || | / \\|  _ \\ / _ \\|  _ \\ / ____|\x1b[0m',
    '\x1b[35m     / _ \\ | || |/ _ \\ | | | | | | |_) | (___  \x1b[0m',
    '\x1b[35m    / ___ \\|__   _/ ___ \\| |_| |  _ < \\___ \\ \x1b[0m',
    '\x1b[35m   /_/   \\_\\_| |_/_/   \\_\\____/|_| \\_\\____/ \x1b[0m',
    '',
    '\x1b[36mOS:\x1b[0m UbuntuOS Web 1.0.0',
    '\x1b[36mKernel:\x1b[0m browser-engine-20.0',
    '\x1b[36mShell:\x1b[0m ubuntushell 1.0',
    '\x1b[36mDE:\x1b[0m GNOME-like Web Desktop',
    '\x1b[36mTheme:\x1b[0m Adwaita-dark [GTK2/3]',
    '\x1b[36mIcons:\x1b[0m Ubuntu-mono-dark [GTK2/3]',
    '\x1b[36mTerminal:\x1b[0m ubuntuterminal',
    '\x1b[36mCPU:\x1b[0m Virtual Web Core',
    '\x1b[36mMemory:\x1b[0m Browser Allocated',
  ],

  calc: (args) => {
    if (!args.length) return 'calc: missing expression';
    const expr = args.join('');
    try {
      // Safe evaluation - only allow numbers and basic operators
      const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
      if (sanitized !== expr) return 'calc: invalid characters in expression';
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + sanitized)();
      return String(result);
    } catch {
      return 'calc: invalid expression';
    }
  },

  history: (_args, ctx) => {
    return ctx.history.map((cmd, i) => `${i + 1}  ${cmd}`);
  },
};

interface TerminalContext {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  findNodeByPath: ReturnType<typeof useFileSystem>['findNodeByPath'];
  getChildren: ReturnType<typeof useFileSystem>['getChildren'];
  createFolder: ReturnType<typeof useFileSystem>['createFolder'];
  createFile: ReturnType<typeof useFileSystem>['createFile'];
  deleteNode: ReturnType<typeof useFileSystem>['deleteNode'];
  readFile: ReturnType<typeof useFileSystem>['readFile'];
  clear: () => void;
  history: string[];
}

export default function Terminal() {
  const fs = useFileSystem();
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', text: 'Welcome to UbuntuOS Terminal' },
    { type: 'system', text: 'Type "help" for available commands.' },
    { type: 'output', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  const executeCommand = useCallback(
    (cmdLine: string) => {
      const trimmed = cmdLine.trim();
      if (!trimmed) {
        setLines((prev) => [...prev, { type: 'input', text: `${currentPath}$ ` }, { type: 'output', text: '' }]);
        return;
      }

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      setLines((prev) => [...prev, { type: 'input', text: `${currentPath}$ ${trimmed}` }]);

      setHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);

      const ctx: TerminalContext = {
        currentPath,
        setCurrentPath,
        findNodeByPath: fs.findNodeByPath,
        getChildren: fs.getChildren,
        createFolder: fs.createFolder,
        createFile: fs.createFile,
        deleteNode: fs.deleteNode,
        readFile: fs.readFile,
        clear,
        history,
      };

      const handler = COMMANDS[cmd];
      if (handler) {
        try {
          const result = handler(args, ctx);
          if (result !== '') {
            if (Array.isArray(result)) {
              result.forEach((line) => {
                setLines((prev) => [...prev, { type: 'output', text: line }]);
              });
            } else {
              setLines((prev) => [...prev, { type: 'output', text: result }]);
            }
          }
        } catch (err) {
          setLines((prev) => [...prev, { type: 'error', text: `Error: ${err}` }]);
        }
      } else {
        setLines((prev) => [...prev, { type: 'error', text: `${cmd}: command not found` }]);
      }
    },
    [currentPath, fs, clear, history]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        executeCommand(input);
        setInput('');
        setHistoryIndex(-1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex === -1) {
          setSavedInput(input);
        }
        const newIndex = historyIndex + 1;
        if (newIndex < history.length) {
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex]);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex <= 0) {
          setHistoryIndex(-1);
          setInput(savedInput);
        } else {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex]);
        }
      }
    },
    [input, executeCommand, history, historyIndex, savedInput]
  );

  // Click on terminal to focus input
  const handleTerminalClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Parse ANSI color codes for display
  const parseAnsi = (text: string): React.ReactNode[] => {
    if (!text.includes('\x1b[')) return [text];
    const parts: React.ReactNode[] = [];
    const regex = /\x1b\[(\d+)m/g;
    let lastIndex = 0;
    let currentColor = '';
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++} style={{ color: currentColor }}>
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }
      const code = parseInt(match[1], 10);
      switch (code) {
        case 30: currentColor = '#000'; break;
        case 31: currentColor = '#F44336'; break;
        case 32: currentColor = '#4CAF50'; break;
        case 33: currentColor = '#FF9800'; break;
        case 34: currentColor = '#2196F3'; break;
        case 35: currentColor = '#7C4DFF'; break;
        case 36: currentColor = '#00BCD4'; break;
        case 37: currentColor = '#E0E0E0'; break;
        case 0: currentColor = ''; break;
        default: currentColor = '';
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(
        <span key={key++} style={{ color: currentColor }}>
          {text.slice(lastIndex)}
        </span>
      );
    }
    return parts;
  };

  return (
    <div
      className="flex flex-col h-full font-mono text-xs select-text cursor-text"
      style={{
        background: '#0C0C0C',
        color: '#E0E0E0',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      }}
      onClick={handleTerminalClick}
    >
      {/* Terminal output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all leading-5">
            {line.type === 'input' && (
              <span>
                <span className="text-[#4CAF50]">{currentPath}</span>
                <span className="text-[#E0E0E0]">$ </span>
                <span className="text-[#E0E0E0]">{line.text.slice(line.text.indexOf('$') + 2)}</span>
              </span>
            )}
            {line.type === 'output' && <span className="text-[#E0E0E0]">{parseAnsi(line.text)}</span>}
            {line.type === 'error' && <span className="text-[#F44336]">{line.text}</span>}
            {line.type === 'system' && <span className="text-[#9E9E9E]">{line.text}</span>}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[#4CAF50] shrink-0">{currentPath}$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-[#E0E0E0] min-w-0"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  );
}
