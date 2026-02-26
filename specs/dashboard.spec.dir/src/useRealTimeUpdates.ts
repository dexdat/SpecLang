// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-real-time-updates

/**
 * useRealTimeUpdates Hook
 * 
 * React hook for handling real-time updates via SSE.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SSEEvent {
  type: string;
  data: unknown;
  timestamp: number;
}

export interface Action {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

export interface EventHandlers {
  'file.changed'?: (data: unknown) => void;
  'agent.spawned'?: (data: unknown) => void;
  'agent.completed'?: (data: unknown) => void;
  'cascade.converged'?: (data: unknown) => void;
  'cascade.started'?: (data: unknown) => void;
  'cascade.paused'?: (data: unknown) => void;
  'cascade.aborted'?: (data: unknown) => void;
  'cascade.error'?: (data: unknown) => void;
  'command.executed'?: (data: unknown) => void;
  'agent.error'?: (data: unknown) => void;
  [key: string]: ((data: unknown) => void) | undefined;
}

export interface UseRealTimeUpdatesOptions {
  eventsUrl?: string;
  onToast?: (message: string, type?: 'info' | 'error' | 'success') => void;
  debounceDelay?: number;
  maxEvents?: number;
  autoConnect?: boolean;
}

export interface UseRealTimeUpdatesReturn {
  // State
  events: SSEEvent[];
  isOnline: boolean;
  isUpdating: boolean;
  actionQueue: Action[];
  
  // Connection
  connect: () => void;
  disconnect: () => void;
  
  // Handlers
  setHandlers: (handlers: Partial<EventHandlers>) => void;
  
  // Updates
  optimisticUpdate: <T>(action: () => Promise<T>, optimistic: () => void, rollback: () => void) => Promise<void>;
  queueAction: (action: Action) => void;
  flushQueue: () => Promise<void>;
  clearEvents: () => void;
  scheduleUpdate: (update: () => void) => void;
  
  // Utility
  getEventsByType: (type: string) => SSEEvent[];
  getLatestEvent: (type: string) => SSEEvent | null;
}

// Default handlers that update stores
const defaultHandlers: EventHandlers = {
  'file.changed': (data) => {
    console.log('[SSE] File changed:', data);
    // In real implementation: fileTreeStore.refresh();
  },
  'agent.spawned': (data) => {
    console.log('[SSE] Agent spawned:', data);
    // In real implementation: agentMonitor.addAgent(data);
  },
  'agent.completed': (data) => {
    console.log('[SSE] Agent completed:', data);
    // In real implementation: agentMonitor.updateAgent(data);
  },
  'cascade.converged': (data) => {
    console.log('[SSE] Cascade converged:', data);
    // In real implementation: dashboard.refresh();
  },
  'cascade.started': (data) => {
    console.log('[SSE] Cascade started:', data);
  },
  'cascade.paused': (data) => {
    console.log('[SSE] Cascade paused:', data);
  },
  'cascade.aborted': (data) => {
    console.log('[SSE] Cascade aborted:', data);
  },
  'cascade.error': (data) => {
    console.log('[SSE] Cascade error:', data);
  },
  'command.executed': (data) => {
    console.log('[SSE] Command executed:', data);
  }
};

/**
 * useRealTimeUpdates React hook
 */
export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}): UseRealTimeUpdatesReturn {
  const {
    eventsUrl = '/events',
    onToast,
    debounceDelay = 100,
    maxEvents = 100,
    autoConnect = true
  } = options;

  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionQueue, setActionQueue] = useState<Action[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handlersRef = useRef<EventHandlers>(defaultHandlers);

  // Toast notification
  const toast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (onToast) {
      onToast(message, type);
    }
  }, [onToast]);

  // Add event to state
  const addEvent = useCallback((event: SSEEvent) => {
    setEvents(prev => [event, ...prev].slice(0, maxEvents));
  }, [maxEvents]);

  // Schedule update with debouncing
  const scheduleUpdate = useCallback((update: () => void) => {
    setIsUpdating(true);
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      update();
      setIsUpdating(false);
    }, debounceDelay);
  }, [debounceDelay]);

  // Reconnect to SSE
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('[SSE] Attempting to reconnect...');
      connect();
    }, 5000);
  }, []);

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const source = new EventSource(eventsUrl);
      eventSourceRef.current = source;

      source.onopen = () => {
        console.log('[SSE] Connected');
        setIsOnline(true);
      };

      source.onerror = () => {
        console.error('[SSE] Connection error');
        setIsOnline(false);
        source.close();
        reconnect();
      };

      // Set up event handlers
      Object.entries(handlersRef.current).forEach(([type, handler]) => {
        if (!handler) return;
        
        source.addEventListener(type, (e) => {
          try {
            const data = JSON.parse((e as MessageEvent).data);
            handler(data);
            addEvent({ type, data, timestamp: Date.now() });
          } catch (error) {
            console.error(`[SSE] Error parsing ${type}:`, error);
          }
        });
      });
    } catch (error) {
      console.error('[SSE] Failed to connect:', error);
      setIsOnline(false);
    }
  }, [eventsUrl, addEvent, reconnect]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsOnline(false);
  }, []);

  // Set custom event handlers
  const setHandlers = useCallback((handlers: Partial<EventHandlers>) => {
    handlersRef.current = { ...handlersRef.current, ...handlers };
  }, []);

  // Optimistic update with rollback
  const optimisticUpdate = useCallback(async <T>(
    action: () => Promise<T>,
    optimistic: () => void,
    rollback: () => void
  ): Promise<void> => {
    optimistic();
    
    try {
      await action();
      // Success - optimistic update stays
    } catch (error) {
      rollback();
      toast(`Action failed, rolled back: ${error}`, 'error');
    }
  }, [toast]);

  // Execute or queue action
  const queueAction = useCallback((action: Action) => {
    if (!isOnline) {
      setActionQueue(prev => [...prev, action]);
      return;
    }
    
    executeAction(action);
  }, [isOnline]);

  // Execute a queued action
  const executeAction = useCallback(async (action: Action) => {
    console.log('[Action] Executing:', action.type, action.payload);
    // In real implementation: await mcpClient.call(action.type, action.payload);
  }, []);

  // Flush queued actions
  const flushQueue = useCallback(async () => {
    const queue = [...actionQueue];
    
    for (const action of queue) {
      await executeAction(action);
    }
    
    setActionQueue([]);
  }, [actionQueue, executeAction]);

  // Clear event history
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Get events by type
  const getEventsByType = useCallback((type: string): SSEEvent[] => {
    return events.filter(e => e.type === type);
  }, [events]);

  // Get latest event of type
  const getLatestEvent = useCallback((type: string): SSEEvent | null => {
    return events.find(e => e.type === type) || null;
  }, [events]);

  // Set up SSE connection
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoConnect, connect]);

  // Flush queue when coming back online
  useEffect(() => {
    if (isOnline && actionQueue.length > 0) {
      flushQueue();
    }
  }, [isOnline, actionQueue.length, flushQueue]);

  return {
    // State
    events,
    isOnline,
    isUpdating,
    actionQueue,
    
    // Connection
    connect,
    disconnect,
    
    // Handlers
    setHandlers,
    
    // Updates
    optimisticUpdate,
    queueAction,
    flushQueue,
    clearEvents,
    scheduleUpdate,
    
    // Utility
    getEventsByType,
    getLatestEvent
  };
}

export default useRealTimeUpdates;
