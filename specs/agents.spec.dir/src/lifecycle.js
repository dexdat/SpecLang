"use strict";
/**
 * Session Lifecycle State Machine
 *
 * Generated from: @speclang/agent-protocol
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionLifecycle = void 0;
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
class SessionLifecycle {
    transitions;
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
    canTransition(from, to) {
        const allowed = this.transitions.get(from) || [];
        return allowed.includes(to);
    }
    transition(session, to) {
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
    getAllowedTransitions(status) {
        return this.transitions.get(status) || [];
    }
    isTerminal(status) {
        return status === 'done';
    }
    canRecover(status) {
        return status === 'error';
    }
}
exports.SessionLifecycle = SessionLifecycle;
//# sourceMappingURL=lifecycle.js.map