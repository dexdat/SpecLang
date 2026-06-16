/**
 * Hook for managing cascade status state and real-time updates
 * Generated from: @implementation/ui-dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import type { CascadeState, AgentStatus, FileWatcherStatus } from '../types';

interface UseCascadeStatusReturn {
  cascadeState: CascadeState;
  queueDepth: number;
  convergenceTimer: number;
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
}

const defaultCascadeState: CascadeState = {
  status: 'idle',
  queueDepth: 0,
  convergenceTimer: 0,
  lastUpdate: new Date(),
  agents: [],
  fileWatcher: {
    isWatching: false,
    filesMonitored: 0,
    lastChange: null,
  },
};

export const useCascadeStatus = (): UseCascadeStatusReturn => {
  const [cascadeState, setCascadeState] = useState<CascadeState>(defaultCascadeState);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connectToSSE = useCallback(() => {
    try {
      const eventSource = new EventSource('/api/sse/cascade');

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setCascadeState((prev) => ({
            ...prev,
            ...data,
            lastUpdate: new Date(),
          }));
        } catch (parseError) {
          console.error('Failed to parse SSE message:', parseError);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        setError(new Error('SSE connection failed'));
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      return () => {};
    }
  }, []);

  useEffect(() => {
    const cleanup = connectToSSE();
    return cleanup;
  }, [connectToSSE]);

  // Poll for status if SSE is not available
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/cascade/status');
        if (response.ok) {
          const data = await response.json() as Partial<CascadeState>;
          setCascadeState((prev) => ({
            ...prev,
            ...(data as object),
            lastUpdate: new Date(),
          }));
        }
      } catch {
        // Silently fail - SSE is primary
      }
    };

    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const reconnect = useCallback(() => {
    setError(null);
    connectToSSE();
  }, [connectToSSE]);

  return {
    cascadeState,
    queueDepth: cascadeState.queueDepth,
    convergenceTimer: cascadeState.convergenceTimer,
    isConnected,
    error,
    reconnect,
  };
};

export const useAgentStatus = (agentId?: string) => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const url = agentId ? `/api/agents/${agentId}` : '/api/agents';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setAgents(Array.isArray(data) ? data : [data]);
        }
      } catch (err) {
        console.error('Failed to fetch agent status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 3000);
    return () => clearInterval(interval);
  }, [agentId]);

  return { agents, loading };
};

export const useFileWatcherStatus = () => {
  const [fileWatcher, setFileWatcher] = useState<FileWatcherStatus>({
    isWatching: false,
    filesMonitored: 0,
    lastChange: null,
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/file-watcher/status');
        if (response.ok) {
          const data = await response.json() as Partial<FileWatcherStatus>;
          setFileWatcher({
            isWatching: data.isWatching ?? false,
            filesMonitored: data.filesMonitored ?? 0,
            lastChange: data.lastChange ? new Date(data.lastChange) : null,
          });
        }
      } catch {
        // File watcher may not be running
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return fileWatcher;
};
