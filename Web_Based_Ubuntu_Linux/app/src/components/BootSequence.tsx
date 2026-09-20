// ============================================================
// BootSequence — 4-phase animated boot
// ============================================================

import { useEffect, useState, memo } from 'react';

const PHASE_LOGO = 0;
const PHASE_LOADING = 1;
const PHASE_TRANSITION = 2;
const PHASE_DESKTOP = 3;
const PHASE_DONE = 4;

const BootSequence = memo(function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<number>(PHASE_LOGO);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading system...');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        setPhase(PHASE_LOADING);
      }, 800)
    );

    timers.push(
      setTimeout(() => {
        let p = 0;
        const interval = setInterval(() => {
          p += Math.random() * 15 + 5;
          if (p >= 100) {
            p = 100;
            clearInterval(interval);
          }
          setProgress(p);
          if (p > 30) setLoadingText('Initializing services...');
          if (p > 70) setLoadingText('Preparing desktop...');
        }, 120);
        timers.push(interval as unknown as ReturnType<typeof setTimeout>);
      }, 800)
    );

    timers.push(
      setTimeout(() => {
        setPhase(PHASE_TRANSITION);
      }, 2600)
    );

    timers.push(
      setTimeout(() => {
        setPhase(PHASE_DESKTOP);
      }, 3400)
    );

    timers.push(
      setTimeout(() => {
        setPhase(PHASE_DONE);
        onComplete();
      }, 4200)
    );

    return () => timers.forEach((t) => clearTimeout(t));
  }, [onComplete]);

  if (phase === PHASE_DONE) return null;

  const showContent = phase === PHASE_LOGO || phase === PHASE_LOADING || phase === PHASE_TRANSITION;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{
        transition: 'clip-path 800ms cubic-bezier(0, 0, 0.2, 1)',
        clipPath:
          phase === PHASE_DESKTOP || phase === PHASE_TRANSITION
            ? phase === PHASE_DESKTOP
              ? 'circle(150% at 50% 50%)'
              : 'circle(0% at 50% 50%)'
            : undefined,
      }}
    >
      {phase === PHASE_TRANSITION && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/wallpaper-default.jpg)' }}
        />
      )}

      {showContent && (
        <div
          className="flex flex-col items-center justify-center relative z-10"
          style={{
            opacity: phase === PHASE_TRANSITION ? 0 : 1,
            transition: 'opacity 400ms ease',
          }}
        >
          <div
            className="mb-4"
            style={{
              opacity: phase >= PHASE_LOGO ? 1 : 0,
              transform: `scale(${phase >= PHASE_LOGO ? 1 : 0.8})`,
              filter: phase >= PHASE_LOGO ? 'blur(0px)' : 'blur(8px)',
              transition: 'all 600ms cubic-bezier(0, 0, 0.2, 1)',
              animation: phase === PHASE_LOADING ? 'pulse 1.6s ease-in-out infinite' : undefined,
            }}
          >
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="48" cy="48" r="46" fill="#7C4DFF" opacity="0.9" />
              <circle cx="34" cy="40" r="16" fill="#FF9800" opacity="0.85" />
              <circle cx="58" cy="56" r="14" fill="#E91E63" opacity="0.7" />
            </svg>
          </div>

          <h1
            className="text-[28px] font-bold tracking-[0.1em] text-[#E0E0E0] mb-6"
            style={{
              opacity: phase >= PHASE_LOGO ? 1 : 0,
              transform: `translateY(${phase >= PHASE_LOGO ? 0 : 10}px)`,
              transition: 'all 400ms cubic-bezier(0, 0, 0.2, 1) 400ms',
            }}
          >
            UbuntuOS
          </h1>

          {phase >= PHASE_LOADING && (
            <div
              className="w-[200px] h-[3px] rounded-full overflow-hidden mb-3"
              style={{
                background: 'rgba(124,77,255,0.2)',
                opacity: phase >= PHASE_LOADING ? 1 : 0,
                transition: 'opacity 200ms ease',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: '#7C4DFF',
                  transition: 'width 100ms linear',
                }}
              />
            </div>
          )}

          {phase >= PHASE_LOADING && (
            <p
              className="text-[10px] text-[#9E9E9E] tracking-wider"
              style={{
                opacity: phase >= PHASE_LOADING ? 1 : 0,
                transition: 'opacity 300ms ease',
              }}
            >
              {loadingText}
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
});

export default BootSequence;
