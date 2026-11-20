/**
 * SPECLANG-GENERATED: Cascade command
 * Source: @speclang/mcp.cli
 */
import type { CoordinatorOptions } from 'cascade.spec.dir/src/coordinator/index.js';
export interface CascadeOptions {
    json?: boolean;
    thinking?: CoordinatorOptions['thinking'];
    /** THINK-004: collect and print per-phase token metrics. */
    metrics?: boolean;
}
/**
 * Cascade command implementation
 */
export declare function cascadeCommand(action: 'status' | 'trigger' | 'abort', specId: string | undefined, options: CascadeOptions): Promise<void>;
export default cascadeCommand;
//# sourceMappingURL=cascade.d.ts.map