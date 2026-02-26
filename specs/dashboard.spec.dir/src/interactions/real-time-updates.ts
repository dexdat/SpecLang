/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-real-time-updates

/**
 * Real-Time Updates Handler
 * 
 * Handles SSE connections, event processing, optimistic updates,
 * debouncing, and offline queue management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Types
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

export interface RealTimeUpdatesState {
  events: SSEEvent[];
  isOnline: boolean;
  isUpdating: boolean;
  actionQueue: Action[];
}

export interface RealTimeUpdatesOptions {
  eventsUrl?: string;
  onToast?: (message: string, type?: 'info' | 'error' | 'success') => void;
  debounceDelay?: number;
  maxEvents?: number;
}

/**
 * Event handlers for different SSE event types
 */
export interface EventHandlers {
  'file.changed'?: (data: unknown) => void;
  'agent.spawned'?: (data: unknown) => void;
  'agent.completed'?: (data: unknown) => void;
  'cascade.converged'?: (data: unknown) => void;
  'command.executed'?: (data: unknown) => void;
  'cascade.error'?: (data: unknown) => void;
  'agent.error'?: (data: unknown) => void;
  [key: string]: ((data: unknown) => void) | undefined;
}

// Mock stores - in real implementation would import from stores
const fileTreeStore = {
  refresh: () => console.log('[Store] File tree refreshed')
};

const cascadeVisualization = {
  update: () => console.log('[Store] Cascade visualization updated')
};

const agentMonitor = {
  addAgent: (data: unknown) => console.log('[Store] Agent added:', data),
  updateAgent: (data: unknown) => console.log('[Store] Agent updated:', data)
};

const timeline = {
  addEvent: (data: unknown) => console.log('[Store] Timeline event added:', data)
};

const commandHistory = {
  add: (data: unknown) => console.log('[Store] Command added:', data)
};

const dashboard = {
  refresh: () => console.log('[Store] Dashboard refreshed')
};

/**
 * Default event handlers
 */
const defaultHandlers: EventHandlers = {
  'file.changed': (data) => {
    fileTreeStore.refresh();
    cascadeVisualization.update();
  },
  'agent.spawned': (data) => {
    agentMonitor.addAgent(data);
  },
  'agent.completed': (data) => {
    agentMonitor.updateAgent(data);
    timeline.addEvent(data);
  },
  'cascade.converged': (data) => {
    dashboard.refresh();
  },
  'command.executed': (data) => {
    commandHistory.add(data);
  }
};

/**
 * useRealTimeUpdates hook
 * 
 * Provides real-time update functionality including:
 * - SSE connection management
 * - Event handling for various event types
 * - Optimistic updates with rollback
 * - Debounced batch processing
 * - Offline queue with sync on reconnect
 */
export function useRealTimeUpdates(options: RealTimeUpdatesOptions = {}) {
  const {
    eventsUrl = '/events',
    onToast,
    debounceDelay = 100,
    maxEvents = 100
  } = options;

  const [state, setState] = useState<RealTimeUpdatesState>({
    events: [],
    isOnline: true,
    isUpdating: false,
    actionQueue: []
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handlersRef = useRef<EventHandlers>(defaultHandlers);

  const toast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (onToast) {
      onToast(message, type);
    } else {
      console.log(`[Toast] ${type}: ${message}`);
    }
  }, [onToast]);

  /**
   * Add event to state
   */
  const addEvent = useCallback((event: SSEEvent) => {
    setState(prev => ({
      ...prev,
      events: [event, ...prev.events].slice(0, maxEvents)
    }));
  }, [maxEvents]);

  /**
   * Schedule an update with debouncing
   */
  const scheduleUpdate = useCallback((update: () => void) => {
    setState(prev => ({ ...prev, isUpdating: true }));
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      update();
      setState(prev => ({ ...prev, isUpdating: false }));
    }, debounceDelay);
  }, [debounceDelay]);

  /**
   * Reconnect to SSE
   */
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('[SSE] Attempting to reconnect...');
      connect();
    }, 5000);
  }, []);

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const source = new EventSource(eventsUrl);
      eventSourceRef.current = source;

      source.onopen = () => {
        console.log('[SSE] Connected');
        setState(prev => ({ ...prev, isOnline: true }));
      };

      source.onerror = () => {
        console.error('[SSE] Connection error');
        setState(prev => ({ ...prev, isOnline: false }));
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
      setState(prev => ({ ...prev, isOnline: false }));
    }
  }, [eventsUrl, addEvent, reconnect]);

  /**
   * Set custom event handlers
   */
  const setHandlers = useCallback((handlers: Partial<EventHandlers>) => {
    handlersRef.current = { ...handlersRef.current, ...handlers };
  }, []);

  /**
   * Optimistic update with rollback on failure
   */
  const optimisticUpdate = useCallback(
    async <T>(action: () => Promise<T>, optimistic: () => void, rollback: () => void): Promise<void> => {
      optimistic();
      
      action()
        .then(() => {
          // Success - optimistic update stays
        })
        .catch((error) => {
          rollback();
          toast(`Action failed, rolled back: ${error}`, 'error');
        });
    },
    [toast]
  );

  /**
   * Execute action or queue if offline
   */
  const queueAction = useCallback((action: Action) => {
    if (!state.isOnline) {
      setState(prev => ({
        ...prev,
        actionQueue: [...prev.actionQueue, action]
      }));
      return;
    }
    
    executeAction(action);
  }, [state.isOnline]);

  /**
   * Execute a queued action
   */
  const executeAction = useCallback(async (action: Action) => {
    console.log('[Action] Executing:', action.type, action.payload);
    // In real implementation, would execute the action via MCP
  }, []);

  /**
   * Flush queued actions
   */
  const flushQueue = useCallback(async () => {
    const { actionQueue } = state;
    
    for (const action of actionQueue) {
      await executeAction(action);
    }
    
    setState(prev => ({ ...prev, actionQueue: [] }));
  }, [state.actionQueue, executeAction]);

  /**
   * Clear event history
   */
  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, events: [] }));
  }, []);

  // Set up SSE connection
  useEffect(() => {
    connect();
    
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
  }, [connect]);

  // Flush queue when coming back online
  useEffect(() => {
    if (state.isOnline && state.actionQueue.length > 0) {
      flushQueue();
    }
  }, [state.isOnline, state.actionQueue.length, flushQueue]);

  return {
    // State
    events: state.events,
    isOnline: state.isOnline,
    isUpdating: state.isUpdating,
    actionQueue: state.actionQueue,
    
    // Methods
    connect,
    setHandlers,
    optimisticUpdate,
    queueAction,
    flushQueue,
    clearEvents,
    scheduleUpdate
  };
}

export default useRealTimeUpdates;
