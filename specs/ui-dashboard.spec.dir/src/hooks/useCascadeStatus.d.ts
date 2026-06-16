/**
 * Hook for managing cascade status state and real-time updates
 * Generated from: @implementation/ui-dashboard
 */
import type { CascadeState } from '../types';
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
    agents: any;
    loading: any;
};
export declare const useFileWatcherStatus: () => any;
export {};
//# sourceMappingURL=useCascadeStatus.d.ts.map