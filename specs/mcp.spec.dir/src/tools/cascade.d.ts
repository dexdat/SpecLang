/**
 * SPECLANG-GENERATED: MCP Cascade Tools
 * Source: @speclang/mcp
 */
import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import type { CascadeStatus, CascadeTriggerInput } from '../types.js';
/**
 * Cascade tool handler
 */
export declare class CascadeToolHandler {
    private db;
    constructor(db: SpecLangDB);
    /**
     * Handle speclang_cascade_status - Get cascade status
     */
    handleCascadeStatus(): Promise<CascadeStatus>;
    /**
     * Handle speclang_cascade_trigger - Trigger a cascade
     */
    handleCascadeTrigger(args: CascadeTriggerInput): Promise<{
        cascade_id: string;
        status: string;
    }>;
    /**
     * Handle speclang_cascade_abort - Abort a cascade
     */
    handleCascadeAbort(): Promise<{
        aborted: boolean;
        rolled_back: string[];
    }>;
    /**
     * Find dependent specs
     */
    private findDependents;
    /**
     * Handle speclang_cascade_converge - Mark cascade as converged
     */
    handleCascadeConverge(args: {
        cascade_id: string;
    }): Promise<{
        converged: boolean;
        files_changed: string[];
        duration: number;
    }>;
}
//# sourceMappingURL=cascade.d.ts.map