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
export declare class SessionLifecycle {
    private transitions;
    constructor();
    canTransition(from: SessionStatus, to: SessionStatus): boolean;
    transition(session: AgentSession, to: SessionStatus): TransitionResultType;
    getAllowedTransitions(status: SessionStatus): SessionStatus[];
    isTerminal(status: SessionStatus): boolean;
    canRecover(status: SessionStatus): boolean;
}
export interface TransitionResult {
    success: boolean;
    previous?: SessionStatus;
    current?: SessionStatus;
    error?: string;
}
//# sourceMappingURL=lifecycle.d.ts.map