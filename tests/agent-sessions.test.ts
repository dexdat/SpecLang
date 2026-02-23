/**
 * SPECLANG-GENERATED: Agent Session Lifecycle Tests
 * Source: @speclang/agent-protocol
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionLifecycle } from '../src/agents/lifecycle.js';
import type { AgentSession, SessionStatus, TransitionResult } from '../src/agents/types.js';

function createMockSession(status: SessionStatus = 'created'): AgentSession {
  return {
    id: 'test-session-1',
    agent: 'spec-writer',
    owns: ['specs/**/*.spec.md'],
    created: new Date(),
    last_active: new Date(),
    status,
    completed_tasks: [],
  };
}

describe('SessionLifecycle', () => {
  let lifecycle: SessionLifecycle;

  beforeEach(() => {
    lifecycle = new SessionLifecycle();
  });

  describe('canTransition', () => {
    it('should allow created -> idle', () => {
      expect(lifecycle.canTransition('created', 'idle')).toBe(true);
    });

    it('should allow created -> error', () => {
      expect(lifecycle.canTransition('created', 'error')).toBe(true);
    });

    it('should allow idle -> active', () => {
      expect(lifecycle.canTransition('idle', 'active')).toBe(true);
    });

    it('should allow idle -> done', () => {
      expect(lifecycle.canTransition('idle', 'done')).toBe(true);
    });

    it('should allow idle -> error', () => {
      expect(lifecycle.canTransition('idle', 'error')).toBe(true);
    });

    it('should allow active -> idle', () => {
      expect(lifecycle.canTransition('active', 'idle')).toBe(true);
    });

    it('should allow active -> paused', () => {
      expect(lifecycle.canTransition('active', 'paused')).toBe(true);
    });

    it('should allow active -> error', () => {
      expect(lifecycle.canTransition('active', 'error')).toBe(true);
    });

    it('should allow paused -> active', () => {
      expect(lifecycle.canTransition('paused', 'active')).toBe(true);
    });

    it('should allow paused -> done', () => {
      expect(lifecycle.canTransition('paused', 'done')).toBe(true);
    });

    it('should allow error -> idle (recovery)', () => {
      expect(lifecycle.canTransition('error', 'idle')).toBe(true);
    });

    it('should not allow created -> active directly', () => {
      expect(lifecycle.canTransition('created', 'active')).toBe(false);
    });

    it('should not allow created -> done directly', () => {
      expect(lifecycle.canTransition('created', 'done')).toBe(false);
    });

    it('should not allow done -> any state', () => {
      expect(lifecycle.canTransition('done', 'created')).toBe(false);
      expect(lifecycle.canTransition('done', 'idle')).toBe(false);
      expect(lifecycle.canTransition('done', 'active')).toBe(false);
      expect(lifecycle.canTransition('done', 'error')).toBe(false);
    });

    it('should not allow active -> done directly', () => {
      expect(lifecycle.canTransition('active', 'done')).toBe(false);
    });
  });

  describe('transition', () => {
    it('should successfully transition from created to idle', () => {
      const session = createMockSession('created');
      const result = lifecycle.transition(session, 'idle');

      expect(result.success).toBe(true);
      expect(result.previous).toBe('created');
      expect(result.current).toBe('idle');
      expect(session.status).toBe('idle');
    });

    it('should update last_active on transition', () => {
      const before = new Date();
      const session = createMockSession('created');
      const result = lifecycle.transition(session, 'idle');
      const after = new Date();

      expect(result.success).toBe(true);
      expect(session.last_active.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(session.last_active.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should fail on invalid transition', () => {
      const session = createMockSession('created');
      const result = lifecycle.transition(session, 'active');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid transition: created -> active');
      expect(session.status).toBe('created');
    });

    it('should transition through full lifecycle', () => {
      const session = createMockSession('created');

      // Created -> Idle
      let result = lifecycle.transition(session, 'idle');
      expect(result.success).toBe(true);

      // Idle -> Active
      result = lifecycle.transition(session, 'active');
      expect(result.success).toBe(true);

      // Active -> Idle
      result = lifecycle.transition(session, 'idle');
      expect(result.success).toBe(true);

      // Idle -> Done
      result = lifecycle.transition(session, 'done');
      expect(result.success).toBe(true);
      expect(session.status).toBe('done');
    });

    it('should handle error recovery', () => {
      const session = createMockSession('active');

      // Active -> Error
      let result = lifecycle.transition(session, 'error');
      expect(result.success).toBe(true);
      expect(session.status).toBe('error');

      // Error -> Idle (recovery)
      result = lifecycle.transition(session, 'idle');
      expect(result.success).toBe(true);
      expect(session.status).toBe('idle');
    });

    it('should handle pause and resume', () => {
      const session = createMockSession('active');

      // Active -> Paused
      let result = lifecycle.transition(session, 'paused');
      expect(result.success).toBe(true);
      expect(session.status).toBe('paused');

      // Paused -> Active
      result = lifecycle.transition(session, 'active');
      expect(result.success).toBe(true);
      expect(session.status).toBe('active');

      // Paused -> Done
      result = lifecycle.transition(session, 'paused');
      expect(result.success).toBe(true);
      result = lifecycle.transition(session, 'done');
      expect(result.success).toBe(true);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return allowed transitions for created', () => {
      const transitions = lifecycle.getAllowedTransitions('created');
      expect(transitions).toEqual(['idle', 'error']);
    });

    it('should return allowed transitions for idle', () => {
      const transitions = lifecycle.getAllowedTransitions('idle');
      expect(transitions).toEqual(['active', 'done', 'error']);
    });

    it('should return allowed transitions for active', () => {
      const transitions = lifecycle.getAllowedTransitions('active');
      expect(transitions).toEqual(['idle', 'paused', 'error']);
    });

    it('should return empty for done', () => {
      const transitions = lifecycle.getAllowedTransitions('done');
      expect(transitions).toEqual([]);
    });
  });

  describe('isTerminal', () => {
    it('should return true for done', () => {
      expect(lifecycle.isTerminal('done')).toBe(true);
    });

    it('should return false for other states', () => {
      expect(lifecycle.isTerminal('created')).toBe(false);
      expect(lifecycle.isTerminal('idle')).toBe(false);
      expect(lifecycle.isTerminal('active')).toBe(false);
      expect(lifecycle.isTerminal('paused')).toBe(false);
      expect(lifecycle.isTerminal('error')).toBe(false);
    });
  });

  describe('canRecover', () => {
    it('should return true for error', () => {
      expect(lifecycle.canRecover('error')).toBe(true);
    });

    it('should return false for other states', () => {
      expect(lifecycle.canRecover('created')).toBe(false);
      expect(lifecycle.canRecover('idle')).toBe(false);
      expect(lifecycle.canRecover('active')).toBe(false);
      expect(lifecycle.canRecover('paused')).toBe(false);
      expect(lifecycle.canRecover('done')).toBe(false);
    });
  });
});

describe('AgentSession', () => {
  it('should create agent session with correct structure', () => {
    const session: AgentSession = {
      id: 'test-123',
      agent: 'code-gen',
      owns: ['src/**/*.ts'],
      created: new Date('2024-01-01'),
      last_active: new Date('2024-01-01'),
      status: 'created',
      completed_tasks: [],
    };

    expect(session.id).toBe('test-123');
    expect(session.agent).toBe('code-gen');
    expect(session.status).toBe('created');
    expect(session.owns).toHaveLength(1);
  });

  it('should track current task', () => {
    const session: AgentSession = {
      id: 'test-123',
      agent: 'spec-writer',
      owns: ['specs/**/*.spec.md'],
      created: new Date(),
      last_active: new Date(),
      status: 'active',
      current_task: 'Expanding auth.spec',
      completed_tasks: [],
    };

    expect(session.current_task).toBe('Expanding auth.spec');
  });
});
