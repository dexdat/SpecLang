/**
 * Session lifecycle management
 *
 * Generated from: @speclang/agent-protocol
 */
import { EventEmitter } from 'events';
import { Agent, AgentRole, AgentStatus, Session, Task, TaskType, TaskPriority } from './types';
/**
 * Session Manager - handles agent session lifecycle
 */
export declare class SessionManager extends EventEmitter {
    private sessions;
    private agents;
    private rules;
    constructor();
    /**
     * Create a new agent session
     */
    create(role: AgentRole): Session;
    /**
     * Get session by ID
     */
    get(sessionId: string): Session | null;
    /**
     * Get session by agent ID
     */
    getByAgent(agentId: string): Session | null;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): Agent | undefined;
    /**
     * List all active sessions
     */
    list(): Session[];
    /**
     * List all active agents
     */
    listAgents(): Agent[];
    /**
     * End a session
     */
    end(sessionId: string): void;
    /**
     * End session by agent ID
     */
    endByAgent(agentId: string): void;
    /**
     * Update agent status
     */
    setAgentStatus(agentId: string, status: AgentStatus): void;
    /**
     * Update agent's working file
     */
    setWorkingOn(agentId: string, file: string | null): void;
    /**
     * Queue a task for a session
     */
    queueTask(sessionId: string, type: TaskType, trigger: string, priority?: TaskPriority): Task;
    /**
     * Start a task
     */
    startTask(sessionId: string, taskId: string): Task | null;
    /**
     * Complete a task
     */
    completeTask(sessionId: string, taskId: string, result?: any): void;
    /**
     * Fail a task
     */
    failTask(sessionId: string, taskId: string, error: string): void;
    /**
     * Get next pending task for a session
     */
    getNextTask(sessionId: string): Task | null;
    /**
     * Get or create session for an agent role
     */
    getOrCreate(role: AgentRole): Session;
    /**
     * Get active session count
     */
    getActiveCount(): number;
    /**
     * Get agent count by role
     */
    getCountByRole(role: AgentRole): number;
}
/**
 * Create a new session manager
 */
export declare function createSessionManager(): SessionManager;
//# sourceMappingURL=session.d.ts.map