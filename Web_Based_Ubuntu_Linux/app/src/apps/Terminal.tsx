// ============================================================
// Terminal — Advanced Shell with Oh My Zsh & Powerlevel10k Theme
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  text: string;
}

const COMMANDS: Record<string, (args: string[], ctx: TerminalContext) => string | string[]> = {
  help: () => [
    '\x1b[36mAvailable commands:\x1b[0m',
    '  \x1b[33mls\x1b[0m [path]     - List directory contents',
    '  \x1b[33mcd\x1b[0m [path]     - Change directory',
    '  \x1b[33mpwd\x1b[0m           - Print working directory',
    '  \x1b[33mmkdir\x1b[0m <name>  - Create directory',
    '  \x1b[33mrm\x1b[0m <name>     - Remove file or directory',
    '  \x1b[33mcat\x1b[0m <file>    - Display file contents',
    '  \x1b[33mecho\x1b[0m <text>   - Print text',
    '  \x1b[33mclear\x1b[0m         - Clear terminal',
    '  \x1b[33mwhoami\x1b[0m        - Print current user',
    '  \x1b[33mdate\x1b[0m          - Print current date and time',
    '  \x1b[33muname\x1b[0m         - Print system info',
    '  \x1b[33mneofetch\x1b[0m      - Display system information',
    '  \x1b[33mcalc\x1b[0m <expr>   - Calculate expression',
    '  \x1b[33mtouch\x1b[0m <file>  - Create empty file',
    '  \x1b[33mhistory\x1b[0m       - Show command history',
    '  \x1b[33mgit\x1b[0m [cmd]     - Git operations (simulated)',
    '  \x1b[33mvim\x1b[0m <file>    - Open file in editor (simulated)',
    '  \x1b[33mnano\x1b[0m <file>   - Open file in nano (simulated)',
    '  \x1b[33mhtop\x1b[0m          - System monitor (simulated)',
    '  \x1b[33mfiglet\x1b[0m <text> - Create ASCII art banners',
    '  \x1b[33mcowsay\x1b[0m <text> - Display message with cow',
    '  \x1b[33mlolcat\x1b[0m <text> - Display text with rainbow colors',
    '  \x1b[33mhelp\x1b[0m          - Show this help message',
  ],

  ls: (args, ctx) => {
    const targetPath = args[0] || ctx.currentPath;
    const node = ctx.findNodeByPath(targetPath);
    if (!node) return `\x1b[31mls: cannot access '${targetPath}': No such file or directory\x1b[0m`;
    if (node.type === 'file') return `\x1b[37m${node.name}\x1b[0m`;
    const children = ctx.getChildren(node.id);
    if (children.length === 0) return '';
    return children.map((c) => {
      if (c.type === 'folder') {
        return `\x1b[1;34m📁 ${c.name}/\x1b[0m`;
      } else if (c.name.endsWith('.sh') || c.name.endsWith('.py') || c.name.endsWith('.js')) {
        return `\x1b[1;32m📄 ${c.name}*\x1b[0m`;
      } else if (c.name.endsWith('.txt') || c.name.endsWith('.md')) {
        return `\x1b[36m📄 ${c.name}\x1b[0m`;
      } else if (c.name.startsWith('.')) {
        return `\x1b[90m📄 ${c.name}\x1b[0m`;
      }
      return `\x1b[37m📄 ${c.name}\x1b[0m`;
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
    return ctx.history.map((cmd, i) => `\x1b[90m${i + 1}\x1b[0m  ${cmd}`);
  },

  git: (args, ctx) => {
    if (!args.length) return 'git: usage: git <command> [<args>]';
    const cmd = args[0].toLowerCase();
    const gitCmds: Record<string, () => string | string[]> = {
      status: () => [
        '\x1b[32mOn branch main\x1b[0m',
        'Your branch is up to date with \'origin/main\'.',
        '',
        '\x1b[36mChanges not staged for commit:\x1b[0m',
        '  (use "git add <file>..." to update what will be committed)',
        '  (use "git restore <file>..." to discard changes in working directory)',
        '\x1b[31m\tmodified:   src/apps/Terminal.tsx\x1b[0m',
        '',
        'no changes added to commit (use "git add" and/or "git commit -a")',
      ],
      log: () => [
        '\x1b[33mcommit abc123def456\x1b[0m (HEAD -> main)',
        'Author: user <user@weblinux.local>',
        'Date:   ' + new Date().toUTCString(),
        '',
        '    Enhanced terminal with Oh My Zsh style',
      ],
      pull: () => ['Already up to date.'],
      push: () => ['Everything up-to-date'],
      add: () => [''],
      commit: () => ['[main abc123] Enhanced terminal'],
      branch: () => ['* main'],
      clone: () => ['Cloning...', 'Done!'],
    };
    if (gitCmds[cmd]) return gitCmds[cmd]();
    return `git: '${cmd}' is not a git command. See 'git --help'.`;
  },

  vim: (args) => {
    if (!args[0]) return 'vim: Too few arguments. Usage: vim [file...]';
    return [
      '\x1b[34mVIM - Vi IMproved\x1b[0m',
      '',
      '  ~',
      '  ~',
      '  \x1b[36m"' + args[0] + '" \x1b[0m[New File]',
      '  ~',
      '  \x1b[90m-- INSERT --\x1b[0m',
      '',
      '\x1b[90mSimulated editor. Use Ctrl+C to exit.\x1b[0m',
    ];
  },

  nano: (args) => {
    if (!args[0]) return 'nano: Too few arguments. Usage: nano [file...]';
    return [
      '\x1b[32mGNU nano\x1b[0m',
      '',
      '  \x1b[36mFile: ' + args[0] + '\x1b[0m',
      '',
      '  [ File content would appear here ]',
      '',
      '\x1b[33m^G Help\x1b[0m  \x1b[33m^O Write Out\x1b[0m  \x1b[33m^X Exit\x1b[0m',
    ];
  },

  htop: () => {
    const now = new Date();
    return [
      '  \x1b[32mCPU\x1b[0m [\x1b[32m██████████\x1b[0m\x1b[90m..........\x1b[0m] 45.2%',
      '  \x1b[34mMem\x1b[0m [\x1b[34m████████\x1b[0m\x1b[90m............\x1b[0m] 2.4G/8G',
      '  \x1b[33mSwp\x1b[0m [\x1b[90m....................\x1b[0m] 0K/4G',
      '',
      '  \x1b[1mPID USER\x1b[0m      \x1b[1mPRI NI  VIRT RES S\x1b[0m   \x1b[1mCPU% MEM% TIME+  Command\x1b[0m',
      '    1 root       20  0  1.2G 85M S  2.3  1.1  0:15.23 \x1b[36msystemd\x1b[0m',
      '  234 user       20  0  456M 120M S  5.7  1.5  0:08.45 \x1b[32mbrowser\x1b[0m',
      '  567 user       20  0  234M 45M R  1.2  0.6  0:02.12 \x1b[33mwebterm\x1b[0m',
      '',
      '\x1b[90mPress q to quit (simulated)\x1b[0m',
    ];
  },

  figlet: (args) => {
    if (!args.length) return 'Usage: figlet <text>';
    const text = args.join(' ');
    const banners: Record<string, string[]> = {
      default: [
        ' _____ _   _ _____ ',
        '| ____| \ | | ____|',
        '|  _| |  \| |  _|  ',
        '| |___| |\  | |___ ',
        '|_____|_| \_|_____|',
      ],
    };
    // Simple ASCII art generator
    const lines = text.toUpperCase().split('').map(char => {
      const charMap: Record<string, string[]> = {
        'H': ['H   H', 'H   H', 'HHHHH', 'H   H', 'H   H'],
        'I': ['III', ' I ', ' I ', ' I ', 'III'],
        '!': ['!', '!', '!', ' ', '!'],
        ' ': ['     ', '     ', '     ', '     ', '     '],
      };
      return charMap[char] || charMap['I'];
    });
    
    const result: string[] = [];
    for (let i = 0; i < 5; i++) {
      result.push(lines.map(line => line[i]).join('  '));
    }
    return result.map(l => '\x1b[35m' + l + '\x1b[0m');
  },

  cowsay: (args) => {
    if (!args.length) return 'Usage: cowsay <message>';
    const msg = args.join(' ');
    const border = '_'.repeat(msg.length + 2);
    return [
      ` ${border}`,
      `< ${msg} >`,
      ` ${'-'.repeat(msg.length + 2)}`,
      '        \\   ^__^',
      '         \\  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
    ].map(l => '\x1b[33m' + l + '\x1b[0m');
  },

  lolcat: (args) => {
    if (!args.length) return 'Usage: lolcat <text>';
    const msg = args.join(' ');
    const colors = ['\x1b[31m', '\x1b[33m', '\x1b[32m', '\x1b[36m', '\x1b[34m', '\x1b[35m'];
    return msg.split('').map((c, i) => colors[i % colors.length] + c).join('') + '\x1b[0m';
  },

  alias: () => [
    '\x1b[36mAliases:\x1b[0m',
    '  ll=\x1b[33mls -la\x1b[0m',
    '  la=\x1b[33mls -A\x1b[0m',
    '  gs=\x1b[33mgit status\x1b[0m',
    '  gp=\x1b[33mgit push\x1b[0m',
    '  ..=\x1b[33mcd ..\x1b[0m',
  ],
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
    { type: 'success', text: '\x1b[1;35m╭──────────────────────────────────────────╮\x1b[0m' },
    { type: 'success', text: '\x1b[1;35m│\x1b[0m   \x1b[1;36mWelcome to Web Linux\x1b[0m                  \x1b[1;35m│\x1b[0m' },
    { type: 'success', text: '\x1b[1;35m│\x1b[0m   \x1b[33mOh My Zsh\x1b[0m + \x1b[32mPowerlevel10k\x1b[0m Theme      \x1b[1;35m│\x1b[0m' },
    { type: 'success', text: '\x1b[1;35m╰──────────────────────────────────────────╯\x1b[0m' },
    { type: 'system', text: '' },
    { type: 'output', text: '\x1b[36mType \x1b[33m"help"\x1b[36m for available commands.\x1b[0m' },
    { type: 'output', text: '\x1b[90mTry: \x1b[33mls\x1b[90m, \x1b[33mgit status\x1b[90m, \x1b[33mneofetch\x1b[90m, \x1b[33mcowsay hello\x1b[90m, \x1b[33mfiglet web\x1b[0m' },
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
    const regex = /\x1b\[(\d+(?:;\d+)*)m/g;
    let lastIndex = 0;
    let currentStyle: React.CSSProperties = {};
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++} style={currentStyle}>
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }
      const codes = match[1].split(';').map(Number);
      for (const code of codes) {
        switch (code) {
          case 0: currentStyle = {}; break;
          case 1: currentStyle.fontWeight = 'bold'; break;
          case 30: currentStyle.color = '#000000'; break;
          case 31: currentStyle.color = '#FF5555'; break;
          case 32: currentStyle.color = '#50FA7B'; break;
          case 33: currentStyle.color = '#F1FA8C'; break;
          case 34: currentStyle.color = '#BD93F9'; break;
          case 35: currentStyle.color = '#FF79C6'; break;
          case 36: currentStyle.color = '#8BE9FD'; break;
          case 37: currentStyle.color = '#BBBBBB'; break;
          case 90: currentStyle.color = '#6272A4'; break;
          case 91: currentStyle.color = '#FF6E67'; break;
          case 92: currentStyle.color = '#5AF78E'; break;
          case 93: currentStyle.color = '#FFFDA5'; break;
          case 94: currentStyle.color = '#CAA9FA'; break;
          case 95: currentStyle.color = '#FF92D0'; break;
          case 96: currentStyle.color = '#A4FFFF'; break;
          case 97: currentStyle.color = '#FFFFFF'; break;
          case 41: currentStyle.backgroundColor = '#FF5555'; break;
          case 42: currentStyle.backgroundColor = '#50FA7B'; break;
          case 43: currentStyle.backgroundColor = '#F1FA8C'; break;
          case 44: currentStyle.backgroundColor = '#BD93F9'; break;
          case 45: currentStyle.backgroundColor = '#FF79C6'; break;
          case 46: currentStyle.backgroundColor = '#8BE9FD'; break;
          default: break;
        }
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(
        <span key={key++} style={currentStyle}>
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
                <span className="text-[#00D700] font-bold">\uE0B2 </span>
                <span className="bg-[#0087D7] text-white px-2 font-bold"> \ue7bf user </span>
                <span className="text-[#0087D7] font-bold">\uE0B0</span>
                <span className="bg-[#00AF5F] text-white px-2 font-bold"> {currentPath} </span>
                <span className="text-[#00AF5F] font-bold">\uE0B0 </span>
                <span className="text-[#FFD700] font-bold">$ </span>
                <span className="text-[#E0E0E0]">{line.text.slice(line.text.lastIndexOf('$') + 2)}</span>
              </span>
            )}
            {line.type === 'output' && <span className="text-[#E0E0E0]">{parseAnsi(line.text)}</span>}
            {line.type === 'error' && <span className="text-[#F44336]">{line.text}</span>}
            {line.type === 'system' && <span className="text-[#9E9E9E]">{line.text}</span>}
            {line.type === 'success' && <span>{parseAnsi(line.text)}</span>}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[#00D700] font-bold">\uE0B2</span>
          <span className="bg-[#0087D7] text-white px-2 font-bold rounded-l"> \ue7bf user </span>
          <span className="text-[#0087D7] font-bold">\uE0B0</span>
          <span className="bg-[#00AF5F] text-white px-2 font-bold"> {currentPath} </span>
          <span className="text-[#00AF5F] font-bold">\uE0B0 </span>
          <span className="text-[#FFD700] font-bold">$ </span>
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
