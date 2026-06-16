/**
 * Write Interceptor - Guard system for agent file writes
 *
 * Generated from: @speclang/agent-protocol @block:writeinterceptor
 */
import { AgentRole, OwnershipCheck } from './types';
import { OwnershipRegistry } from './ownership';
import { ViolationTracker } from './violations';
export interface InterceptorConfig {
    enabled: boolean;
    allowUserWrites: boolean;
    whitelistRoles: Set<AgentRole>;
    projectRoot: string;
}
export interface WriteAttempt {
    agentId: string;
    agentRole: AgentRole;
    filepath: string;
    timestamp: number;
    allowed: boolean;
    reason?: string;
}
export declare class WriteInterceptor {
    private ownership;
    private violations;
    private config;
    constructor(ownership: OwnershipRegistry, violations: ViolationTracker, config?: Partial<InterceptorConfig>);
    /**
     * Check if a write is allowed
     */
    checkWrite(agentId: string, agentRole: AgentRole, filepath: string): OwnershipCheck;
    /**
     * Intercept a write operation
     */
    interceptWrite(agentId: string, agentRole: AgentRole, filepath: string, content: string): Promise<{
        success: boolean;
        filepath: string;
        error?: string;
    }>;
    /**
     * Check if role is whitelisted (user sessions)
     */
    private isUserSession;
    /**
     * Get current config
     */
    getConfig(): InterceptorConfig;
    /**
     * Update config
     */
    setConfig(config: Partial<InterceptorConfig>): void;
    /**
     * Get stats
     */
    getStats(): {
        totalAttempts: number;
        denied: number;
        allowed: number;
    };
}
export declare function createWriteInterceptor(ownership: OwnershipRegistry, violations: ViolationTracker, config?: Partial<InterceptorConfig>): WriteInterceptor;
export declare function initGuard(ownership?: OwnershipRegistry, violations?: ViolationTracker, config?: Partial<InterceptorConfig>): void;
export declare function getGuard(): WriteInterceptor;
export declare function resetGuard(): void;
export declare function checkOwnership(agent: AgentRole, filepath: string): boolean;
export declare function interceptWrite(agentId: string, agentRole: AgentRole, filepath: string, content: string): Promise<{
    success: boolean;
    filepath: string;
    error?: string;
}>;
export declare function getFileOwner(filepath: string): AgentRole | null;
export declare function getViolations(): import("./violations").Violation[];
export declare function getGuardStats(): {
    totalAttempts: number;
    denied: number;
    allowed: number;
};
//# sourceMappingURL=interceptor.d.ts.map