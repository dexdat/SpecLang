/**
 * SPECLANG-GENERATED: MCP Lock Tools
 * Source: @speclang/mcp
 */
import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import type { LockInput, UnlockInput } from '../types.js';
/**
 * Lock tool handler
 */
export declare class LocksToolHandler {
    private db;
    constructor(db: SpecLangDB);
    /**
     * Handle speclang_lock - Acquire file lock
     */
    handleLock(args: LockInput): Promise<{
        acquired: boolean;
        lock_id?: string;
        held_by?: string;
    }>;
    /**
     * Handle speclang_unlock - Release file lock
     */
    handleUnlock(args: UnlockInput): Promise<{
        released: boolean;
    }>;
    /**
     * Handle speclang_check_lock - Check if resource is locked
     */
    handleCheckLock(args: {
        resource: string;
    }): Promise<{
        locked: boolean;
        held_by?: string;
        expires_at?: number;
    }>;
    /**
     * Handle speclang_force_unlock - Force unlock (admin only)
     */
    handleForceUnlock(args: {
        resource: string;
    }): Promise<{
        released: boolean;
    }>;
}
//# sourceMappingURL=locks.d.ts.map