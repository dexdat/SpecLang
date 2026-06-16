"use strict";
// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-real-time-updates
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRealTimeUpdates = useRealTimeUpdates;
/**
 * useRealTimeUpdates Hook
 *
 * React hook for handling real-time updates via SSE.
 */
const react_1 = require("react");
// Default handlers that update stores
const defaultHandlers = {
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
function useRealTimeUpdates(options = {}) {
    const { eventsUrl = '/events', onToast, debounceDelay = 100, maxEvents = 100, autoConnect = true } = options;
    const [events, setEvents] = (0, react_1.useState)([]);
    const [isOnline, setIsOnline] = (0, react_1.useState)(true);
    const [isUpdating, setIsUpdating] = (0, react_1.useState)(false);
    const [actionQueue, setActionQueue] = (0, react_1.useState)([]);
    const eventSourceRef = (0, react_1.useRef)(null);
    const updateTimeoutRef = (0, react_1.useRef)(null);
    const reconnectTimeoutRef = (0, react_1.useRef)(null);
    const handlersRef = (0, react_1.useRef)(defaultHandlers);
    // Toast notification
    const toast = (0, react_1.useCallback)((message, type = 'info') => {
        if (onToast) {
            onToast(message, type);
        }
    }, [onToast]);
    // Add event to state
    const addEvent = (0, react_1.useCallback)((event) => {
        setEvents(prev => [event, ...prev].slice(0, maxEvents));
    }, [maxEvents]);
    // Schedule update with debouncing
    const scheduleUpdate = (0, react_1.useCallback)((update) => {
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
    const reconnect = (0, react_1.useCallback)(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[SSE] Attempting to reconnect...');
            connect();
        }, 5000);
    }, []);
    // Connect to SSE endpoint
    const connect = (0, react_1.useCallback)(() => {
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
            setIsOnline(false);
        }
    }, [eventsUrl, addEvent, reconnect]);
    // Disconnect from SSE
    const disconnect = (0, react_1.useCallback)(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsOnline(false);
    }, []);
    // Set custom event handlers
    const setHandlers = (0, react_1.useCallback)((handlers) => {
        handlersRef.current = { ...handlersRef.current, ...handlers };
    }, []);
    // Optimistic update with rollback
    const optimisticUpdate = (0, react_1.useCallback)(async (action, optimistic, rollback) => {
        optimistic();
        try {
            await action();
            // Success - optimistic update stays
        }
        catch (error) {
            rollback();
            toast(`Action failed, rolled back: ${error}`, 'error');
        }
    }, [toast]);
    // Execute or queue action
    const queueAction = (0, react_1.useCallback)((action) => {
        if (!isOnline) {
            setActionQueue(prev => [...prev, action]);
            return;
        }
        executeAction(action);
    }, [isOnline]);
    // Execute a queued action
    const executeAction = (0, react_1.useCallback)(async (action) => {
        console.log('[Action] Executing:', action.type, action.payload);
        // In real implementation: await mcpClient.call(action.type, action.payload);
    }, []);
    // Flush queued actions
    const flushQueue = (0, react_1.useCallback)(async () => {
        const queue = [...actionQueue];
        for (const action of queue) {
            await executeAction(action);
        }
        setActionQueue([]);
    }, [actionQueue, executeAction]);
    // Clear event history
    const clearEvents = (0, react_1.useCallback)(() => {
        setEvents([]);
    }, []);
    // Get events by type
    const getEventsByType = (0, react_1.useCallback)((type) => {
        return events.filter(e => e.type === type);
    }, [events]);
    // Get latest event of type
    const getLatestEvent = (0, react_1.useCallback)((type) => {
        return events.find(e => e.type === type) || null;
    }, [events]);
    // Set up SSE connection
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
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
exports.default = useRealTimeUpdates;
//# sourceMappingURL=useRealTimeUpdates.js.map