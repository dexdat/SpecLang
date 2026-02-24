/**
 * Session Lifecycle State Machine
 * 
 * Generated from: @speclang/agent-protocol
 */

import { AgentSession, SessionStatus, TransitionResult as TransitionResultType } from './types';

/**
 * Session Lifecycle:
 * 
 * [*] --> Created: speclangd spawns
 * Created --> Idle: registered
 * Idle --> Active: file event received
 * Active --> Idle: work done
 * Active --> Error: failure
 * Idle --> Done: convergence detected
 * Done --> [*]: session ends
 * Error --> [*]: after recovery
 */

export class SessionLifecycle {
  private transitions: Map<SessionStatus, SessionStatus[]>;
  
  constructor() {
    this.transitions = new Map([
      ['created', ['idle', 'error']],
      ['idle', ['active', 'done', 'error']],
      ['active', ['idle', 'paused', 'error']],
      ['paused', ['active', 'done']],
      ['done', []],
      ['error', ['idle']] // Recovery possible
    ]);
  }
  
  canTransition(from: SessionStatus, to: SessionStatus): boolean {
    const allowed = this.transitions.get(from) || [];
    return allowed.includes(to);
  }
  
  transition(session: AgentSession, to: SessionStatus): TransitionResultType {
    if (!this.canTransition(session.status, to)) {
      return {
        success: false,
        error: `Invalid transition: ${session.status} -> ${to}`
      };
    }
    
    const previous = session.status;
    session.status = to;
    session.last_active = new Date();
    
    return {
      success: true,
      previous,
      current: to
    };
  }
  
  getAllowedTransitions(status: SessionStatus): SessionStatus[] {
    return this.transitions.get(status) || [];
  }
  
  isTerminal(status: SessionStatus): boolean {
    return status === 'done';
  }
  
  canRecover(status: SessionStatus): boolean {
    return status === 'error';
  }
}

export interface TransitionResult {
  success: boolean;
  previous?: SessionStatus;
  current?: SessionStatus;
  error?: string;
}
