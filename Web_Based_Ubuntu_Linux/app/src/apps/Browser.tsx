// ============================================================
// Web Browser — Tabbed browser with simulated privacy & downloads
// ============================================================

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  ArrowLeft, ArrowRight, RefreshCw, Home, Star, Plus, X, Lock, Search,
  Globe, Youtube, Github, Twitter, Linkedin, ShoppingBag, Newspaper, Code,
  Download, Loader, Shield, Eye, EyeOff, Monitor, AlertTriangle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ---- Types ----
interface Tab {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIndex: number;
  loading: boolean;
}

interface Bookmark {
  url: string;
  title: string;
}

interface DownloadItem {
  id: string;
  filename: string;
  size: number;
  progress: number;
  completed: boolean;
}

// ---- Quick Links ----
const QUICK_LINKS: { icon: LucideIcon; name: string; url: string; color: string }[] = [
  { icon: Search, name: 'Google', url: 'https://google.com', color: '#4285F4' },
  { icon: Youtube, name: 'YouTube', url: 'https://youtube.com', color: '#FF0000' },
  { icon: Github, name: 'GitHub', url: 'https://github.com', color: '#333' },
  { icon: Twitter, name: 'Twitter', url: 'https://twitter.com', color: '#1DA1F2' },
  { icon: Linkedin, name: 'LinkedIn', url: 'https://linkedin.com', color: '#0A66C2' },
  { icon: ShoppingBag, name: 'Amazon', url: 'https://amazon.com', color: '#FF9900' },
  { icon: Code, name: 'Stack Overflow', url: 'https://stackoverflow.com', color: '#F48024' },
  { icon: Newspaper, name: 'Reddit', url: 'https://reddit.com', color: '#FF4500' },
];

const NEWS_ARTICLES = [
  { title: 'Ubuntu 24.04 LTS Released with New Features', source: 'ubuntu.com', time: '2h ago' },
  { title: 'React 19 Introduces New Compiler for Performance', source: 'react.dev', time: '4h ago' },
  { title: 'TypeScript 5.5 Brings Improved Type Inference', source: 'dev.to', time: '6h ago' },
  { title: 'WebAssembly Now Supported in All Major Browsers', source: 'webassembly.org', time: '8h ago' },
];

const IFRAME_FRIENDLY_SITES = ['example.com', 'wikipedia.org', 'ubuntu.com'];

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

// ---- Build Simulated Pages (with Ad Blocker logic) ----
const buildSitePage = (url: string, adBlockerOn: boolean): string => {
  const host = url.replace(/^https?:\/\//, '').split('/')[0];
  const safeHost = escapeHtml(host);

  // Ad Blocking CSS injected only if enabled
  const adBlockCSS = adBlockerOn ? `
    <style>
      [id*="ad-"], [class*="ad-"], [id*="banner"], [class*="sponsor"], iframe[src*="doubleclick"] {
        display: none !important; visibility: hidden !important; height: 0 !important;
      }
      .ad-blocker-badge {
        position: fixed; bottom: 16px; right: 16px; background: #ef4444; color: white;
        padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; z-index: 9999;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      }
    </style>
    <div class="ad-blocker-badge">🛡️ Ads Blocked</div>
  ` : '';

  if (host.includes('youtube.com')) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${adBlockCSS}<style>
      body { margin: 0; font-family: Arial, sans-serif; background: #0f0f0f; color: white; }
      .topbar { display: flex; padding: 16px; gap: 16px; background: #202020; }
      .logo { background: #ff0000; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 24px; }
      .card { background: #272727; border-radius: 12px; overflow: hidden; }
      .thumb { height: 140px; background: linear-gradient(135deg, #ff3b30, #f9a825); }
      .info { padding: 12px; }
      .btn { display: inline-block; margin: 24px; padding: 10px 20px; background: #ff0000; color: white; border-radius: 8px; text-decoration: none; }
    </style></head><body>
      <div class="topbar"><div class="logo">▶ YouTube</div><input style="flex:1;background:#121212;border:1px solid #303030;color:white;padding:8px;border-radius:16px;" value="${safeHost}" /></div>
      <div class="grid">
        <div class="card"><div class="thumb"></div><div class="info"><b>Linux Desktop in Browser</b><br/><small>1.2M views</small></div></div>
        <div class="card"><div class="thumb" style="background:linear-gradient(135deg,#3a86ff,#8338ec)"></div><div class="info"><b>Web Dev Masterclass</b><br/><small>842K views</small></div></div>
      </div>
      <a class="btn" href="${escapeHtml(url)}" target="_blank">Open Real Site</a>
    </body></html>`;
  }

  if (host.includes('github.com')) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${adBlockCSS}<style>
      body { margin:0; background:#0d1117; color:#f0f6fc; font-family:Arial,sans-serif; padding:40px; }
      .card { background:#161b22; border:1px solid #30363d; border-radius:14px; padding:24px; max-width:800px; margin:auto; }
      .repo { color:#58a6ff; font-size:24px; font-weight:700; }
      .btn { display:inline-block; margin-top:20px; padding:10px 16px; background:#238636; color:white; text-decoration:none; border-radius:6px; }
      .dl-btn { display:inline-block; margin-top:20px; margin-left:10px; padding:10px 16px; background:#2ea043; color:white; border-radius:6px; cursor:pointer; border:none; font-size:14px; }
    </style></head><body>
      <div class="card">
        <div class="repo">${safeHost}</div>
        <p style="color:#8b949e">Web-based Linux desktop environment. Secure, simulated, and privacy-focused.</p>
        <a class="btn" href="${escapeHtml(url)}" target="_blank">View on GitHub</a>
        <button class="dl-btn" onclick="window.parent.postMessage({action: 'download', filename: 'WebLinux-v1.0.tar.gz', size: 45000000}, '*')">⬇ Download Source</button>
      </div>
    </body></html>`;
  }

  if (host.includes('stackoverflow.com')) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${adBlockCSS}<style>
      body { margin:0; background:#f6f6f6; color:#3b4045; font-family:Arial,sans-serif; padding:40px; }
      .card { background:white; border:1px solid #e3e6e8; border-radius:8px; padding:24px; max-width:800px; margin:auto; }
      .title { color:#0074cc; font-size:24px; font-weight:400; }
      .tag { display:inline-block; padding:4px 8px; background:#e1ecf4; color:#39739d; border-radius:4px; font-size:12px; margin-right:4px; }
    </style></head><body>
      <div class="card">
        <div class="title">How to build a web-based Linux desktop environment?</div>
        <p>I'm trying to create a browser-based Ubuntu-like desktop with window management, tabs, and state.</p>
        <div style="margin-top:16px;"><span class="tag">javascript</span><span class="tag">react</span><span class="tag">ubuntu</span></div>
      </div>
    </body></html>`;
  }

  // Generic Fallback
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${adBlockCSS}<style>
    body { font-family:Arial,sans-serif; background:#f5f5f5; padding:40px; color:#333; }
    .header { background:linear-gradient(135deg,#7C4DFF,#FF9800); color:white; padding:40px; border-radius:12px; margin-bottom:30px; max-width:800px; margin:auto; }
    .alert { background:#fff3cd; border:1px solid #ffc107; color:#856404; padding:16px; border-radius:8px; max-width:800px; margin:auto; margin-bottom:24px; }
    .btn { display:inline-block; padding:12px 24px; background:#7C4DFF; color:white; text-decoration:none; border-radius:8px; font-weight:600; }
  </style></head><body>
    <div class="header"><h1>${safeHost}</h1><p>UbuntuOS Browser Sandbox</p></div>
    <div class="alert"><b>Why you're seeing this:</b> Real websites block iframe embedding for security. This is a simulated preview.</div>
    <div style="max-width:800px;margin:auto;"><a href="${escapeHtml(url)}" target="_blank" class="btn">Open ${safeHost} externally</a></div>
  </body></html>`;
};

const generateId = () => Math.random().toString(36).slice(2);

const normalizeUrl = (input: string): string => {
  const trimmed = input.trim();
  if (trimmed === '' || trimmed === 'home') return 'home';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.includes(' ') || (!trimmed.includes('.') && !trimmed.startsWith('localhost'))) return `search://${trimmed}`;
  return `https://${trimmed}`;
};

// ---- Homepage ----
const Homepage = memo(function Homepage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) onNavigate(`search://${searchQuery.trim()}`);
  };
  return (
    <div className="h-full flex flex-col items-center pt-12 custom-scrollbar overflow-auto" style={{ background: 'var(--bg-window)' }}>
      <div className="flex items-center gap-3 mb-8">
        <Globe size={36} style={{ color: 'var(--accent-primary)' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>UbuntuOS Browser</h1>
      </div>
      <form onSubmit={handleSearch} className="w-full flex justify-center px-4 mb-10">
        <div className="flex items-center gap-2 px-4" style={{ width: '480px', height: '44px', borderRadius: '22px', background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
          <Search size={18} style={{ color: 'var(--text-disabled)' }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search or enter address" className="flex-1 bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} />
        </div>
      </form>
      <div className="grid grid-cols-4 gap-4 mb-10" style={{ maxWidth: '400px' }}>
        {QUICK_LINKS.map((link) => (
          <button key={link.name} onClick={() => onNavigate(link.url)} className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105" style={{ background: 'var(--bg-hover)' }}>
            <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 12, background: link.color + '20' }}>
              <link.icon size={24} style={{ color: link.color }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{link.name}</span>
          </button>
        ))}
      </div>
      <div style={{ width: '100%', maxWidth: '640px', padding: '0 24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Top Stories</h2>
        <div className="grid grid-cols-1 gap-3">
          {NEWS_ARTICLES.map((article, i) => (
            <div key={i} onClick={() => onNavigate(`https://${article.source}`)} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all" style={{ background: 'var(--bg-titlebar)', border: '1px solid var(--border-subtle)' }}>
              <div><h3 style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{article.title}</h3><span style={{ fontSize: '11px', color: 'var(--text-disabled)' }}>{article.source} • {article.time}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ---- Search Results ----
const SearchResults = memo(function SearchResults({ query, onNavigate }: { query: string; onNavigate: (url: string) => void }) {
  const results = [
    { title: `${query} - Wikipedia`, url: `https://wikipedia.org/wiki/${encodeURIComponent(query)}`, desc: `Encyclopedia article about ${query}.` },
    { title: `${query} - GitHub`, url: `https://github.com/search?q=${encodeURIComponent(query)}`, desc: `Code repositories related to ${query}.` },
    { title: `${query} - Stack Overflow`, url: `https://stackoverflow.com/questions/tagged/${encodeURIComponent(query)}`, desc: `Developer questions about ${query}.` },
  ];
  return (
    <div className="h-full p-6 custom-scrollbar overflow-auto" style={{ background: '#f5f5f5' }}>
      <h1 style={{ fontSize: '20px', color: '#333', marginBottom: '16px' }}>Results for "{query}"</h1>
      <div className="flex flex-col gap-4" style={{ maxWidth: '680px' }}>
        {results.map((r, i) => (
          <div key={i} className="p-4 rounded-lg bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <button onClick={() => onNavigate(r.url)} className="text-left block w-full">
              <h3 style={{ fontSize: '15px', color: '#1a0dab', marginBottom: '4px' }}>{r.title}</h3>
              <p style={{ fontSize: '12px', color: '#006621', marginBottom: '4px' }}>{r.url}</p>
              <p style={{ fontSize: '13px', color: '#545454' }}>{r.desc}</p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

// ---- Main Browser ----
export default function Browser() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: generateId(), url: 'home', title: 'New Tab', history: ['home'], historyIndex: 0, loading: false }]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => { try { return JSON.parse(localStorage.getItem('browser_bookmarks') || '[]'); } catch { return []; } });
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [showDownloads, setShowDownloads] = useState(false);
  const [addressBarValue, setAddressBarValue] = useState('');
  
  // Privacy Simulated States
  const [vpnEnabled, setVpnEnabled] = useState(false);
  const [adBlockerEnabled, setAdBlockerEnabled] = useState(true);
  const [fakeIP] = useState(() => `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => { localStorage.setItem('browser_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { setAddressBarValue(activeTab.url === 'home' ? '' : activeTab.url); }, [activeTab]);

  // Listen for downloads triggered from inside iframes
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.action === 'download') {
        simulateDownload(e.data.filename);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const updateActiveTab = useCallback((updates: Partial<Tab>) => {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, ...updates } : t)));
  }, [activeTabId]);

  const navigateTo = useCallback((url: string) => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    updateActiveTab({ loading: true });
    setTimeout(() => {
      setTabs((prev) => prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const newHistory = t.history.slice(0, t.historyIndex + 1);
        if (newHistory[newHistory.length - 1] !== normalized) newHistory.push(normalized);
        const title = normalized === 'home' ? 'New Tab' : normalized.startsWith('search://') ? `Search: ${normalized.replace('search://', '')}` : normalized.replace(/^https?:\/\//, '').split('/')[0];
        return { ...t, url: normalized, title, history: newHistory, historyIndex: newHistory.length - 1, loading: false };
      }));
    }, 400);
  }, [activeTabId, updateActiveTab]);

  const addTab = () => { const newTab = { id: generateId(), url: 'home', title: 'New Tab', history: ['home'], historyIndex: 0, loading: false }; setTabs(p => [...p, newTab]); setActiveTabId(newTab.id); };
  
  const closeTab = (tabId: string) => {
    setTabs((prev) => {
      if (prev.length === 1) return [{ id: generateId(), url: 'home', title: 'New Tab', history: ['home'], historyIndex: 0, loading: false }];
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) { const idx = prev.findIndex((t) => t.id === tabId); setActiveTabId((prev[idx - 1] || prev[idx + 1])?.id || filtered[0].id); }
      return filtered;
    });
  };

  const goBack = () => setTabs(p => p.map(t => t.id !== activeTabId || t.historyIndex <= 0 ? t : { ...t, url: t.history[t.historyIndex - 1], historyIndex: t.historyIndex - 1 }));
  const goForward = () => setTabs(p => p.map(t => t.id !== activeTabId || t.historyIndex >= t.history.length - 1 ? t : { ...t, url: t.history[t.historyIndex + 1], historyIndex: t.historyIndex + 1 }));
  const refresh = () => { const tab = tabs.find(t => t.id === activeTabId); if (tab) navigateTo(tab.url); };
  const toggleBookmark = () => {
    if (activeTab.url === 'home' || activeTab.url.startsWith('search://')) return;
    setBookmarks(p => p.find(b => b.url === activeTab.url) ? p.filter(b => b.url !== activeTab.url) : [...p, { url: activeTab.url, title: activeTab.title }]);
  };

  const simulateDownload = (filename: string) => {
    const dl: DownloadItem = { id: generateId(), filename, size: Math.floor(Math.random() * 50000000), progress: 0, completed: false };
    setDownloads(p => [dl, ...p]);
    const interval = setInterval(() => {
      setDownloads(p => p.map(d => {
        if (d.id === dl.id) {
          const newProg = Math.min(d.progress + 15, 100);
          if (newProg >= 100) { clearInterval(interval); return { ...d, progress: 100, completed: true }; }
          return { ...d, progress: newProg };
        }
        return d;
      }));
    }, 300);
  };

  const isBookmarked = bookmarks.some(b => b.url === activeTab.url);
  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;
  const activeDownloads = downloads.filter(d => !d.completed).length;

  const renderContent = () => {
    if (activeTab.loading) return (<div className="h-full flex items-center justify-center"><Loader size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} /></div>);
    if (activeTab.url === 'home') return <Homepage onNavigate={navigateTo} />;
    if (activeTab.url.startsWith('search://')) return <SearchResults query={activeTab.url.replace('search://', '')} onNavigate={navigateTo} />;
    const host = activeTab.url.replace(/^https?:\/\//, '').split('/')[0];
    if (IFRAME_FRIENDLY_SITES.some(s => host.includes(s))) return <iframe src={activeTab.url} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-forms" />;
    return <iframe srcDoc={buildSitePage(activeTab.url, adBlockerEnabled)} className="w-full h-full border-0" />;
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Top Bar */}
      <div className="flex items-center gap-2 px-3 shrink-0" style={{ height: 44, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={goBack} disabled={!canGoBack} className="p-1.5 rounded hover:bg-[var(--bg-hover)] disabled:opacity-30"><ArrowLeft size={16} style={{ color: 'var(--text-primary)' }} /></button>
        <button onClick={goForward} disabled={!canGoForward} className="p-1.5 rounded hover:bg-[var(--bg-hover)] disabled:opacity-30"><ArrowRight size={16} style={{ color: 'var(--text-primary)' }} /></button>
        <button onClick={refresh} className="p-1.5 rounded hover:bg-[var(--bg-hover)]"><RefreshCw size={16} style={{ color: 'var(--text-primary)' }} /></button>
        <button onClick={() => navigateTo('home')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]"><Home size={16} style={{ color: 'var(--text-primary)' }} /></button>
        <form onSubmit={(e) => { e.preventDefault(); navigateTo(addressBarValue); }} className="flex-1">
          <div className="flex items-center gap-2 px-3" style={{ height: 32, borderRadius: 16, background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
            <Lock size={14} style={{ color: 'var(--accent-success)' }} />
            <input type="text" value={addressBarValue} onChange={(e) => setAddressBarValue(e.target.value)} placeholder="Search or enter address" className="flex-1 bg-transparent outline-none" style={{ color: 'var(--text-primary)', fontSize: '13px' }} />
          </div>
        </form>
        <button onClick={toggleBookmark} className="p-1.5 rounded hover:bg-[var(--bg-hover)]"><Star size={16} style={{ color: isBookmarked ? 'var(--accent-secondary)' : 'var(--text-secondary)' }} fill={isBookmarked ? 'var(--accent-secondary)' : 'none'} /></button>
        <button onClick={() => setShowDownloads(!showDownloads)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] relative">
          <Download size={16} style={{ color: 'var(--text-primary)' }} />
          {activeDownloads > 0 && <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full" style={{ width: 14, height: 14, background: 'var(--accent-primary)', color: 'white', fontSize: '9px' }}>{activeDownloads}</span>}
        </button>
      </div>

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <div className="flex items-center gap-1 px-3 shrink-0 overflow-x-auto custom-scrollbar" style={{ height: 32, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
          {bookmarks.map(bm => (
            <button key={bm.url} onClick={() => navigateTo(bm.url)} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-hover)] shrink-0">
              <Star size={10} style={{ color: 'var(--accent-secondary)' }} fill="var(--accent-secondary)" />
              <span className="truncate max-w-[100px]" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{bm.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Privacy Toolbar */}
      <div className="flex items-center gap-3 px-3 shrink-0" style={{ height: 28, background: vpnEnabled ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setVpnEnabled(!vpnEnabled)} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-hover)]">
          <Shield size={12} style={{ color: vpnEnabled ? '#22c55e' : 'var(--text-disabled)' }} />
          <span style={{ fontSize: '11px', color: vpnEnabled ? '#22c55e' : 'var(--text-disabled)' }}>VPN: {vpnEnabled ? 'ON' : 'OFF'}</span>
          {vpnEnabled && <span style={{ color: '#22c55e', fontSize: '10px' }}>({fakeIP})</span>}
        </button>
        <button onClick={() => setAdBlockerEnabled(!adBlockerEnabled)} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-hover)]">
          {adBlockerEnabled ? <EyeOff size={12} style={{ color: '#ef4444' }} /> : <Eye size={12} style={{ color: 'var(--text-disabled)' }} />}
          <span style={{ fontSize: '11px', color: adBlockerEnabled ? '#ef4444' : 'var(--text-disabled)' }}>Ads: {adBlockerEnabled ? 'Blocked' : 'Allowed'}</span>
        </button>
        <div className="flex items-center gap-1.5 px-2 py-1">
          <Monitor size={12} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>VM Mode: Active</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <AlertTriangle size={10} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '9px', color: '#f59e0b' }}>Simulated privacy features (educational)</span>
        </div>
      </div>

      {/* Downloads Panel */}
      {showDownloads && downloads.length > 0 && (
        <div className="shrink-0 custom-scrollbar overflow-auto" style={{ maxHeight: 150, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)', padding: '8px' }}>
          <div className="flex justify-between items-center mb-2 px-2"><span style={{ fontSize: '11px', fontWeight: 600 }}>Downloads</span><button onClick={() => setShowDownloads(false)} style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Close</button></div>
          {downloads.map(d => (
            <div key={d.id} className="flex items-center gap-2 p-2 rounded mb-1" style={{ background: 'var(--bg-window)' }}>
              <Download size={14} style={{ color: 'var(--accent-primary)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between"><span className="truncate" style={{ fontSize: '11px' }}>{d.filename}</span><span style={{ fontSize: '10px', color: 'var(--text-disabled)' }}>{d.completed ? '✓ Done' : `${d.progress}%`}</span></div>
                {!d.completed && <div className="h-1 rounded-full mt-1" style={{ background: 'var(--border-subtle)' }}><div className="h-full rounded-full" style={{ width: `${d.progress}%`, background: 'var(--accent-primary)' }} /></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 shrink-0 overflow-x-auto custom-scrollbar" style={{ height: 36, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer shrink-0" style={{ maxWidth: 180, minWidth: 100, background: tab.id === activeTabId ? 'var(--bg-window)' : 'transparent', borderTop: tab.id === activeTabId ? '2px solid var(--accent-primary)' : '2px solid transparent' }}>
            {tab.loading ? <Loader size={12} className="animate-spin" style={{ color: 'var(--accent-primary)' }} /> : <Globe size={12} style={{ color: 'var(--text-secondary)' }} />}
            <span className="truncate flex-1" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{tab.title}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="hover:bg-[var(--bg-hover)] rounded-full p-0.5"><X size={12} style={{ color: 'var(--text-secondary)' }} /></button>
          </div>
        ))}
        <button onClick={addTab} className="p-1.5 rounded hover:bg-[var(--bg-hover)]"><Plus size={16} style={{ color: 'var(--text-secondary)' }} /></button>
      </div>

      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
}
