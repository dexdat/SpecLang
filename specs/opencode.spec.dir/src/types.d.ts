/**
 * OpenCode Plugin Types
 *
 * Types for the SpecLang OpenCode plugin
 */
export interface OpenCodePluginContext {
    events: OpenCodeEvents;
    db: OpenCodeDatabase;
    tools: OpenCodeTools;
    config: OpenCodePluginConfig;
}
export interface OpenCodeEvents {
    on(event: 'file.edited', handler: (file: FileEditEvent) => void): void;
    on(event: 'agent.finished', handler: (agent: AgentFinishedEvent) => void): void;
    on(event: 'session.idle', handler: (session: SessionIdleEvent) => void): any;
    on(event: 'session.started', handler: (session: SessionStartedEvent) => void): any;
    on(event: 'write.attempt', handler: (attempt: WriteAttemptEvent) => void): any;
    emit(event: string, data: unknown): void;
}
export interface FileEditEvent {
    path: string;
    timestamp: number;
    session?: string;
}
export interface AgentFinishedEvent {
    session: string;
    summary: string;
    files_written: string[];
}
export interface SessionIdleEvent {
    session: string;
}
export interface SessionStartedEvent {
    session: string;
    agent: string;
    owns: string[];
}
export interface WriteAttemptEvent {
    session: string;
    path: string;
}
export interface OpenCodeDatabase {
    exec(sql: string): void;
    prepare(sql: string): Statement;
    get<T>(sql: string, params?: unknown[]): T | undefined;
    all<T>(sql: string, params?: unknown[]): T[];
}
export interface Statement {
    run(...params: unknown[]): {
        lastInsertRowid: number;
        changes: number;
    };
    get<T>(...params: unknown[]): T | undefined;
    all<T>(...params: unknown[]): T[];
}
export interface OpenCodeTools {
    register(name: string, handler: ToolHandler): void;
}
export type ToolHandler = (params: Record<string, unknown>) => Promise<unknown>;
export interface OpenCodePluginConfig {
    projectDir: string;
    quietPeriod: number;
    maxConcurrent: number;
    profile: BuildProfile;
}
export type BuildProfile = 'poc' | 'mvp' | 'enterprise';
export interface BuildProfileConfig {
    agents: string[];
    tests: 'basic' | 'standard' | 'comprehensive';
    pipeline: string[];
    coverageMin?: number;
    securityScan?: boolean;
}
export interface SpecHeader {
    id: string;
    version: string;
    layer: number;
    tags: string[];
    short: string;
    status?: string;
    project_level?: string;
    agent_support?: string;
}
export interface SpecIndex {
    path: string;
    id: string;
    depth: number;
    owned_by: string;
    depends_on: string[];
    tags: string[];
    short_desc: string;
    header_lines: number;
    last_modified: number;
}
//# sourceMappingURL=types.d.ts.map