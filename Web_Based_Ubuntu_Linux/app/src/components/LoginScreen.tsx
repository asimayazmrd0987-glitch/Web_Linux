// ============================================================
// LoginScreen — Blurred wallpaper + centered login card
// ============================================================

import { useState, useCallback, memo } from 'react';
import { LogOut, Moon, Power, User } from 'lucide-react';
import { useOS } from '@/hooks/useOSStore';

const LoginScreen = memo(function LoginScreen() {
  const { dispatch } = useOS();
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState(false);

  const handleUnlock = useCallback(() => {
    setIsUnlocking(true);
    setError(false);
    setTimeout(() => {
      dispatch({ type: 'LOGIN', isGuest: false });
    }, 800);
  }, [dispatch]);

  const handleGuest = useCallback(() => {
    dispatch({ type: 'LOGIN', isGuest: true });
  }, [dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleUnlock();
    },
    [handleUnlock]
  );

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{
        backgroundImage: 'url(/wallpaper-default.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blur overlay */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(0,0,0,0.4)',
        }}
      />

      {/* Login card */}
      <div
        className="relative z-10 w-[360px] rounded-[20px] p-10 flex flex-col items-center"
        style={{
          background: 'rgba(45,45,45,0.85)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          animation: 'loginEnter 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center border-[3px] border-[#7C4DFF] mb-4"
          style={{ background: 'linear-gradient(135deg, #7C4DFF, #4A148C)' }}
        >
          <User size={36} className="text-white" />
        </div>

        {/* Username */}
        <h2 className="text-xl font-semibold text-[#E0E0E0]">User</h2>

        {/* Password input */}
        <div className="w-full mt-6 relative">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            className="w-full h-11 rounded-full px-5 text-sm text-[#E0E0E0] outline-none transition-all"
            style={{
              background: '#1A1A1A',
              border: `1px solid ${error ? '#F44336' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: error ? '0 0 0 3px rgba(244,67,54,0.15)' : undefined,
            }}
            onFocus={(e) => {
              if (!error) e.currentTarget.style.borderColor = '#7C4DFF';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,77,255,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? '#F44336' : 'rgba(255,255,255,0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Unlock button */}
        <button
          onClick={handleUnlock}
          disabled={isUnlocking}
          className="w-full h-11 rounded-full mt-4 text-sm font-semibold text-white transition-colors"
          style={{
            background: isUnlocking ? '#673AB7' : '#7C4DFF',
            transform: 'scale(1)',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => { if (!isUnlocking) e.currentTarget.style.background = '#9575FF'; }}
          onMouseLeave={(e) => { if (!isUnlocking) e.currentTarget.style.background = '#7C4DFF'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {isUnlocking ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Unlocking...</span>
            </div>
          ) : (
            'Unlock'
          )}
        </button>

        {/* Guest login */}
        <button
          onClick={handleGuest}
          className="mt-3 text-sm text-[#7C4DFF] hover:text-[#9575FF] transition-colors"
        >
          Log in as Guest
        </button>

        {/* Power options */}
        <div className="flex items-center gap-4 mt-6 pt-4 w-full justify-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9E9E9E] hover:text-[#E0E0E0] hover:bg-white/[0.06] transition-all">
            <Power size={16} />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9E9E9E] hover:text-[#E0E0E0] hover:bg-white/[0.06] transition-all">
            <Moon size={16} />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9E9E9E] hover:text-[#E0E0E0] hover:bg-white/[0.06] transition-all">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes loginEnter {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
      `}</style>
    </div>
  );
});

export default LoginScreen;
