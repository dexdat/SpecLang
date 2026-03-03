/**
 * Type definitions for speclangd daemon simulation
 *
 * Generated from: @speclang/daemon
 */
export declare enum FileEventKind {
    Create = "create",
    Modify = "modify",
    Delete = "delete",
    Rename = "rename"
}
export interface FileEvent {
    kind: FileEventKind;
    path: string;
    oldPath?: string;
    timestamp: number;
}
export type AgentId = string;
export declare enum AgentTaskKind {
    SpecWriter = "spec_writer",
    CodeGen = "code_gen",
    TestWriter = "test_writer",
    BackSync = "back_sync"
}
export interface AgentTask {
    kind: AgentTaskKind;
    trigger: string;
    spec?: string;
    target?: string;
    code?: string;
}
export interface RouteRule {
    pattern: RegExp;
    agent: AgentId;
    taskKind: AgentTaskKind;
}
export declare enum DaemonStatusKind {
    Idle = "idle",
    Cascading = "cascading",
    Converged = "converged",
    Paused = "paused",
    Error = "error"
}
export interface DaemonStatus {
    status: DaemonStatusKind;
    cascadeDepth: number;
    filesChanged: number;
    activeAgents: number;
    startedAt: number;
    lastEventAt?: number;
    quietSince?: number;
    error?: string;
}
export declare enum DaemonCommandKind {
    Status = "status",
    Pause = "pause",
    Resume = "resume",
    Abort = "abort",
    Trigger = "trigger",
    Converge = "converge"
}
export interface DaemonCommand {
    kind: DaemonCommandKind;
    path?: string;
}
export interface AgentNotification {
    event: FileEvent;
    task: AgentTask;
    timestamp: number;
}
export interface AgentResponse {
    accepted: boolean;
    agent: AgentId;
    message?: string;
}
export interface Lock {
    agentId: string;
    file: string;
    acquiredAt: number;
    expiresAt: number;
    contentHash?: string;
}
export declare enum AgentStatusKind {
    Idle = "idle",
    Busy = "busy",
    Error = "error"
}
export interface AgentStatus {
    id: string;
    status: AgentStatusKind;
    lastUpdate: number;
    currentTask?: string;
}
export interface ConvergenceResult {
    converged: boolean;
    filesChanged: number;
    duration: number;
    cascadeDepth: number;
    timestamp: number;
    testResults?: TestResults;
    commitSha?: string;
}
export interface TestResults {
    passed: number;
    failed: number;
    total: number;
    duration: number;
    errors: string[];
}
export interface DaemonConfig {
    watch: {
        paths: string[];
        ignore: string[];
        debounce?: number;
    };
    convergence: {
        quietPeriod: number;
        maxDepth: number;
        testOnConverge?: boolean;
        autoCommit?: boolean;
    };
    agentApi: {
        port: number;
        host: string;
    };
    locks: {
        dir: string;
        timeout: number;
    };
    logging: {
        level: string;
        file: string;
    };
}
//# sourceMappingURL=types.d.ts.map