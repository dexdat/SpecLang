"use strict";
/**
 * Hook for managing cascade status state and real-time updates
 * Generated from: @implementation/ui-dashboard
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFileWatcherStatus = exports.useAgentStatus = exports.useCascadeStatus = void 0;
const react_1 = require("react");
const defaultCascadeState = {
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
const useCascadeStatus = () => {
    const [cascadeState, setCascadeState] = (0, react_1.useState)(defaultCascadeState);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const connectToSSE = (0, react_1.useCallback)(() => {
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
                }
                catch (parseError) {
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
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to connect'));
            return () => { };
        }
    }, []);
    (0, react_1.useEffect)(() => {
        const cleanup = connectToSSE();
        return cleanup;
    }, [connectToSSE]);
    // Poll for status if SSE is not available
    (0, react_1.useEffect)(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/cascade/status');
                if (response.ok) {
                    const data = await response.json();
                    setCascadeState((prev) => ({
                        ...prev,
                        ...data,
                        lastUpdate: new Date(),
                    }));
                }
            }
            catch {
                // Silently fail - SSE is primary
            }
        };
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);
    const reconnect = (0, react_1.useCallback)(() => {
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
exports.useCascadeStatus = useCascadeStatus;
const useAgentStatus = (agentId) => {
    const [agents, setAgents] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchAgents = async () => {
            setLoading(true);
            try {
                const url = agentId ? `/api/agents/${agentId}` : '/api/agents';
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setAgents(Array.isArray(data) ? data : [data]);
                }
            }
            catch (err) {
                console.error('Failed to fetch agent status:', err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchAgents();
        const interval = setInterval(fetchAgents, 3000);
        return () => clearInterval(interval);
    }, [agentId]);
    return { agents, loading };
};
exports.useAgentStatus = useAgentStatus;
const useFileWatcherStatus = () => {
    const [fileWatcher, setFileWatcher] = (0, react_1.useState)({
        isWatching: false,
        filesMonitored: 0,
        lastChange: null,
    });
    (0, react_1.useEffect)(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/file-watcher/status');
                if (response.ok) {
                    const data = await response.json();
                    setFileWatcher({
                        isWatching: data.isWatching ?? false,
                        filesMonitored: data.filesMonitored ?? 0,
                        lastChange: data.lastChange ? new Date(data.lastChange) : null,
                    });
                }
            }
            catch {
                // File watcher may not be running
            }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 2000);
        return () => clearInterval(interval);
    }, []);
    return fileWatcher;
};
exports.useFileWatcherStatus = useFileWatcherStatus;
//# sourceMappingURL=useCascadeStatus.js.map