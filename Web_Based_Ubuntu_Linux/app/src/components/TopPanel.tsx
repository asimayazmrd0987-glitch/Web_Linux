// ============================================================
// TopPanel — Activities button, clock, system tray (GNOME Quick Settings)
// ============================================================

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { format } from 'date-fns';
import { Wifi, Volume2, Battery, Power, Lock, LogOut, Settings, Sun, Moon, VolumeX } from 'lucide-react';
import { useOS } from '@/hooks/useOSStore';

const TopPanel = memo(function TopPanel() {
  const { state, dispatch } = useOS();
  const [time, setTime] = useState(new Date());
  const [sysMenuOpen, setSysMenuOpen] = useState(false);
  const [volume, setVolume] = useState(80);
  const [brightness, setBrightness] = useState(100);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sysMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSysMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sysMenuOpen]);

  const handleActivities = useCallback(() => {
    dispatch({ type: 'TOGGLE_APP_LAUNCHER' });
  }, [dispatch]);

  const handleClockClick = useCallback(() => {
    dispatch({ type: 'TOGGLE_NOTIFICATION_CENTER' });
  }, [dispatch]);

  const handleToggleTheme = useCallback(() => {
    dispatch({ type: 'TOGGLE_THEME' });
  }, [dispatch]);

  const formattedTime = format(time, 'EEE h:mm a');
  const formattedDate = format(time, 'EEEE, MMMM d, yyyy');

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-2 text-xs font-medium select-none"
      style={{
        height: 28,
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Left: Activities */}
      <div className="flex items-center flex-shrink-0">
        <button
          onClick={handleActivities}
          className="h-6 px-2.5 rounded hover:bg-[var(--bg-hover)] transition-colors text-xs font-medium"
        >
          Activities
        </button>
      </div>

      {/* Center: Clock — FIXED: removed conflicting `relative` class */}
      <button
        onClick={handleClockClick}
        className="absolute left-1/2 -translate-x-1/2 h-6 px-2.5 rounded hover:bg-[var(--bg-hover)] transition-colors text-xs font-medium group whitespace-nowrap z-[201]"
      >
        <span>{formattedTime}</span>
        {/* Tooltip (still anchored correctly: an absolutely positioned
            button is the containing block for its absolute children) */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded bg-[var(--bg-tooltip)] text-[var(--text-primary)] text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[5000]">
          {formattedDate}
        </div>
      </button>

      {/* Right: System Controls */}
      <div className="flex items-center gap-2 flex-shrink-0 pr-1">
        {/* Unified System Controls Pill */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setSysMenuOpen(!sysMenuOpen)}
            className="h-6 px-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 flex-shrink-0"
            style={{
              background: sysMenuOpen ? 'var(--bg-active)' : 'transparent',
            }}
            title="System Menu"
          >
            <Wifi size={13} className={`flex-shrink-0 ${wifiEnabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-disabled)]'}`} />
            {volume === 0 ? <VolumeX size={13} className="flex-shrink-0" /> : <Volume2 size={13} className="flex-shrink-0" />}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Battery size={13} className="text-emerald-400 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-emerald-400 flex-shrink-0">100%</span>
            </div>
          </button>

          {/* Quick Settings Dropdown */}
          {sysMenuOpen && (
            <div
              className="absolute top-full right-0 mt-1.5 p-3 rounded-2xl z-[5000] shadow-2xl flex flex-col gap-3"
              style={{
                background: 'rgba(30, 30, 32, 0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                width: 280,
                color: '#FFFFFF',
                animation: 'menuAppear 150ms cubic-bezier(0, 0, 0.2, 1)',
              }}
            >
              {/* User Profile Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-inner flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #E95420, #77216F)' }}
                  >
                    U
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white truncate">{state.auth.userName}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                      100% • Fully Charged
                    </span>
                  </div>
                </div>
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
                  onClick={() => {
                    setSysMenuOpen(false);
                    dispatch({ type: 'OPEN_WINDOW', appId: 'settings' });
                  }}
                  title="Settings"
                >
                  <Settings size={15} className="flex-shrink-0" />
                </button>
              </div>

              {/* Quick Toggle Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setWifiEnabled(!wifiEnabled)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl transition-all flex-shrink-0 ${
                    wifiEnabled ? 'bg-orange-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Wifi size={16} className="flex-shrink-0" />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[11px] font-medium leading-none truncate">Wi-Fi</span>
                    <span className="text-[9px] opacity-75 truncate">{wifiEnabled ? 'Ubuntu_5G' : 'Off'}</span>
                  </div>
                </button>

                <button
                  onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl transition-all flex-shrink-0 ${
                    bluetoothEnabled ? 'bg-orange-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm flex-shrink-0">🔵</span>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[11px] font-medium leading-none truncate">Bluetooth</span>
                    <span className="text-[9px] opacity-75 truncate">{bluetoothEnabled ? 'On' : 'Off'}</span>
                  </div>
                </button>

                <button
                  onClick={handleToggleTheme}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all flex-shrink-0"
                >
                  {state.theme.mode === 'dark' ? <Moon size={16} className="text-purple-400 flex-shrink-0" /> : <Sun size={16} className="text-amber-400 flex-shrink-0" />}
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[11px] font-medium leading-none truncate">Style</span>
                    <span className="text-[9px] opacity-75 truncate capitalize">{state.theme.mode} Mode</span>
                  </div>
                </button>

                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 text-white/80 flex-shrink-0">
                  <Battery size={16} className="text-emerald-400 flex-shrink-0" />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[11px] font-medium leading-none truncate">Power</span>
                    <span className="text-[9px] opacity-75 truncate">Balanced</span>
                  </div>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 px-1 flex-shrink-0">
                <button
                  onClick={() => setVolume(volume === 0 ? 80 : 0)}
                  className="text-white/70 hover:text-white flex-shrink-0"
                >
                  {volume === 0 ? <VolumeX size={15} className="flex-shrink-0" /> : <Volume2 size={15} className="flex-shrink-0" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-orange-500 min-w-0"
                />
                <span className="text-[10px] text-white/60 w-6 text-right flex-shrink-0">{volume}%</span>
              </div>

              {/* Brightness Slider */}
              <div className="flex items-center gap-2 px-1 flex-shrink-0">
                <Sun size={15} className="text-white/70 flex-shrink-0" />
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-orange-500 min-w-0"
                />
                <span className="text-[10px] text-white/60 w-6 text-right flex-shrink-0">{brightness}%</span>
              </div>

              {/* Power Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-shrink-0">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-xs text-white transition-colors flex-shrink-0"
                  onClick={() => {
                    setSysMenuOpen(false);
                    dispatch({ type: 'LOGOUT' });
                  }}
                >
                  <Lock size={13} className="flex-shrink-0" />
                  Lock
                </button>

                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-xs text-white transition-colors flex-shrink-0"
                  onClick={() => {
                    setSysMenuOpen(false);
                    dispatch({ type: 'LOGOUT' });
                  }}
                >
                  <LogOut size={13} className="flex-shrink-0" />
                  Log Out
                </button>

                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-xs font-semibold text-white transition-colors flex-shrink-0"
                  onClick={() => setSysMenuOpen(false)}
                >
                  <Power size={13} className="flex-shrink-0" />
                  Power Off
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separate Power Button (Far Right) */}
        <button
          onClick={() => {
            // TODO: Once you add 'SHUTDOWN' to useOSStore, uncomment:
            // dispatch({ type: 'SHUTDOWN' });
            console.log("Power Off / Shutdown triggered");
          }}
          className="h-6 w-6 rounded-full hover:bg-red-500/20 hover:text-red-400 text-[var(--text-primary)] transition-colors flex items-center justify-center flex-shrink-0"
          title="Power Off"
        >
          <Power size={13} className="flex-shrink-0" />
        </button>
      </div>

      <style>{`
        @keyframes menuAppear {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
});

export default TopPanel;
