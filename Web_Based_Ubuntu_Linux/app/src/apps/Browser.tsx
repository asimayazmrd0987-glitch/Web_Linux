import { useState, useEffect, useCallback, memo } from 'react';
import {
  ArrowLeft, ArrowRight, RefreshCw, Home, Star, Plus, X, Lock, Search,
  Globe, Youtube, Github, Twitter, Linkedin, ShoppingBag, Newspaper, Code,
  Download, Loader, Shield, Eye, EyeOff, Monitor, AlertTriangle, Map
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Tab { id: string; url: string; title: string; history: string[]; historyIndex: number; loading: boolean; }
interface Bookmark { url: string; title: string; }
interface DownloadItem { id: string; filename: string; progress: number; completed: boolean; }

const QUICK_LINKS: { icon: LucideIcon; name: string; url: string; color: string }[] = [
  { icon: Search, name: 'Google', url: 'https://google.com', color: '#4285F4' },
  { icon: Youtube, name: 'YouTube', url: 'https://youtube.com', color: '#FF0000' },
  { icon: Map, name: 'Maps (REAL)', url: 'https://www.openstreetmap.org/export/embed.html?bbox=-0.1318%2C51.4988%2C-0.0940%2C51.5120&layer=mapnik', color: '#7ebc6f' },
  { icon: Github, name: 'GitHub', url: 'https://github.com', color: '#333' },
  { icon: Twitter, name: 'Twitter', url: 'https://twitter.com', color: '#1DA1F2' },
  { icon: Linkedin, name: 'LinkedIn', url: 'https://linkedin.com', color: '#0A66C2' },
  { icon: ShoppingBag, name: 'Amazon', url: 'https://amazon.com', color: '#FF9900' },
  { icon: Newspaper, name: 'Reddit', url: 'https://reddit.com', color: '#FF4500' },
];

const NEWS_ARTICLES = [
  { title: 'Ubuntu 24.04 LTS Released with New Features', source: 'ubuntu.com', time: '2h ago' },
  { title: 'React 19 Introduces New Compiler for Performance', source: 'react.dev', time: '4h ago' },
  { title: 'TypeScript 5.5 Brings Improved Type Inference', source: 'dev.to', time: '6h ago' },
];

// Sites that ALLOW being embedded (no X-Frame-Options block)
const IFRAME_FRIENDLY_SITES = ['example.com', 'openstreetmap.org', 'wikipedia.org', 'ubuntu.com'];

const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PAGE_SEARCH_FORM = `
  <form onsubmit="event.preventDefault(); window.parent.postMessage({action:'search', query: document.getElementById('q').value}, '*'); return false;">
    <input id="q" class="search" placeholder="Search here and press Enter" autocomplete="off" />
  </form>`;

const EXTERNAL_NOTE = (url: string, host: string) => `
  <a class="ext" href="${escapeHtml(url)}" target="_blank" rel="noopener">
    ${escapeHtml(host)} blocks embedding for security — open the real site in a new tab ↗
  </a>`;

const buildSitePage = (url: string, adBlockerOn: boolean): string => {
  const host = url.replace(/^https?:\/\//, '').split('/')[0];
  const safeHost = escapeHtml(host);

  const adBlockCSS = adBlockerOn ? `
    <style>
      [id*="ad-"], [class*="ad-"], [id*="banner"], [class*="sponsor"] { display:none !important; }
      .ad-badge { position:fixed; bottom:14px; right:14px; background:#ef4444; color:#fff;
        padding:6px 10px; border-radius:8px; font-size:11px; font-weight:bold; z-index:9999; }
    </style>
    <div class="ad-badge">🛡️ Ads Blocked</div>` : '';

  const extCSS = `.ext { display:inline-block; margin:16px; color:#9ca3af; font-size:12px; text-decoration:underline; }`;

  // ---------- YOUTUBE: REAL PLAYER (YouTube officially allows /embed/) ----------
  if (host.includes('youtube.com')) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${adBlockCSS}<style>
      body { margin:0; font-family:Arial,sans-serif; background:#0f0f0f; color:#fff; }
      .topbar { display:flex; padding:12px 16px; gap:12px; background:#202020; align-items:center; }
      .logo { background:#f00; padding:4px 8px; border-radius:4px; font-weight:bold; }
      .search { flex:1; background:#121212; border:1px solid #303030; color:#fff; padding:10px 14px; border-radius:16px; }
      .wrap { display:grid; grid-template-columns: 2fr 1fr; gap:16px; padding:16px; }
      .player { width:100%; aspect-ratio:16/9; border:0; border-radius:12px; background:#000; }
      .side { display:flex; flex-direction:column; gap:10px; }
      .item { cursor:pointer; background:#272727; border-radius:8px; padding:10px; font-size:12px; }
      .item:hover { background:#3f3f3f; }
      .ext { color:#9ca3af; font-size:12px; margin:0 16px 16px; display:inline-block; }
    </style></head><body>
      <div class="topbar"><div class="logo">▶ YouTube</div>
        <form style="flex:1;display:flex" onsubmit="event.preventDefault(); play(document.getElementById('q').value); return false;">
          <input id="q" class="search" placeholder="Paste ANY YouTube link or video ID and press Enter — it plays here" />
        </form>
      </div>
      <div class="wrap">
        <iframe id="player" class="player" src="https://www.youtube.com/embed/aqz-KE-bpKQ"
          allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
        <div class="side">
          <div class="item" onclick="play('aqz-KE-bpKQ')"><b>Big Buck Bunny</b><br><small>Real video • plays inside this browser</small></div>
          <div class="item" onclick="play('jNQXAC9IVRw')"><b>Me at the zoo</b><br><small>The first YouTube video ever</small></div>
          <div class="item" onclick="play('9bZkp7q19f0')"><b>PSY – Gangnam Style</b><br><small>Classic • real playback</small></div>
        </div>
      </div>
      <a class="ext" href="${escapeHtml(url)}" target="_blank" rel="noopener">
        youtube.com blocks full-site embedding — but the player above is the REAL YouTube ↗
      </a>
      <script>
        function extractId(v){
          var m = v.match(/(?:youtu\\.be\\/|v=|embed\\/|shorts\\/)([\\w-]{11})/);
          if (m) return m[1];
          if (/^[\\w-]{11}$/.test(v.trim())) return v.trim();
          return null;
        }
        function play(v){
          var id = extractId(v || '');
          if (id) document.getElementById('player').src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
        }
      </script>
    </body></html>`;
  }

  // ---------- GITHUB ----------
  if (host.includes('github.com')) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${adBlockCSS}<style>
      body { margin:0; background:#0d1117; color:#f0f6fc; font-family:Arial,sans-serif; padding:40px; }
      .search { width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:10px 14px; border-radius:6px; margin-bottom:14px; }
      .card { background:#161b22; border:1px solid #30363d; border-radius:14px; padding:24px; max-width:800px; margin:auto; }
      .repo { color:#58a6ff; font-size:22px; font-weight:700; }
      .btn { display:inline-block; margin-top:14px; padding:10px 16px; background:#238636; color:#fff; border:none; border-radius:6px; cursor:pointer; }
      ${extCSS} .ext { color:#8b949e; margin:18px 0 0; }
    </style></head><body>
      <div class="card">
        <div class="repo">${safeHost}</div>
        <p style="color:#8b949e">Web-based Linux desktop environment. Secure, simulated, privacy-focused.</p>
        ${PAGE_SEARCH_FORM}
        <button class="btn" onclick="window.parent.postMessage({action:'download', filename:'WebLinux-v1.0.tar.gz'}, '*')">⬇ Download Source</button>
        <br/>${EXTERNAL_NOTE(url, host)}
      </div>
    </body></html>`;
  }

  // ---------- GENERIC (Google, Twitter, Amazon...) ----------
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${adBlockCSS}<style>
    body { font-family:Arial,sans-serif; background:#f5f5f5; padding:40px; color:#333; }
    .header { background:linear-gradient(135deg,#7C4DFF,#FF9800); color:#fff; padding:36px; border-radius:12px; max-width:760px; margin:0 auto 24px; }
    .search { width:100%; padding:12px 16px; border-radius:20px; border:none; font-size:14px; margin-top:16px; }
    .card { background:#fff; padding:24px; border-radius:12px; max-width:760px; margin:0 auto; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    ${extCSS}
  </style></head><body>
    <div class="header"><h1 style="margin:0 0 6px">${safeHost}</h1><p style="margin:0;opacity:.9">UbuntuOS Browser Sandbox</p>${PAGE_SEARCH_FORM}</div>
    <div class="card">
      <h2 style="margin-top:0">Why am I seeing this page?</h2>
      <p><b>${safeHost}</b> sends a security header (X-Frame-Options) that forbids Chrome from showing it inside any other website. Every browser on earth obeys this rule — it protects you from clickjacking.</p>
      <p>The search box above works inside this browser. For the real site, use the link below.</p>
      ${EXTERNAL_NOTE(url, host)}
    </div>
  </body></html>`;
};

const generateId = () => Math.random().toString(36).slice(2);

const normalizeUrl = (input: string): string => {
  const t = input.trim();
  if (t === '' || t === 'home') return 'home';
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (t.includes(' ') || (!t.includes('.') && !t.startsWith('localhost'))) return `search://${t}`;
  return `https://${t}`;
};

const stopGrab = {
  onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
  onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
};

const Homepage = memo(function Homepage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="h-full flex flex-col items-center pt-12 custom-scrollbar overflow-auto" style={{ background: 'var(--bg-window)' }}>
      <div className="flex items-center gap-3 mb-8">
        <Globe size={36} style={{ color: 'var(--accent-primary)' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>UbuntuOS Browser</h1>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) onNavigate(`search://${searchQuery.trim()}`); }} className="w-full flex justify-center px-4 mb-10">
        <div className="flex items-center gap-2 px-4" style={{ width: '480px', height: '44px', borderRadius: '22px', background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
          <Search size={18} style={{ color: 'var(--text-disabled)' }} />
          <input {...stopGrab} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search or enter address" className="flex-1 bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} />
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
          {NEWS_ARTICLES.map((a, i) => (
            <div key={i} onClick={() => onNavigate(`https://${a.source}`)} className="p-3 rounded-lg cursor-pointer" style={{ background: 'var(--bg-titlebar)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{a.title}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-disabled)' }}>{a.source} • {a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const SearchResults = memo(function SearchResults({ query, onNavigate }: { query: string; onNavigate: (url: string) => void }) {
  const [refine, setRefine] = useState('');
  const results = [
    { title: `${query} — Wikipedia`, url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`, desc: `Encyclopedia results for ${query}.` },
    { title: `${query} — GitHub code search`, url: `https://github.com/search?q=${encodeURIComponent(query)}`, desc: `Repositories and code related to ${query}.` },
    { title: `${query} — Stack Overflow`, url: `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`, desc: `Developer questions about ${query}.` },
  ];
  return (
    <div className="h-full p-6 custom-scrollbar overflow-auto" style={{ background: '#f5f5f5' }}>
      <form {...stopGrab} onSubmit={(e) => { e.preventDefault(); if (refine.trim()) onNavigate(`search://${refine.trim()}`); }} className="mb-4" style={{ maxWidth: 680 }}>
        <input {...stopGrab} value={refine} onChange={(e) => setRefine(e.target.value)} placeholder="Search again..." style={{ width: '100%', padding: '10px 14px', borderRadius: 20, border: '1px solid #ccc', fontSize: 14 }} />
      </form>
      <h1 style={{ fontSize: '20px', color: '#333', marginBottom: '16px' }}>Results for "{query}"</h1>
      <div className="flex flex-col gap-4" style={{ maxWidth: '680px' }}>
        {results.map((r, i) => (
          <div key={i} className="p-4 rounded-lg bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <button onClick={() => onNavigate(r.url)} className="text-left block w-full">
              <h3 style={{ fontSize: '15px', color: '#1a0dab', marginBottom: 4 }}>{r.title}</h3>
              <p style={{ fontSize: '12px', color: '#006621', marginBottom: 4 }}>{r.url}</p>
              <p style={{ fontSize: '13px', color: '#545454' }}>{r.desc}</p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function Browser() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: generateId(), url: 'home', title: 'New Tab', history: ['home'], historyIndex: 0, loading: false }]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => { try { return JSON.parse(localStorage.getItem('browser_bookmarks') || '[]'); } catch { return []; } });
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [showDownloads, setShowDownloads] = useState(false);
  const [addressBarValue, setAddressBarValue] = useState('');
  const [vpnEnabled, setVpnEnabled] = useState(false);
  const [adBlockerEnabled, setAdBlockerEnabled] = useState(true);
  const [fakeIP] = useState(() => `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => { localStorage.setItem('browser_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { setAddressBarValue(activeTab.url === 'home' ? '' : activeTab.url); }, [activeTab]);

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
        const title = normalized === 'home' ? 'New Tab'
          : normalized.startsWith('search://') ? `Search: ${normalized.replace('search://', '')}`
          : normalized.replace(/^https?:\/\//, '').split('/')[0];
        return { ...t, url: normalized, title, history: newHistory, historyIndex: newHistory.length - 1, loading: false };
      }));
    }, 400);
  }, [activeTabId, updateActiveTab]);

  const simulateDownload = useCallback((filename: string) => {
    const dl: DownloadItem = { id: generateId(), filename, progress: 0, completed: false };
    setDownloads((p) => [dl, ...p]);
    const iv = setInterval(() => {
      setDownloads((p) => p.map((d) => {
        if (d.id !== dl.id) return d;
        const np = Math.min(d.progress + 15, 100);
        if (np >= 100) { clearInterval(iv); return { ...d, progress: 100, completed: true }; }
        return { ...d, progress: np };
      }));
    }, 300);
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.action === 'download') simulateDownload(e.data.filename || 'file.bin');
      if (e.data?.action === 'search' && e.data.query) navigateTo(`search://${e.data.query}`);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [navigateTo, simulateDownload]);

  const addTab = () => { const t = { id: generateId(), url: 'home', title: 'New Tab', history: ['home'], historyIndex: 0, loading: false }; setTabs((p) => [...p, t]); setActiveTabId(t.id); };
  const closeTab = (tabId: string) => {
    setTabs((prev) => {
      if (prev.length === 1) return [{ id: generateId(), url: 'home', title: 'New Tab', history: ['home'], historyIndex: 0, loading: false }];
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) { const i = prev.findIndex((t) => t.id === tabId); setActiveTabId((prev[i - 1] || prev[i + 1])?.id || filtered[0].id); }
      return filtered;
    });
  };
  const goBack = () => setTabs((p) => p.map((t) => (t.id !== activeTabId || t.historyIndex <= 0 ? t : { ...t, url: t.history[t.historyIndex - 1], historyIndex: t.historyIndex - 1 })));
  const goForward = () => setTabs((p) => p.map((t) => (t.id !== activeTabId || t.historyIndex >= t.history.length - 1 ? t : { ...t, url: t.history[t.historyIndex + 1], historyIndex: t.historyIndex + 1 })));
  const refresh = () => { const t = tabs.find((x) => x.id === activeTabId); if (t) navigateTo(t.url); };
  const toggleBookmark = () => {
    if (activeTab.url === 'home' || activeTab.url.startsWith('search://')) return;
    setBookmarks((p) => (p.some((b) => b.url === activeTab.url) ? p.filter((b) => b.url !== activeTab.url) : [...p, { url: activeTab.url, title: activeTab.title }]));
  };

  const isBookmarked = bookmarks.some((b) => b.url === activeTab.url);
  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;
  const activeDownloads = downloads.filter((d) => !d.completed).length;

  const renderContent = () => {
    if (activeTab.loading) return <div className="h-full flex items-center justify-center"><Loader size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} /></div>;
    if (activeTab.url === 'home') return <Homepage onNavigate={navigateTo} />;
    if (activeTab.url.startsWith('search://')) return <SearchResults query={activeTab.url.replace('search://', '')} onNavigate={navigateTo} />;
    const host = activeTab.url.replace(/^https?:\/\//, '').split('/')[0];
    if (IFRAME_FRIENDLY_SITES.some((s) => host.includes(s))) return <iframe src={activeTab.url} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-forms" title={activeTab.title} />;
    return <iframe srcDoc={buildSitePage(activeTab.url, adBlockerEnabled)} className="w-full h-full border-0" title={activeTab.title} />;
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-window)' }}>
      <div className="flex items-center gap-2 px-3 shrink-0" style={{ height: 44, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={goBack} disabled={!canGoBack} className="p-1.5 rounded hover:bg-[var(--bg-hover)] disabled:opacity-30"><ArrowLeft size={16} style={{ color: 'var(--text-primary)' }} /></button>
        <button onClick={goForward} disabled={!canGoForward} className="p-1.5 rounded hover:bg-[var(--bg-hover)] disabled:opacity-30"><ArrowRight size={16} style={{ color: 'var(--text-primary)' }} /></button>
        <button onClick={refresh} className="p-1.5 rounded hover:bg-[var(--bg-hover)]"><RefreshCw size={16} style={{ color: 'var(--text-primary)' }} /></button>
        <button onClick={() => navigateTo('home')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]"><Home size={16} style={{ color: 'var(--text-primary)' }} /></button>
        <form onSubmit={(e) => { e.preventDefault(); navigateTo(addressBarValue); }} className="flex-1">
          <div className="flex items-center gap-2 px-3" style={{ height: 32, borderRadius: 16, background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
            <Lock size={14} style={{ color: 'var(--accent-success)' }} />
            <input {...stopGrab} type="text" value={addressBarValue} onChange={(e) => setAddressBarValue(e.target.value)} placeholder="Search or enter address" className="flex-1 bg-transparent outline-none" style={{ color: 'var(--text-primary)', fontSize: '13px' }} />
          </div>
        </form>
        <button onClick={toggleBookmark} className="p-1.5 rounded hover:bg-[var(--bg-hover)]"><Star size={16} style={{ color: isBookmarked ? 'var(--accent-secondary)' : 'var(--text-secondary)' }} fill={isBookmarked ? 'var(--accent-secondary)' : 'none'} /></button>
        <button onClick={() => setShowDownloads(!showDownloads)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] relative">
          <Download size={16} style={{ color: 'var(--text-primary)' }} />
          {activeDownloads > 0 && <span className="absolute -top-1 -right-1 rounded-full" style={{ width: 14, height: 14, background: 'var(--accent-primary)', color: '#fff', fontSize: 9, display: 'grid', placeItems: 'center' }}>{activeDownloads}</span>}
        </button>
      </div>

      {bookmarks.length > 0 && (
        <div className="flex items-center gap-1 px-3 shrink-0 overflow-x-auto custom-scrollbar" style={{ height: 32, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
          {bookmarks.map((bm) => (
            <button key={bm.url} onClick={() => navigateTo(bm.url)} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-hover)] shrink-0">
              <Star size={10} style={{ color: 'var(--accent-secondary)' }} fill="var(--accent-secondary)" />
              <span className="truncate max-w-[100px]" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{bm.title}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 px-3 shrink-0" style={{ height: 28, background: vpnEnabled ? 'rgba(34,197,94,0.1)' : 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setVpnEnabled(!vpnEnabled)} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-hover)]">
          <Shield size={12} style={{ color: vpnEnabled ? '#22c55e' : 'var(--text-disabled)' }} />
          <span style={{ fontSize: 11, color: vpnEnabled ? '#22c55e' : 'var(--text-disabled)' }}>VPN: {vpnEnabled ? 'ON' : 'OFF'}</span>
          {vpnEnabled && <span style={{ fontSize: 10, color: '#22c55e' }}>({fakeIP})</span>}
        </button>
        <button onClick={() => setAdBlockerEnabled(!adBlockerEnabled)} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-hover)]">
          {adBlockerEnabled ? <EyeOff size={12} style={{ color: '#ef4444' }} /> : <Eye size={12} style={{ color: 'var(--text-disabled)' }} />}
          <span style={{ fontSize: 11, color: adBlockerEnabled ? '#ef4444' : 'var(--text-disabled)' }}>Ads: {adBlockerEnabled ? 'Blocked' : 'Allowed'}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <Monitor size={12} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 11, color: 'var(--accent-primary)' }}>VM Mode: Active</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <AlertTriangle size={10} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: 9, color: '#f59e0b' }}>Simulated privacy (educational)</span>
        </div>
      </div>

      {showDownloads && downloads.length > 0 && (
        <div className="shrink-0 custom-scrollbar overflow-auto" style={{ maxHeight: 150, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)', padding: 8 }}>
          {downloads.map((d) => (
            <div key={d.id} className="flex items-center gap-2 p-2 rounded mb-1" style={{ background: 'var(--bg-window)' }}>
              <Download size={14} style={{ color: 'var(--accent-primary)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between"><span className="truncate" style={{ fontSize: 11 }}>{d.filename}</span><span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{d.completed ? '✓ Done' : `${d.progress}%`}</span></div>
                {!d.completed && <div className="h-1 rounded-full mt-1" style={{ background: 'var(--border-subtle)' }}><div className="h-full rounded-full" style={{ width: `${d.progress}%`, background: 'var(--accent-primary)' }} /></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 px-2 shrink-0 overflow-x-auto custom-scrollbar" style={{ height: 36, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
        {tabs.map((tab) => (
          <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer shrink-0" style={{ maxWidth: 180, minWidth: 100, background: tab.id === activeTabId ? 'var(--bg-window)' : 'transparent', borderTop: tab.id === activeTabId ? '2px solid var(--accent-primary)' : '2px solid transparent' }}>
            {tab.loading ? <Loader size={12} className="animate-spin" style={{ color: 'var(--accent-primary)' }} /> : <Globe size={12} style={{ color: 'var(--text-secondary)' }} />}
            <span className="truncate flex-1" style={{ fontSize: 11, color: 'var(--text-primary)' }}>{tab.title}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="hover:bg-[var(--bg-hover)] rounded-full p-0.5"><X size={12} style={{ color: 'var(--text-secondary)' }} /></button>
          </div>
        ))}
        <button onClick={addTab} className="p-1.5 rounded hover:bg-[var(--bg-hover)]"><Plus size={16} style={{ color: 'var(--text-secondary)' }} /></button>
      </div>

      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
}
