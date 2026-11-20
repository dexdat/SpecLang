/**
 * Hook for managing cascade status state and real-time updates
 * Generated from: @implementation/ui-dashboard
 */
import type { CascadeState, AgentStatus, FileWatcherStatus } from '../types';
interface UseCascadeStatusReturn {
    cascadeState: CascadeState;
    queueDepth: number;
    convergenceTimer: number;
    isConnected: boolean;
    error: Error | null;
    reconnect: () => void;
}
export declare const useCascadeStatus: () => UseCascadeStatusReturn;
export declare const useAgentStatus: (agentId?: string) => {
    agents: AgentStatus[];
    loading: boolean;
};
export declare const useFileWatcherStatus: () => FileWatcherStatus;
export {};
//# sourceMappingURL=useCascadeStatus.d.ts.map