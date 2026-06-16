import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpecInfo {
  filePath: string;
  specId?: string;
  version?: string;
  layer?: number;
  ownedBy?: string;
  status?: string;
  targetLang?: string;
  tags?: string[];
  hasImplementation: boolean;
  hasHeader: boolean;
}

export interface HealthMetric {
  name: string;
  value: number | string;
  status: 'good' | 'warn' | 'critical';
}

export interface HealthReport {
  totalSpecs: number;
  withHeader: number;
  withImplementation: number;
  missingHeader: number;
  noId: number;
  noVersion: number;
  byLayer: Record<number, number>;
  byStatus: Record<string, number>;
  byOwner: Record<string, number>;
  metrics: HealthMetric[];
}

export type CascadeState = 'idle' | 'running' | 'paused' | 'finalizing';

export interface DashboardState {
  health: HealthReport | null;
  specs: SpecInfo[];
  cascadeStatus: CascadeState;
  cascadeDepth: number;
  cascadeCurrentFile: string | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

export interface DashboardActions {
  refreshHealth: () => Promise<void>;
  triggerCascade: () => void;
  pauseCascade: () => void;
  resumeCascade: () => void;
  abortCascade: () => void;
  finalizeCascade: () => void;
}

const API_BASE = '/api';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useDashboardState(): DashboardState & DashboardActions {
  const [state, setState] = useState<DashboardState>({
    health: null,
    specs: [],
    cascadeStatus: 'idle',
    cascadeDepth: 0,
    cascadeCurrentFile: null,
    isLoading: true,
    error: null,
    lastRefresh: null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshHealth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [health, specs, cascade] = await Promise.all([
        fetchJSON<HealthReport>(`${API_BASE}/health`).catch(() => null),
        fetchJSON<SpecInfo[]>(`${API_BASE}/specs`).catch(() => []),
        fetchJSON<CascadeState & { depth?: number; currentFile?: string | null }>(`${API_BASE}/cascade`).catch(() => null),
      ]);

      if (!health && specs.length > 0) {
        const totalSpecs = specs.length;
        const withHeader = specs.filter(s => s.hasHeader).length;
        const withImpl = specs.filter(s => s.hasImplementation).length;
        const computedHealth: HealthReport = {
          totalSpecs,
          withHeader,
          withImplementation: withImpl,
          missingHeader: specs.filter(s => !s.hasHeader).length,
          noId: specs.filter(s => s.hasHeader && !s.specId).length,
          noVersion: specs.filter(s => s.hasHeader && !s.version).length,
          byLayer: specs.reduce<Record<number, number>>((acc, s) => {
            if (s.layer !== undefined) acc[s.layer] = (acc[s.layer] || 0) + 1;
            return acc;
          }, {}),
          byStatus: specs.reduce<Record<string, number>>((acc, s) => {
            if (s.status) acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
          }, {}),
          byOwner: specs.reduce<Record<string, number>>((acc, s) => {
            if (s.ownedBy) acc[s.ownedBy] = (acc[s.ownedBy] || 0) + 1;
            return acc;
          }, {}),
          metrics: [
            { name: 'Total Specs', value: totalSpecs, status: totalSpecs > 0 ? 'good' : 'critical' },
            { name: 'With Header', value: withHeader, status: withHeader === totalSpecs ? 'good' : 'warn' },
            { name: 'With Implementation', value: withImpl, status: 'good' },
            { name: 'Implementation Ratio', value: `${Math.round((withImpl / Math.max(totalSpecs, 1)) * 100)}%`, status: 'good' },
          ],
        };
        setState(prev => ({
          ...prev,
          health: computedHealth,
          specs,
          cascadeStatus: (cascade?.status as CascadeState) ?? prev.cascadeStatus,
          cascadeDepth: cascade?.depth ?? prev.cascadeDepth,
          cascadeCurrentFile: cascade?.currentFile ?? prev.cascadeCurrentFile,
          isLoading: false,
          lastRefresh: new Date(),
        }));
      } else {
        setState(prev => ({
          ...prev,
          health: health ?? prev.health,
          specs,
          cascadeStatus: (cascade?.status as CascadeState) ?? prev.cascadeStatus,
          cascadeDepth: cascade?.depth ?? prev.cascadeDepth,
          cascadeCurrentFile: cascade?.currentFile ?? prev.cascadeCurrentFile,
          isLoading: false,
          lastRefresh: new Date(),
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (err as Error).message,
        lastRefresh: new Date(),
      }));
    }
  }, []);

  const triggerCascade = useCallback(() => {
    fetch(`${API_BASE}/cascade/trigger`, { method: 'POST' }).catch(() => {});
    setState(prev => ({
      ...prev,
      cascadeStatus: 'running',
      cascadeDepth: 0,
      cascadeCurrentFile: null,
    }));
  }, []);

  const pauseCascade = useCallback(() => {
    fetch(`${API_BASE}/cascade/pause`, { method: 'POST' }).catch(() => {});
    setState(prev => ({ ...prev, cascadeStatus: 'paused' }));
  }, []);

  const resumeCascade = useCallback(() => {
    fetch(`${API_BASE}/cascade/resume`, { method: 'POST' }).catch(() => {});
    setState(prev => ({ ...prev, cascadeStatus: 'running' }));
  }, []);

  const abortCascade = useCallback(() => {
    fetch(`${API_BASE}/cascade/abort`, { method: 'POST' }).catch(() => {});
    setState(prev => ({
      ...prev,
      cascadeStatus: 'idle',
      cascadeDepth: 0,
      cascadeCurrentFile: null,
    }));
  }, []);

  const finalizeCascade = useCallback(() => {
    fetch(`${API_BASE}/cascade/finalize`, { method: 'POST' }).catch(() => {});
    setState(prev => ({
      ...prev,
      cascadeStatus: 'finalizing',
    }));
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        cascadeStatus: 'idle',
        cascadeDepth: 0,
        cascadeCurrentFile: null,
      }));
      refreshHealth();
    }, 1500);
  }, [refreshHealth]);

  useEffect(() => {
    refreshHealth();
    timerRef.current = setInterval(refreshHealth, 30000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshHealth]);

  useEffect(() => {
    if (state.cascadeStatus !== 'running') return;
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.cascadeStatus !== 'running') return prev;
        const newDepth = prev.cascadeDepth + 1;
        if (newDepth >= 8) {
          return {
            ...prev,
            cascadeStatus: 'idle' as CascadeState,
            cascadeDepth: 0,
            cascadeCurrentFile: null,
          };
        }
        return { ...prev, cascadeDepth: newDepth };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [state.cascadeStatus]);

  return {
    ...state,
    refreshHealth,
    triggerCascade,
    pauseCascade,
    resumeCascade,
    abortCascade,
    finalizeCascade,
  };
}

export default useDashboardState;
