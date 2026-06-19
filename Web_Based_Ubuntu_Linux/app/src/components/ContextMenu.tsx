// ============================================================
// ContextMenu — Dynamic right-click menu with edge detection
// ============================================================

import { useEffect, useRef, memo } from 'react';
import { useOS } from '@/hooks/useOSStore';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComp = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  return IconComp ? <IconComp {...props} /> : null;
};

const ContextMenu = memo(function ContextMenu() {
  const { state, dispatch } = useOS();
  const menuRef = useRef<HTMLDivElement>(null);
  const { contextMenu } = state;

  useEffect(() => {
    if (!contextMenu.visible) return;
    const handleClick = () => dispatch({ type: 'HIDE_CONTEXT_MENU' });
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClick, { once: true });
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClick);
    };
  }, [contextMenu.visible, dispatch]);

  // Edge detection
  let x = contextMenu.x;
  let y = contextMenu.y;
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (x + rect.width > vw) x = vw - rect.width - 8;
    if (y + rect.height > vh) y = vh - rect.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
  }

  if (!contextMenu.visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[4000] py-1.5 select-none"
      style={{
        left: x,
        top: y,
        minWidth: 180,
        maxWidth: 280,
        background: 'var(--bg-context-menu)',
        borderRadius: 8,
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'ctxAppear 120ms cubic-bezier(0, 0, 0.2, 1)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.items.map((item) => {
        if (item.divider) {
          return (
            <div
              key={item.id}
              className="my-1 mx-2"
              style={{ height: 1, background: 'var(--border-subtle)' }}
            />
          );
        }
        return (
          <button
            key={item.id}
            className="w-full flex items-center gap-2.5 px-3 h-8 text-sm transition-colors"
            style={{
              color: item.disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
              borderRadius: 4,
              margin: '0 4px',
              width: 'calc(100% - 8px)',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={() => {
              if (item.disabled) return;
              dispatch({ type: 'HIDE_CONTEXT_MENU' });
              // Action dispatch handled by parent based on action string
              handleMenuAction(item.action, state, dispatch);
            }}
          >
            {item.icon && (
              <DynamicIcon name={item.icon} size={16} className="shrink-0" />
            )}
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-[var(--text-disabled)] ml-2">{item.shortcut}</span>
            )}
          </button>
        );
      })}

      <style>{`
        @keyframes ctxAppear {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
});

function handleMenuAction(action: string, _state: unknown, dispatch: React.Dispatch<import('@/types').OSAction>) {
  const [cmd, ...args] = action.split(':');
  switch (cmd) {
    case 'OPEN_APP': {
      if (args[0]) dispatch({ type: 'OPEN_WINDOW', appId: args[0] });
      break;
    }
    case 'NEW_FOLDER':
    case 'NEW_DOCUMENT':
    case 'OPEN_TERMINAL':
    case 'CHANGE_BG':
    case 'ARRANGE_ICONS':
    case 'SHOW_SETTINGS':
    case 'PIN_DOCK':
    case 'UNPIN_DOCK':
    case 'QUIT_APP': {
      // Placeholder: will be handled by the component that opens the menu
      break;
    }
    case 'MINIMIZE_ALL': {
      dispatch({ type: 'MINIMIZE_ALL' });
      break;
    }
    default:
      break;
  }
}

export default ContextMenu;
