/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/database.spec.md
 * Generated: 2026-03-03T10:49:14.000Z
 *
 * Edit the spec, not this file.
 */
import { FileEvent, AgentTask, TaskResult, CascadeStats, GeneratedFileRecord, ParsedSpec, DaemonStats } from '../types/poc';
export declare class POCDatabase {
    private db;
    constructor(dbPath?: string);
    private init;
    insertFileEvent(event: FileEvent): number;
    getUnprocessedEvents(): FileEvent[];
    markEventProcessed(eventId: number, cascadeId: number): void;
    createCascade(): number;
    completeCascade(cascadeId: number, stats: CascadeStats): void;
    failCascade(cascadeId: number, error: string): void;
    recordGeneratedFile(file: GeneratedFileRecord): void;
    cacheSpec(spec: ParsedSpec): void;
    getCachedSpec(specId: string): ParsedSpec | undefined;
    createTask(task: AgentTask, cascadeId: number): void;
    startTask(taskId: string): void;
    completeTask(taskId: string, result: TaskResult): void;
    failTask(taskId: string, error: string): void;
    getStats(): DaemonStats;
    /**
     * Clean up stale cascades (e.g., after daemon crash)
     * Marks all "running" cascades as "failed"
     */
    cleanupStaleCascades(): void;
    /**
     * Close database connection
     */
    close(): void;
}
//# sourceMappingURL=poc-db.d.ts.map