"use strict";
// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-real-time-updates
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRealTimeUpdates = useRealTimeUpdates;
/**
 * Real-Time Updates Handler
 *
 * Handles SSE connections, event processing, optimistic updates,
 * debouncing, and offline queue management.
 */
const react_1 = require("react");
// Mock stores - in real implementation would import from stores
const fileTreeStore = {
    refresh: () => console.log('[Store] File tree refreshed')
};
const cascadeVisualization = {
    update: () => console.log('[Store] Cascade visualization updated')
};
const agentMonitor = {
    addAgent: (data) => console.log('[Store] Agent added:', data),
    updateAgent: (data) => console.log('[Store] Agent updated:', data)
};
const timeline = {
    addEvent: (data) => console.log('[Store] Timeline event added:', data)
};
const commandHistory = {
    add: (data) => console.log('[Store] Command added:', data)
};
const dashboard = {
    refresh: () => console.log('[Store] Dashboard refreshed')
};
/**
 * Default event handlers
 */
const defaultHandlers = {
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
function useRealTimeUpdates(options = {}) {
    const { eventsUrl = '/events', onToast, debounceDelay = 100, maxEvents = 100 } = options;
    const [state, setState] = (0, react_1.useState)({
        events: [],
        isOnline: true,
        isUpdating: false,
        actionQueue: []
    });
    const eventSourceRef = (0, react_1.useRef)(null);
    const updateTimeoutRef = (0, react_1.useRef)(null);
    const reconnectTimeoutRef = (0, react_1.useRef)(null);
    const handlersRef = (0, react_1.useRef)(defaultHandlers);
    const toast = (0, react_1.useCallback)((message, type = 'info') => {
        if (onToast) {
            onToast(message, type);
        }
        else {
            console.log(`[Toast] ${type}: ${message}`);
        }
    }, [onToast]);
    /**
     * Add event to state
     */
    const addEvent = (0, react_1.useCallback)((event) => {
        setState(prev => ({
            ...prev,
            events: [event, ...prev.events].slice(0, maxEvents)
        }));
    }, [maxEvents]);
    /**
     * Schedule an update with debouncing
     */
    const scheduleUpdate = (0, react_1.useCallback)((update) => {
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
    const reconnect = (0, react_1.useCallback)(() => {
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
    const connect = (0, react_1.useCallback)(() => {
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
                if (!handler)
                    return;
                source.addEventListener(type, (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        handler(data);
                        addEvent({ type, data, timestamp: Date.now() });
                    }
                    catch (error) {
                        console.error(`[SSE] Error parsing ${type}:`, error);
                    }
                });
            });
        }
        catch (error) {
            console.error('[SSE] Failed to connect:', error);
            setState(prev => ({ ...prev, isOnline: false }));
        }
    }, [eventsUrl, addEvent, reconnect]);
    /**
     * Set custom event handlers
     */
    const setHandlers = (0, react_1.useCallback)((handlers) => {
        handlersRef.current = { ...handlersRef.current, ...handlers };
    }, []);
    /**
     * Optimistic update with rollback on failure
     */
    const optimisticUpdate = (0, react_1.useCallback)(async (action, optimistic, rollback) => {
        optimistic();
        action()
            .then(() => {
            // Success - optimistic update stays
        })
            .catch((error) => {
            rollback();
            toast(`Action failed, rolled back: ${error}`, 'error');
        });
    }, [toast]);
    /**
     * Execute action or queue if offline
     */
    const queueAction = (0, react_1.useCallback)((action) => {
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
    const executeAction = (0, react_1.useCallback)(async (action) => {
        console.log('[Action] Executing:', action.type, action.payload);
        // In real implementation, would execute the action via MCP
    }, []);
    /**
     * Flush queued actions
     */
    const flushQueue = (0, react_1.useCallback)(async () => {
        const { actionQueue } = state;
        for (const action of actionQueue) {
            await executeAction(action);
        }
        setState(prev => ({ ...prev, actionQueue: [] }));
    }, [state.actionQueue, executeAction]);
    /**
     * Clear event history
     */
    const clearEvents = (0, react_1.useCallback)(() => {
        setState(prev => ({ ...prev, events: [] }));
    }, []);
    // Set up SSE connection
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
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
exports.default = useRealTimeUpdates;
//# sourceMappingURL=real-time-updates.js.map