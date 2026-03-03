/**
 * Write Interceptor for Guard System
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */
import { InterceptResult, ValidationResult, GuardConfig, GuardStats, AgentRole } from './types';
import { OwnershipRegistry } from './registry';
import { ViolationTracker } from './violations';
/**
 * WriteInterceptor - intercepts file write operations and enforces ownership
 */
export declare class WriteInterceptor {
    private registry;
    private violations;
    private config;
    private stats;
    constructor(registry: OwnershipRegistry, violations: ViolationTracker, config?: Partial<GuardConfig>);
    /**
     * Initialize stats
     */
    private initStats;
    /**
     * Intercept a write operation
     */
    interceptWrite(agent: AgentRole, filepath: string, _content?: string): Promise<InterceptResult>;
    /**
     * Intercept a delete operation
     */
    interceptDelete(agent: AgentRole, filepath: string): Promise<InterceptResult>;
    /**
     * Intercept a rename operation
     */
    interceptRename(agent: AgentRole, oldPath: string, newPath: string): Promise<InterceptResult>;
    /**
     * Validate file content based on type
     */
    validateContent(filepath: string, content: string): Promise<ValidationResult>;
    /**
     * Check ownership without performing the write
     */
    checkOwnership(agent: AgentRole, filepath: string): InterceptResult;
    /**
     * Update stats for an agent
     */
    private updateAgentStats;
    /**
     * Get current stats
     */
    getStats(): GuardStats;
    /**
     * Reset stats
     */
    resetStats(): void;
    /**
     * Get the registry
     */
    getRegistry(): OwnershipRegistry;
    /**
     * Get the violations tracker
     */
    getViolations(): ViolationTracker;
    /**
     * Get config
     */
    getConfig(): GuardConfig;
    /**
     * Update config
     */
    setConfig(config: Partial<GuardConfig>): void;
}
/**
 * Create a write interceptor with default config
 */
export declare function createWriteInterceptor(registry?: OwnershipRegistry, violations?: ViolationTracker, config?: Partial<GuardConfig>): WriteInterceptor;
//# sourceMappingURL=interceptor.d.ts.map