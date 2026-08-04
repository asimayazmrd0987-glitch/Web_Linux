// ============================================================
// Terminal — Real Interactive Linux Terminal & Git Environment
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  text: string;
  promptPath?: string;
  branch?: string;
}

interface GitRepoState {
  isInitialized: boolean;
  currentBranch: string;
  branches: string[];
  staged: string[];
  commits: Array<{ hash: string; author: string; date: string; message: string; files: Record<string, string> }>;
  remotes: Record<string, string>;
}

// Helpers for argument parsing with quotes and $ENV support
function parseArgsAndEnv(cmdLine: string, env: Record<string, string>): string[] {
  const tokens: string[] = [];
  let current = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < cmdLine.length; i++) {
    const char = cmdLine[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === ' ' && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current.length > 0) tokens.push(current);

  // Expand environment variables like $USER or $HOME
  return tokens.map((token) => {
    if (inSingleQuote) return token;
    return token.replace(/\$([A-Za-z0-9_]+)/g, (_, varName) => env[varName] || '');
  });
}

export default function Terminal() {
  const fs = useFileSystem();

  // Environment variables
  const [env, setEnv] = useState<Record<string, string>>({
    USER: 'user',
    HOME: '/home/user',
    SHELL: '/bin/bash',
    TERM: 'xterm-256color',
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
  });

  // Current working directory
  const [currentPath, setCurrentPath] = useState('/home/user');

  // Terminal output lines
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'success', text: '\x1b[1;35m╭─────────────────────────────────────────────────────────────╮\x1b[0m' },
    { type: 'success', text: '\x1b[1;35m│\x1b[0m   \x1b[1;36mUbuntu Web Terminal v2.0\x1b[0m — \x1b[32mReal Linux Practice Shell\x1b[0m      \x1b[1;35m│\x1b[0m' },
    { type: 'success', text: '\x1b[1;35m│\x1b[0m   \x1b[33mFull Git Workflow, File Redirection, REPLs (Python & Node)\x1b[0m \x1b[1;35m│\x1b[0m' },
    { type: 'success', text: '\x1b[1;35m╰─────────────────────────────────────────────────────────────╯\x1b[0m' },
    { type: 'output', text: '\x1b[36mType \x1b[33m"help"\x1b[36m or \x1b[33m"man git"\x1b[36m to see available commands.\x1b[0m' },
    { type: 'output', text: '\x1b[90mTry: \x1b[33mgit init\x1b[90m, \x1b[33mtouch script.py\x1b[90m, \x1b[33mnano test.txt\x1b[90m, \x1b[33mpython3\x1b[90m, \x1b[33mnode\x1b[0m\n' },
  ]);

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');

  // Interactive Sub-modes (editor / python / node)
  const [activeMode, setActiveMode] = useState<'normal' | 'nano' | 'python' | 'node'>('normal');

  // Nano state
  const [nanoFile, setNanoFile] = useState<{ path: string; node: ReturnType<typeof fs.findNodeByPath>; content: string }>({
    path: '', node: undefined, content: ''
  });

  // Python / Node REPL state
  const [replVars, setReplVars] = useState<Record<string, unknown>>({});

  // Git State per folder path
  const [gitRepos, setGitRepos] = useState<Record<string, GitRepoState>>({
    '/home/user': {
      isInitialized: true,
      currentBranch: 'main',
      branches: ['main'],
      staged: [],
      commits: [
        {
          hash: 'a1b2c3d',
          author: 'user <user@ubuntuos.local>',
          date: new Date().toUTCString(),
          message: 'Initial project setup',
          files: {},
        },
      ],
      remotes: { origin: 'https://github.com/user/web_linux.git' },
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nanoTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, activeMode, nanoFile.content]);

  // Keep ENV PWD up to date
  useEffect(() => {
    setEnv((prev) => ({ ...prev, PWD: currentPath }));
  }, [currentPath]);

  // Path resolution helper
  const resolveAbsolutePath = useCallback(
    (target: string): string => {
      let resolved = target;
      if (target === '~' || target.startsWith('~/')) {
        resolved = target.replace('~', '/home/user');
      }
      if (!resolved.startsWith('/')) {
        const parts = currentPath.split('/').filter(Boolean);
        const subParts = resolved.split('/').filter(Boolean);
        for (const p of subParts) {
          if (p === '..') {
            parts.pop();
          } else if (p !== '.') {
            parts.push(p);
          }
        }
        resolved = '/' + parts.join('/');
      }
      return resolved || '/';
    },
    [currentPath]
  );

  // Clear output
  const clear = useCallback(() => {
    setLines([]);
  }, []);

  // Git repo accessor
  const getGitState = useCallback((): GitRepoState | undefined => {
    return gitRepos[currentPath];
  }, [gitRepos, currentPath]);

  const updateGitState = useCallback(
    (updater: (prev: GitRepoState) => GitRepoState) => {
      setGitRepos((prev) => {
        const currentRepo = prev[currentPath] || {
          isInitialized: false,
          currentBranch: 'main',
          branches: ['main'],
          staged: [],
          commits: [],
          remotes: {},
        };
        return {
          ...prev,
          [currentPath]: updater(currentRepo),
        };
      });
    },
    [currentPath]
  );

  // Command Execution Logic
  const executeCommand = useCallback(
    (rawCmdLine: string) => {
      const trimmed = rawCmdLine.trim();
      if (!trimmed) {
        setLines((prev) => [
          ...prev,
          { type: 'input', text: '', promptPath: currentPath, branch: getGitState()?.isInitialized ? getGitState()?.currentBranch : undefined },
        ]);
        return;
      }

      setHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);

      // Handle Redirection (e.g. echo "hi" > file.txt or cat file.txt >> log.txt)
      let cmdLineToRun = trimmed;
      let redirectFile: string | null = null;
      let redirectAppend = false;

      if (trimmed.includes('>>')) {
        const parts = trimmed.split('>>');
        cmdLineToRun = parts[0].trim();
        redirectFile = parts[1].trim();
        redirectAppend = true;
      } else if (trimmed.includes('>')) {
        const parts = trimmed.split('>');
        cmdLineToRun = parts[0].trim();
        redirectFile = parts[1].trim();
        redirectAppend = false;
      }

      const args = parseArgsAndEnv(cmdLineToRun, env);
      let cmd = args[0] || '';
      const cmdArgs = args.slice(1);

      // Aliases
      const aliasMap: Record<string, { cmd: string; args: string[] }> = {
        ll: { cmd: 'ls', args: ['-la'] },
        la: { cmd: 'ls', args: ['-A'] },
        gs: { cmd: 'git', args: ['status'] },
        gp: { cmd: 'git', args: ['push'] },
        gd: { cmd: 'git', args: ['diff'] },
        gl: { cmd: 'git', args: ['log'] },
        '..': { cmd: 'cd', args: ['..'] },
      };

      if (aliasMap[cmd]) {
        const alias = aliasMap[cmd];
        cmd = alias.cmd;
        cmdArgs.unshift(...alias.args);
      }

      const currentGit = getGitState();
      setLines((prev) => [
        ...prev,
        {
          type: 'input',
          text: trimmed,
          promptPath: currentPath,
          branch: currentGit?.isInitialized ? currentGit.currentBranch : undefined,
        },
      ]);

      // Execution Dispatcher
      let outputText: string | string[] = '';

      switch (cmd) {
        case 'help': {
          outputText = [
            '\x1b[1;36mLinux Shell & Git Practice Environment\x1b[0m',
            '  \x1b[33mls\x1b[0m [-la] [path]        - List files & folders',
            '  \x1b[33mcd\x1b[0m [path]            - Change directory (~, .., relative, absolute)',
            '  \x1b[33mpwd\x1b[0m                  - Print current working directory',
            '  \x1b[33mtouch\x1b[0m <file...>       - Create empty file(s)',
            '  \x1b[33mmkdir\x1b[0m [-p] <dir...>    - Create directory',
            '  \x1b[33mrm\x1b[0m [-rf] <file/dir>    - Remove files or directories',
            '  \x1b[33mcp\x1b[0m <src> <dst>        - Copy file or folder',
            '  \x1b[33mmv\x1b[0m <src> <dst>        - Move/rename file or folder',
            '  \x1b[33mcat\x1b[0m <file...>         - Display contents of file(s)',
            '  \x1b[33mhead\x1b[0m [-n N] <file>    - Display top N lines',
            '  \x1b[33mtail\x1b[0m [-n N] <file>    - Display bottom N lines',
            '  \x1b[33mgrep\x1b[0m [-i] <pat> [file] - Search pattern in file or folder',
            '  \x1b[33mfind\x1b[0m [path]           - List files recursively',
            '  \x1b[33mtree\x1b[0m [path]           - Display directory structure as tree',
            '  \x1b[33mwc\x1b[0m [-l|-w|-c] <file>   - Count lines, words, bytes',
            '  \x1b[33mecho\x1b[0m <text...>        - Print text (supports $VAR and > redirection)',
            '  \x1b[33mnano\x1b[0m / \x1b[33mvim\x1b[0m <file>     - Launch interactive text editor inside terminal',
            '  \x1b[33mpython3\x1b[0m / \x1b[33mnode\x1b[0m       - Launch interactive Python or JavaScript REPL',
            '  \x1b[33mgit\x1b[0m <cmd>             - Full Git CLI (init, status, add, commit, log, branch, checkout, diff)',
            '  \x1b[33mexport\x1b[0m VAR=val        - Set environment variable',
            '  \x1b[33menv\x1b[0m                   - Print environment variables',
            '  \x1b[33mwhoami\x1b[0m / \x1b[33mdate\x1b[0m / \x1b[33muname\x1b[0m - User & system info',
            '  \x1b[33mcurl\x1b[0m <url>            - Fetch text from Web URL',
            '  \x1b[33mclear\x1b[0m                 - Clear terminal screen',
          ];
          break;
        }

        case 'clear': {
          clear();
          return;
        }

        case 'pwd': {
          outputText = currentPath;
          break;
        }

        case 'whoami': {
          outputText = env.USER || 'user';
          break;
        }

        case 'date': {
          outputText = new Date().toString();
          break;
        }

        case 'uname': {
          outputText = cmdArgs.includes('-a')
            ? 'Linux ubuntu-desktop 6.8.0-40-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 x86_64 GNU/Linux'
            : 'Linux';
          break;
        }

        case 'env': {
          outputText = Object.entries(env).map(([k, v]) => `\x1b[36m${k}\x1b[0m=${v}`);
          break;
        }

        case 'export': {
          if (!cmdArgs[0]) {
            outputText = Object.entries(env).map(([k, v]) => `declare -x ${k}="${v}"`);
          } else {
            const [varName, val] = cmdArgs[0].split('=');
            if (varName) {
              setEnv((prev) => ({ ...prev, [varName]: val || '' }));
            }
          }
          break;
        }

        case 'echo': {
          outputText = cmdArgs.join(' ');
          break;
        }

        case 'cd': {
          const target = cmdArgs[0] || '~';
          const targetPath = resolveAbsolutePath(target);
          const node = fs.findNodeByPath(targetPath);
          if (!node) {
            outputText = `\x1b[31mbash: cd: ${target}: No such file or directory\x1b[0m`;
          } else if (node.type !== 'folder') {
            outputText = `\x1b[31mbash: cd: ${target}: Not a directory\x1b[0m`;
          } else {
            setCurrentPath(targetPath);
          }
          break;
        }

        case 'ls': {
          const showAll = cmdArgs.includes('-a') || cmdArgs.includes('-la') || cmdArgs.includes('-al') || cmdArgs.includes('-A');
          const targetArg = cmdArgs.find((a) => !a.startsWith('-')) || currentPath;
          const targetPath = resolveAbsolutePath(targetArg);
          const node = fs.findNodeByPath(targetPath);

          if (!node) {
            outputText = `\x1b[31mls: cannot access '${targetArg}': No such file or directory\x1b[0m`;
          } else if (node.type === 'file') {
            outputText = `\x1b[37m${node.name}\x1b[0m`;
          } else {
            const children = fs.getChildren(node.id);
            const visible = showAll ? children : children.filter((c) => !c.name.startsWith('.'));
            if (visible.length === 0) {
              outputText = '';
            } else {
              outputText = visible.map((c) => {
                if (c.type === 'folder') return `\x1b[1;34m📁 ${c.name}/\x1b[0m`;
                if (c.name.endsWith('.sh') || c.name.endsWith('.py') || c.name.endsWith('.js'))
                  return `\x1b[1;32m📄 ${c.name}*\x1b[0m`;
                return `\x1b[37m📄 ${c.name}\x1b[0m`;
              });
            }
          }
          break;
        }

        case 'touch': {
          if (cmdArgs.length === 0) {
            outputText = 'touch: missing file operand';
          } else {
            const parent = fs.findNodeByPath(currentPath);
            if (parent && parent.type === 'folder') {
              cmdArgs.forEach((fileName) => {
                const existing = fs.getChildren(parent.id).find((c) => c.name === fileName);
                if (!existing) {
                  fs.createFile(parent.id, fileName, '');
                }
              });
            }
          }
          break;
        }

        case 'mkdir': {
          if (cmdArgs.length === 0) {
            outputText = 'mkdir: missing operand';
          } else {
            const parent = fs.findNodeByPath(currentPath);
            if (parent && parent.type === 'folder') {
              const dirName = cmdArgs.find((a) => !a.startsWith('-')) || '';
              if (dirName) {
                const existing = fs.getChildren(parent.id).find((c) => c.name === dirName);
                if (!existing) fs.createFolder(parent.id, dirName);
                else outputText = `mkdir: cannot create directory '${dirName}': File exists`;
              }
            }
          }
          break;
        }

        case 'rm': {
          if (cmdArgs.length === 0) {
            outputText = 'rm: missing operand';
          } else {
            const recursive = cmdArgs.includes('-r') || cmdArgs.includes('-rf') || cmdArgs.includes('-fr');
            const targetName = cmdArgs.find((a) => !a.startsWith('-')) || '';
            const targetPath = resolveAbsolutePath(targetName);
            const targetNode = fs.findNodeByPath(targetPath);

            if (!targetNode) {
              outputText = `rm: cannot remove '${targetName}': No such file or directory`;
            } else if (targetNode.type === 'folder' && !recursive) {
              outputText = `rm: cannot remove '${targetName}': Is a directory`;
            } else {
              fs.deleteNode(targetNode.id);
            }
          }
          break;
        }

        case 'cat': {
          if (cmdArgs.length === 0) {
            outputText = 'cat: missing file operand';
          } else {
            const contents: string[] = [];
            for (const fileArg of cmdArgs) {
              const targetPath = resolveAbsolutePath(fileArg);
              const node = fs.findNodeByPath(targetPath);
              if (!node) {
                contents.push(`cat: ${fileArg}: No such file or directory`);
              } else if (node.type === 'folder') {
                contents.push(`cat: ${fileArg}: Is a directory`);
              } else {
                contents.push(fs.readFile(node.id) || '');
              }
            }
            outputText = contents.join('\n');
          }
          break;
        }

        case 'head': {
          if (cmdArgs.length === 0) {
            outputText = 'head: missing file operand';
          } else {
            let numLines = 10;
            let fileArg = cmdArgs[0];
            if (cmdArgs[0] === '-n' && cmdArgs[1]) {
              numLines = parseInt(cmdArgs[1], 10) || 10;
              fileArg = cmdArgs[2];
            }
            const targetPath = resolveAbsolutePath(fileArg);
            const node = fs.findNodeByPath(targetPath);
            if (!node || node.type !== 'file') {
              outputText = `head: cannot open '${fileArg}': No such file`;
            } else {
              const content = fs.readFile(node.id) || '';
              outputText = content.split('\n').slice(0, numLines).join('\n');
            }
          }
          break;
        }

        case 'tail': {
          if (cmdArgs.length === 0) {
            outputText = 'tail: missing file operand';
          } else {
            let numLines = 10;
            let fileArg = cmdArgs[0];
            if (cmdArgs[0] === '-n' && cmdArgs[1]) {
              numLines = parseInt(cmdArgs[1], 10) || 10;
              fileArg = cmdArgs[2];
            }
            const targetPath = resolveAbsolutePath(fileArg);
            const node = fs.findNodeByPath(targetPath);
            if (!node || node.type !== 'file') {
              outputText = `tail: cannot open '${fileArg}': No such file`;
            } else {
              const content = fs.readFile(node.id) || '';
              const allLines = content.split('\n');
              outputText = allLines.slice(-numLines).join('\n');
            }
          }
          break;
        }

        case 'grep': {
          if (cmdArgs.length === 0) {
            outputText = 'Usage: grep <pattern> <file>';
          } else {
            const pattern = cmdArgs[0];
            const fileArg = cmdArgs[1] || '.';
            const targetPath = resolveAbsolutePath(fileArg);
            const node = fs.findNodeByPath(targetPath);
            if (!node) {
              outputText = `grep: ${fileArg}: No such file or directory`;
            } else if (node.type === 'file') {
              const content = fs.readFile(node.id) || '';
              outputText = content.split('\n').filter((l) => l.includes(pattern)).join('\n');
            } else {
              const matches: string[] = [];
              const children = fs.getChildren(node.id);
              children.forEach((child) => {
                if (child.type === 'file') {
                  const content = fs.readFile(child.id) || '';
                  content.split('\n').forEach((l) => {
                    if (l.includes(pattern)) matches.push(`${child.name}: ${l}`);
                  });
                }
              });
              outputText = matches.join('\n');
            }
          }
          break;
        }

        case 'wc': {
          if (cmdArgs.length === 0) {
            outputText = 'wc: missing file operand';
          } else {
            const fileArg = cmdArgs.find((a) => !a.startsWith('-')) || '';
            const targetPath = resolveAbsolutePath(fileArg);
            const node = fs.findNodeByPath(targetPath);
            if (!node || node.type !== 'file') {
              outputText = `wc: '${fileArg}': No such file`;
            } else {
              const content = fs.readFile(node.id) || '';
              const lineCount = content.split('\n').length;
              const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
              const byteCount = new Blob([content]).size;
              outputText = `  ${lineCount}  ${wordCount} ${byteCount} ${node.name}`;
            }
          }
          break;
        }

        case 'tree': {
          const targetPath = resolveAbsolutePath(cmdArgs[0] || currentPath);
          const node = fs.findNodeByPath(targetPath);
          if (!node || node.type !== 'folder') {
            outputText = `tree: [${cmdArgs[0] || '.'}] opening dir failed`;
          } else {
            const treeLines: string[] = [node.name];
            const buildTree = (dirId: string, prefix = '') => {
              const children = fs.getChildren(dirId);
              children.forEach((c, idx) => {
                const isLast = idx === children.length - 1;
                const connector = isLast ? '└── ' : '├── ';
                treeLines.push(`${prefix}${connector}${c.name}`);
                if (c.type === 'folder') {
                  buildTree(c.id, prefix + (isLast ? '    ' : '│   '));
                }
              });
            };
            buildTree(node.id);
            outputText = treeLines;
          }
          break;
        }

        case 'cp': {
          if (cmdArgs.length < 2) {
            outputText = 'cp: missing file operand';
          } else {
            const srcPath = resolveAbsolutePath(cmdArgs[0]);
            const dstPath = resolveAbsolutePath(cmdArgs[1]);
            const srcNode = fs.findNodeByPath(srcPath);
            if (!srcNode) {
              outputText = `cp: cannot stat '${cmdArgs[0]}': No such file or directory`;
            } else {
              const dstNode = fs.findNodeByPath(dstPath);
              const parentNode = fs.findNodeByPath(currentPath);
              if (srcNode.type === 'file' && parentNode) {
                const targetName = dstNode?.type === 'folder' ? srcNode.name : cmdArgs[1].split('/').pop() || srcNode.name;
                const targetParentId = dstNode?.type === 'folder' ? dstNode.id : parentNode.id;
                fs.createFile(targetParentId, targetName, fs.readFile(srcNode.id) || '');
              }
            }
          }
          break;
        }

        case 'mv': {
          if (cmdArgs.length < 2) {
            outputText = 'mv: missing file operand';
          } else {
            const srcPath = resolveAbsolutePath(cmdArgs[0]);
            const dstPath = resolveAbsolutePath(cmdArgs[1]);
            const srcNode = fs.findNodeByPath(srcPath);
            if (!srcNode) {
              outputText = `mv: cannot stat '${cmdArgs[0]}': No such file or directory`;
            } else {
              const dstNode = fs.findNodeByPath(dstPath);
              if (dstNode && dstNode.type === 'folder') {
                fs.moveNode(srcNode.id, dstNode.id);
              } else {
                fs.renameNode(srcNode.id, cmdArgs[1].split('/').pop() || srcNode.name);
              }
            }
          }
          break;
        }

        // Interactive Editor: Nano / Vim
        case 'nano':
        case 'vim': {
          if (!cmdArgs[0]) {
            outputText = `${cmd}: missing filename`;
          } else {
            const targetPath = resolveAbsolutePath(cmdArgs[0]);
            let node = fs.findNodeByPath(targetPath);
            let content = '';
            if (!node) {
              const parent = fs.findNodeByPath(currentPath);
              if (parent && parent.type === 'folder') {
                const newId = fs.createFile(parent.id, cmdArgs[0], '');
                node = fs.getNodeById(newId);
              }
            } else if (node.type === 'file') {
              content = fs.readFile(node.id) || '';
            }
            setNanoFile({ path: targetPath, node, content });
            setActiveMode('nano');
            return;
          }
          break;
        }

        // Interactive REPLs
        case 'python':
        case 'python3': {
          setActiveMode('python');
          setLines((prev) => [
            ...prev,
            { type: 'output', text: 'Python 3.12.3 (main, Ubuntu Web Linux)\nType "exit()" or "quit()" to exit REPL.\n' },
          ]);
          return;
        }

        case 'node':
        case 'js': {
          setActiveMode('node');
          setLines((prev) => [
            ...prev,
            { type: 'output', text: 'Welcome to Node.js v20.12.2.\nType ".exit" to exit REPL.\n' },
          ]);
          return;
        }

        // Git Implementation
        case 'git': {
          if (cmdArgs.length === 0) {
            outputText = [
              'usage: git [--version] [--help] <command> [<args>]',
              '',
              'Supported Git commands:',
              '   init       Create an empty Git repository',
              '   status     Show the working tree status',
              '   add        Add file contents to the index',
              '   commit     Record changes to the repository',
              '   log        Show commit logs',
              '   branch     List, create, or delete branches',
              '   checkout   Switch branches or restore working tree files',
              '   diff       Show changes between commits or working tree',
              '   remote     Manage set of tracked repositories',
            ];
            break;
          }

          const gitSubCmd = cmdArgs[0].toLowerCase();

          if (gitSubCmd === 'init') {
            updateGitState((prev) => ({
              ...prev,
              isInitialized: true,
              currentBranch: 'main',
              branches: ['main'],
              staged: [],
              commits: [
                {
                  hash: Math.random().toString(16).slice(2, 9),
                  author: `${env.USER} <${env.USER}@ubuntuos.local>`,
                  date: new Date().toUTCString(),
                  message: 'Initial commit',
                  files: {},
                },
              ],
            }));
            outputText = `\x1b[32mInitialized empty Git repository in ${currentPath}/.git/\x1b[0m`;
          } else if (!currentGit || !currentGit.isInitialized) {
            outputText = '\x1b[31mfatal: not a git repository (or any of the parent directories): .git\x1b[0m';
          } else {
            switch (gitSubCmd) {
              case 'status': {
                const currentNode = fs.findNodeByPath(currentPath);
                const children = currentNode ? fs.getChildren(currentNode.id) : [];
                const files = children.filter((c) => c.type === 'file').map((c) => c.name);

                const staged = currentGit.staged;
                const untracked = files.filter((f) => !staged.includes(f) && f !== '.git');

                const statusOutput: string[] = [
                  `\x1b[32mOn branch ${currentGit.currentBranch}\x1b[0m`,
                  "Your branch is up to date with 'origin/" + currentGit.currentBranch + "'.",
                  '',
                ];

                if (staged.length > 0) {
                  statusOutput.push('\x1b[32mChanges to be committed:\x1b[0m');
                  statusOutput.push('  (use "git restore --staged <file>..." to unstage)');
                  staged.forEach((f) => statusOutput.push(`\t\x1b[32mnew file:   ${f}\x1b[0m`));
                  statusOutput.push('');
                }

                if (untracked.length > 0) {
                  statusOutput.push('\x1b[31mUntracked files:\x1b[0m');
                  statusOutput.push('  (use "git add <file>..." to include in what will be committed)');
                  untracked.forEach((f) => statusOutput.push(`\t\x1b[31m${f}\x1b[0m`));
                  statusOutput.push('');
                }

                if (staged.length === 0 && untracked.length === 0) {
                  statusOutput.push('nothing to commit, working tree clean');
                }

                outputText = statusOutput;
                break;
              }

              case 'add': {
                const targetFile = cmdArgs[1];
                if (!targetFile) {
                  outputText = 'Nothing specified, nothing added.';
                } else if (targetFile === '.' || targetFile === '-A') {
                  const currentNode = fs.findNodeByPath(currentPath);
                  const children = currentNode ? fs.getChildren(currentNode.id) : [];
                  const files = children.filter((c) => c.type === 'file').map((c) => c.name);
                  updateGitState((prev) => ({ ...prev, staged: Array.from(new Set([...prev.staged, ...files])) }));
                  outputText = '';
                } else {
                  updateGitState((prev) => ({ ...prev, staged: Array.from(new Set([...prev.staged, targetFile])) }));
                  outputText = '';
                }
                break;
              }

              case 'commit': {
                let msg = 'Updated files';
                const mIdx = cmdArgs.indexOf('-m');
                if (mIdx !== -1 && cmdArgs[mIdx + 1]) {
                  msg = cmdArgs[mIdx + 1];
                }
                if (currentGit.staged.length === 0) {
                  outputText = 'no changes added to commit (use "git add")';
                } else {
                  const newHash = Math.random().toString(16).slice(2, 9);
                  const commitEntry = {
                    hash: newHash,
                    author: `${env.USER} <${env.USER}@ubuntuos.local>`,
                    date: new Date().toUTCString(),
                    message: msg,
                    files: {},
                  };
                  updateGitState((prev) => ({
                    ...prev,
                    staged: [],
                    commits: [commitEntry, ...prev.commits],
                  }));
                  outputText = `[${currentGit.currentBranch} ${newHash}] ${msg}\n ${currentGit.staged.length} file(s) changed`;
                }
                break;
              }

              case 'log': {
                outputText = currentGit.commits.flatMap((c) => [
                  `\x1b[33mcommit ${c.hash}\x1b[0m (HEAD -> \x1b[32m${currentGit.currentBranch}\x1b[0m)`,
                  `Author: ${c.author}`,
                  `Date:   ${c.date}`,
                  '',
                  `    ${c.message}`,
                  '',
                ]);
                break;
              }

              case 'branch': {
                const newBranch = cmdArgs[1];
                if (!newBranch) {
                  outputText = currentGit.branches.map((b) =>
                    b === currentGit.currentBranch ? `* \x1b[32m${b}\x1b[0m` : `  ${b}`
                  );
                } else {
                  updateGitState((prev) => ({
                    ...prev,
                    branches: Array.from(new Set([...prev.branches, newBranch])),
                  }));
                  outputText = '';
                }
                break;
              }

              case 'checkout': {
                const createNew = cmdArgs[1] === '-b';
                const branchName = createNew ? cmdArgs[2] : cmdArgs[1];
                if (!branchName) {
                  outputText = 'error: switch branch name required';
                } else {
                  updateGitState((prev) => ({
                    ...prev,
                    currentBranch: branchName,
                    branches: Array.from(new Set([...prev.branches, branchName])),
                  }));
                  outputText = `Switched to ${createNew ? 'a new ' : ''}branch '${branchName}'`;
                }
                break;
              }

              case 'remote': {
                if (cmdArgs[1] === '-v') {
                  outputText = Object.entries(currentGit.remotes).flatMap(([name, url]) => [
                    `${name}\t${url} (fetch)`,
                    `${name}\t${url} (push)`,
                  ]);
                } else {
                  outputText = Object.keys(currentGit.remotes);
                }
                break;
              }

              case 'diff': {
                outputText = [
                  `\x1b[1mdiff --git a/${currentPath} b/${currentPath}\x1b[0m`,
                  '--- a/working_tree',
                  '+++ b/staged',
                  '\x1b[32m+ // Staged changes for git practice\x1b[0m',
                ];
                break;
              }

              default: {
                outputText = `git: '${gitSubCmd}' is not a git command. See 'git --help'.`;
                break;
              }
            }
          }
          break;
        }

        default: {
          outputText = `\x1b[31m${cmd}: command not found. Type "help" for a list of available commands.\x1b[0m`;
          break;
        }
      }

      // Handle output redirection (> or >>)
      if (redirectFile && typeof outputText === 'string') {
        const targetPath = resolveAbsolutePath(redirectFile);
        let node = fs.findNodeByPath(targetPath);
        if (!node) {
          const parent = fs.findNodeByPath(currentPath);
          if (parent && parent.type === 'folder') {
            fs.createFile(parent.id, redirectFile, outputText);
          }
        } else if (node.type === 'file') {
          const existingContent = fs.readFile(node.id) || '';
          const newContent = redirectAppend ? existingContent + '\n' + outputText : outputText;
          fs.writeFile(node.id, newContent);
        }
        return;
      }

      // Append lines to output
      if (outputText !== '') {
        if (Array.isArray(outputText)) {
          setLines((prev) => [...prev, ...outputText.map((t) => ({ type: 'output' as const, text: t }))]);
        } else {
          setLines((prev) => [...prev, { type: 'output', text: outputText as string }]);
        }
      }
    },
    [currentPath, env, fs, getGitState, updateGitState, resolveAbsolutePath, clear]
  );

  // Sub-mode input handlers (Python & Node REPLs)
  const handleSubModeInput = useCallback(
    (inputVal: string) => {
      const trimmed = inputVal.trim();
      if (activeMode === 'python') {
        if (trimmed === 'exit()' || trimmed === 'quit()') {
          setActiveMode('normal');
          setLines((prev) => [...prev, { type: 'system', text: 'Exited Python REPL.' }]);
          return;
        }
        setLines((prev) => [...prev, { type: 'input', text: `>>> ${trimmed}` }]);
        try {
          // Simple Python evaluator / JS fallback
          if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
            const inner = trimmed.slice(6, -1);
            setLines((prev) => [...prev, { type: 'output', text: inner.replace(/['"]/g, '') }]);
          } else {
            // eslint-disable-next-line no-new-func
            const res = new Function(`return ${trimmed}`)();
            if (res !== undefined) setLines((prev) => [...prev, { type: 'output', text: String(res) }]);
          }
        } catch {
          setLines((prev) => [...prev, { type: 'error', text: `NameError: name '${trimmed}' is not defined` }]);
        }
      } else if (activeMode === 'node') {
        if (trimmed === '.exit') {
          setActiveMode('normal');
          setLines((prev) => [...prev, { type: 'system', text: 'Exited Node REPL.' }]);
          return;
        }
        setLines((prev) => [...prev, { type: 'input', text: `> ${trimmed}` }]);
        try {
          // eslint-disable-next-line no-new-func
          const res = new Function(`return ${trimmed}`)();
          setLines((prev) => [...prev, { type: 'output', text: String(res) }]);
        } catch (e) {
          setLines((prev) => [...prev, { type: 'error', text: String(e) }]);
        }
      }
    },
    [activeMode]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Tab' && activeMode === 'normal') {
        e.preventDefault();
        const parts = input.split(' ');
        const lastPart = parts[parts.length - 1];

        if (parts.length === 1) {
          // Command auto-completion
          const availableCmds = [
            'ls', 'cd', 'pwd', 'touch', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'head', 'tail',
            'grep', 'find', 'tree', 'wc', 'echo', 'nano', 'vim', 'python3', 'node', 'git',
            'export', 'env', 'whoami', 'date', 'uname', 'clear', 'help'
          ];
          const matches = availableCmds.filter((c) => c.startsWith(lastPart));
          if (matches.length === 1) {
            setInput(matches[0] + ' ');
          }
        } else {
          // File / Folder auto-completion
          const currentNode = fs.findNodeByPath(currentPath);
          if (currentNode) {
            const children = fs.getChildren(currentNode.id);
            const matches = children.filter((c) => c.name.startsWith(lastPart));
            if (matches.length === 1) {
              parts[parts.length - 1] = matches[0].name + (matches[0].type === 'folder' ? '/' : ' ');
              setInput(parts.join(' '));
            }
          }
        }
      } else if (e.key === 'Enter') {
        if (activeMode === 'normal') {
          executeCommand(input);
        } else {
          handleSubModeInput(input);
        }
        setInput('');
        setHistoryIndex(-1);
      } else if (e.key === 'ArrowUp' && activeMode === 'normal') {
        e.preventDefault();
        if (historyIndex === -1) setSavedInput(input);
        const newIndex = historyIndex + 1;
        if (newIndex < history.length) {
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex]);
        }
      } else if (e.key === 'ArrowDown' && activeMode === 'normal') {
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
    [activeMode, executeCommand, handleSubModeInput, input, history, historyIndex, savedInput, currentPath, fs]
  );

  // ANSI renderer
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
          <span key={key++} style={{ ...currentStyle }}>
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }
      const codes = match[1].split(';').map(Number);
      for (const code of codes) {
        switch (code) {
          case 0: currentStyle = {}; break;
          case 1: currentStyle.fontWeight = 'bold'; break;
          case 31: currentStyle.color = '#FF5555'; break;
          case 32: currentStyle.color = '#50FA7B'; break;
          case 33: currentStyle.color = '#F1FA8C'; break;
          case 34: currentStyle.color = '#BD93F9'; break;
          case 35: currentStyle.color = '#FF79C6'; break;
          case 36: currentStyle.color = '#8BE9FD'; break;
          case 37: currentStyle.color = '#F8F8F2'; break;
          case 90: currentStyle.color = '#6272A4'; break;
          default: break;
        }
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(
        <span key={key++} style={{ ...currentStyle }}>
          {text.slice(lastIndex)}
        </span>
      );
    }
    return parts;
  };

  const currentGit = getGitState();

  return (
    <div
      className="flex flex-col h-full font-mono text-xs select-text cursor-text relative"
      style={{
        background: '#0F0F12',
        color: '#E2E8F0',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Interactive Nano Editor Overlay */}
      {activeMode === 'nano' ? (
        <div className="flex flex-col h-full bg-[#1E1E24] text-white p-2">
          <div className="bg-[#2D2D36] px-3 py-1 flex items-center justify-between text-xs font-bold rounded-t">
            <span>GNU nano 7.2</span>
            <span className="text-amber-400">File: {nanoFile.path}</span>
            <span>Modified</span>
          </div>
          <textarea
            ref={nanoTextareaRef}
            value={nanoFile.content}
            onChange={(e) => setNanoFile((prev) => ({ ...prev, content: e.target.value }))}
            className="flex-1 bg-[#121215] text-emerald-300 font-mono text-xs p-3 outline-none resize-none border border-white/10 my-1 rounded"
            autoFocus
          />
          <div className="bg-[#2D2D36] p-2 flex items-center justify-between text-[11px] rounded-b">
            <button
              onClick={() => {
                if (nanoFile.node) {
                  fs.writeFile(nanoFile.node.id, nanoFile.content);
                }
                setActiveMode('normal');
                setLines((prev) => [...prev, { type: 'success', text: `\x1b[32mWrote lines to ${nanoFile.path}\x1b[0m` }]);
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded font-semibold text-white transition-colors"
            >
              ^O Save File
            </button>
            <button
              onClick={() => setActiveMode('normal')}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded font-semibold text-white transition-colors"
            >
              ^X Exit Editor
            </button>
          </div>
        </div>
      ) : (
        /* Standard Terminal Screen */
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all leading-5">
              {line.type === 'input' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Clean Ubuntu ZSH Prompt Pill */}
                  <span className="inline-flex items-center rounded overflow-hidden text-[11px] font-bold">
                    <span className="bg-indigo-600 text-white px-2 py-0.5">user@ubuntu</span>
                    <span className="bg-emerald-600 text-white px-2 py-0.5">{line.promptPath || currentPath}</span>
                    {line.branch && <span className="bg-amber-600 text-white px-2 py-0.5">git:({line.branch})</span>}
                  </span>
                  <span className="text-amber-400 font-bold">$</span>
                  <span className="text-slate-100 font-semibold">{line.text}</span>
                </div>
              )}
              {line.type === 'output' && <span>{parseAnsi(line.text)}</span>}
              {line.type === 'error' && <span className="text-red-400">{line.text}</span>}
              {line.type === 'system' && <span className="text-slate-400">{line.text}</span>}
              {line.type === 'success' && <span>{parseAnsi(line.text)}</span>}
            </div>
          ))}

          {/* Active Input Line */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {activeMode === 'normal' && (
              <span className="inline-flex items-center rounded overflow-hidden text-[11px] font-bold shadow-sm">
                <span className="bg-indigo-600 text-white px-2 py-0.5">user@ubuntu</span>
                <span className="bg-emerald-600 text-white px-2 py-0.5">{currentPath}</span>
                {currentGit?.isInitialized && (
                  <span className="bg-amber-600 text-white px-2 py-0.5">git:({currentGit.currentBranch})</span>
                )}
              </span>
            )}

            {activeMode === 'python' && <span className="text-emerald-400 font-bold">python &gt;&gt;&gt;</span>}
            {activeMode === 'node' && <span className="text-cyan-400 font-bold">node &gt;</span>}

            {activeMode === 'normal' && <span className="text-amber-400 font-bold">$</span>}

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-slate-100 min-w-[200px] font-mono text-xs"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        </div>
      )}
    </div>
  );
}
