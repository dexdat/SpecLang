/**
 * Session lifecycle management
 * 
 * Generated from: @speclang/agent-protocol
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { 
  Agent, 
  AgentRole, 
  AgentStatus, 
  Session, 
  SessionState, 
  Task, 
  TaskType,
  TaskPriority,
  DEFAULT_OWNERSHIP_RULES,
  AGENT_DISPLAY_NAMES
} from './types';

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Generate unique agent ID
 */
function generateAgentId(role: AgentRole): string {
  return `${role}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Generate unique task ID
 */
function generateTaskId(): string {
  return `task-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Session Manager - handles agent session lifecycle
 */
export class SessionManager extends EventEmitter {
  private sessions: Map<string, Session>;
  private agents: Map<string, Agent>;
  private rules: { agent: AgentRole; patterns: string[]; priority: number }[];

  constructor() {
    super();
    this.sessions = new Map();
    this.agents = new Map();
    this.rules = [...DEFAULT_OWNERSHIP_RULES];
  }

  /**
   * Create a new agent session
   */
  create(role: AgentRole): Session {
    const sessionId = generateSessionId();
    const agentId = generateAgentId(role);

    // Find ownership patterns for this role
    const rule = this.rules.find(r => r.agent === role);
    const owns = rule?.patterns || [];

    // Create agent
    const agent: Agent = {
      id: agentId,
      role,
      owns,
      depends_on: [],
      status: 'idle',
      last_activity: new Date(),
      session_id: sessionId,
    };

    // Create session state
    const state: SessionState = {
      workingOn: null,
      pendingTasks: [],
      completedTasks: [],
      errors: [],
    };

    // Create session
    const session: Session = {
      id: sessionId,
      agent,
      created: new Date(),
      state,
      tools: null as any, // Set by tools module
    };

    // Store
    this.sessions.set(sessionId, session);
    this.agents.set(agentId, agent);

    this.emit('session-created', { sessionId, agentId, role });

    console.log(`[SessionManager] Created session ${sessionId} for ${AGENT_DISPLAY_NAMES[role]}`);

    return session;
  }

  /**
   * Get session by ID
   */
  get(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get session by agent ID
   */
  getByAgent(agentId: string): Session | null {
    for (const session of Array.from(this.sessions.values())) {
      if (session.agent.id === agentId) {
        return session;
      }
    }
    return null;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all active sessions
   */
  list(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * List all active agents
   */
  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * End a session
   */
  end(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionManager] Session ${sessionId} not found`);
      return;
    }

    // Remove agent
    this.agents.delete(session.agent.id);

    // Remove session
    this.sessions.delete(sessionId);

    this.emit('session-ended', { sessionId, role: session.agent.role });

    console.log(`[SessionManager] Ended session ${sessionId}`);
  }

  /**
   * End session by agent ID
   */
  endByAgent(agentId: string): void {
    const session = this.getByAgent(agentId);
    if (session) {
      this.end(session.id);
    }
  }

  /**
   * Update agent status
   */
  setAgentStatus(agentId: string, status: AgentStatus): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.last_activity = new Date();
      this.emit('status-changed', { agentId, status });
    }
  }

  /**
   * Update agent's working file
   */
  setWorkingOn(agentId: string, file: string | null): void {
    const session = this.getByAgent(agentId);
    if (session) {
      session.state.workingOn = file;
      session.agent.last_activity = new Date();
    }
  }

  /**
   * Queue a task for a session
   */
  queueTask(sessionId: string, type: TaskType, trigger: string, priority: TaskPriority = 'normal'): Task {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const task: Task = {
      id: generateTaskId(),
      type,
      priority,
      trigger,
      status: 'pending',
      created: new Date(),
    };

    // Add to pending tasks
    session.state.pendingTasks.push(task);

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    session.state.pendingTasks.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    this.emit('task-queued', { sessionId, taskId: task.id, type, trigger });

    console.log(`[SessionManager] Queued task ${task.id} for session ${sessionId}`);

    return task;
  }

  /**
   * Start a task
   */
  startTask(sessionId: string, taskId: string): Task | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const taskIndex = session.state.pendingTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = session.state.pendingTasks[taskIndex];
    task.status = 'running';
    task.started = new Date();

    // Remove from pending
    session.state.pendingTasks.splice(taskIndex, 1);

    // Update agent status
    this.setAgentStatus(session.agent.id, 'working');

    this.emit('task-started', { sessionId, taskId });

    return task;
  }

  /**
   * Complete a task
   */
  completeTask(sessionId: string, taskId: string, result?: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Find task in running or pending
    let task = session.state.pendingTasks.find(t => t.id === taskId);
    if (!task) return;

    // Mark complete
    task.status = 'completed';
    task.completed = new Date();
    task.result = result;

    // Remove from pending if still there
    const idx = session.state.pendingTasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      session.state.pendingTasks.splice(idx, 1);
    }

    // Add to completed
    session.state.completedTasks.push(task);

    // Keep only last 100 completed tasks
    if (session.state.completedTasks.length > 100) {
      session.state.completedTasks = session.state.completedTasks.slice(-100);
    }

    // Update agent status
    if (session.state.pendingTasks.length === 0) {
      this.setAgentStatus(session.agent.id, 'idle');
    }

    this.emit('task-completed', { sessionId, taskId, result });
  }

  /**
   * Fail a task
   */
  failTask(sessionId: string, taskId: string, error: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Find task
    let task = session.state.pendingTasks.find(t => t.id === taskId);
    if (!task) {
      // Check completed
      task = session.state.completedTasks.find(t => t.id === taskId);
    }
    if (!task) return;

    // Mark failed
    task.status = 'failed';
    task.completed = new Date();
    task.error = error;

    // Add error to session
    session.state.errors.push(new Error(error));

    // Keep only last 50 errors
    if (session.state.errors.length > 50) {
      session.state.errors = session.state.errors.slice(-50);
    }

    // Remove from pending if still there
    const idx = session.state.pendingTasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      session.state.pendingTasks.splice(idx, 1);
    }

    // Add to completed
    if (!session.state.completedTasks.includes(task)) {
      session.state.completedTasks.push(task);
    }

    // Update agent status
    this.setAgentStatus(session.agent.id, 'error');

    this.emit('task-failed', { sessionId, taskId, error });
  }

  /**
   * Get next pending task for a session
   */
  getNextTask(sessionId: string): Task | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return session.state.pendingTasks[0] || null;
  }

  /**
   * Get or create session for an agent role
   */
  getOrCreate(role: AgentRole): Session {
    // Find existing session for this role
    for (const session of Array.from(this.sessions.values())) {
      if (session.agent.role === role) {
        return session;
      }
    }

    // Create new session
    return this.create(role);
  }

  /**
   * Get active session count
   */
  getActiveCount(): number {
    return this.sessions.size;
  }

  /**
   * Get agent count by role
   */
  getCountByRole(role: AgentRole): number {
    let count = 0;
    for (const agent of Array.from(this.agents.values())) {
      if (agent.role === role) count++;
    }
    return count;
  }
}

/**
 * Create a new session manager
 */
export function createSessionManager(): SessionManager {
  return new SessionManager();
}
