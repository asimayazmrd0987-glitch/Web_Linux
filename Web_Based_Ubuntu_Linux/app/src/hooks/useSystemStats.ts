import { useEffect, useState } from 'react';

// ============================================================
// Minimal typings for APIs not present in the TS DOM lib
// ============================================================
interface BatteryManager extends EventTarget {
  readonly level: number;          // 0.0 – 1.0
  readonly charging: boolean;
  readonly chargingTime: number;
  readonly dischargingTime: number;
}

interface NetworkInformation extends EventTarget {
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  readonly downlink?: number;      // Mbps
  readonly rtt?: number;           // ms
}

interface NavigatorWithExtras extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
  connection?: NetworkInformation;
}

// ============================================================
// useBattery — real battery level & charging state
// ============================================================
export interface BatteryState {
  supported: boolean;
  percent: number | null;   // 0 – 100
  charging: boolean;
}

export function useBattery(): BatteryState {
  const [state, setState] = useState<BatteryState>({
    supported: true,
    percent: null,
    charging: false,
  });

  useEffect(() => {
    const nav = navigator as NavigatorWithExtras;
    if (typeof nav.getBattery !== 'function') {
      setState({ supported: false, percent: null, charging: false });
      return;
    }

    let cancelled = false;
    let battery: BatteryManager | null = null;

    const update = () => {
      if (cancelled || !battery) return;
      setState({
        supported: true,
        percent: Math.round(battery.level * 100),
        charging: battery.charging,
      });
    };

    nav.getBattery()
      .then((b) => {
        if (cancelled) return;
        battery = b;
        update();
        b.addEventListener('levelchange', update);
        b.addEventListener('chargingchange', update);
      })
      .catch(() => {
        if (!cancelled) setState({ supported: false, percent: null, charging: false });
      });

    return () => {
      cancelled = true;
      if (battery) {
        battery.removeEventListener('levelchange', update);
        battery.removeEventListener('chargingchange', update);
      }
    };
  }, []);

  return state;
}

// ============================================================
// useNetwork — real connectivity + approximated signal bars
// ============================================================
export interface NetworkState {
  online: boolean;
  effectiveType: string;
  downlink: number | null;   // Mbps
  signal: 0 | 1 | 2 | 3;     // bar count
}

function mapSignal(online: boolean, effectiveType?: string): 0 | 1 | 2 | 3 {
  if (!online) return 0;
  switch (effectiveType) {
    case '4g': return 3;
    case '3g': return 2;
    case '2g':
    case 'slow-2g': return 1;
    default: return 3; // online but API unavailable → assume strong link
  }
}

export function useNetwork(): NetworkState {
  const read = (): NetworkState => {
    const nav = navigator as NavigatorWithExtras;
    const online = nav.onLine;
    return {
      online,
      effectiveType: nav.connection?.effectiveType ?? 'unknown',
      downlink: nav.connection?.downlink ?? null,
      signal: mapSignal(online, nav.connection?.effectiveType),
    };
  };

  const [state, setState] = useState<NetworkState>(read);

  useEffect(() => {
    const nav = navigator as NavigatorWithExtras;
    const update = () => setState(read());

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    nav.connection?.addEventListener('change', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      nav.connection?.removeEventListener('change', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
