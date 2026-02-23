import { describe, it, expect, beforeEach } from 'vitest';
import {
  OwnershipRegistry,
  createOwnershipRegistry,
} from '../src/agents/ownership';
import {
  WriteInterceptor,
  createWriteInterceptor,
  initGuard,
  getGuard,
  resetGuard,
  checkOwnership,
  getFileOwner,
  getViolations,
  getGuardStats,
} from '../src/agents/interceptor';
import { ViolationTracker, createViolationTracker } from '../src/agents/violations';
import { AgentRole, OwnershipRule } from '../src/agents/types';

describe('OwnershipRegistry', () => {
  let registry: OwnershipRegistry;

  beforeEach(() => {
    registry = createOwnershipRegistry();
  });

  it('should return owner for matching file pattern', () => {
    const owner = registry.getOwner('src/main.ts');
    expect(owner).toBe('code-gen');
  });

  it('should return null for unowned file', () => {
    const owner = registry.getOwner('unknown.file');
    expect(owner).toBeNull();
  });

  it('should allow write to owned file', () => {
    const check = registry.canWrite('agent-1', 'code-gen', 'src/main.ts');
    expect(check.allowed).toBe(true);
  });

  it('should deny write to non-owned file', () => {
    const check = registry.canWrite('agent-1', 'spec-writer', 'src/main.ts');
    expect(check.allowed).toBe(false);
    expect(check.owner).toBe('code-gen');
  });

  it('should always allow read', () => {
    const check = registry.canRead('agent-1', 'src/main.ts');
    expect(check.allowed).toBe(true);
  });

  it('should cache ownership lookups', () => {
    registry.getOwner('src/main.ts');
    registry.getOwner('src/main.ts');
    const owned = registry.getOwnedFiles('code-gen');
    expect(owned).toContain('src/**/*.{ts,js,go,py,rs,java}');
  });
});

describe('WriteInterceptor', () => {
  let ownership: OwnershipRegistry;
  let violations: ViolationTracker;
  let interceptor: WriteInterceptor;

  beforeEach(() => {
    resetGuard();
    ownership = createOwnershipRegistry();
    violations = createViolationTracker();
    interceptor = createWriteInterceptor(ownership, violations, {
      allowUserWrites: false,
    });
  });

  it('should allow write to owned file', () => {
    const check = interceptor.checkWrite('agent-1', 'code-gen', 'src/main.ts');
    expect(check.allowed).toBe(true);
  });

  it('should deny write to non-owned file', () => {
    const check = interceptor.checkWrite('agent-1', 'spec-writer', 'src/main.ts');
    expect(check.allowed).toBe(false);
    expect(check.owner).toBe('code-gen');
  });

  it('should record violations for denied writes', () => {
    interceptor.checkWrite('agent-1', 'spec-writer', 'src/main.ts');
    const stats = violations.getStats();
    expect(stats.total).toBe(1);
    expect(stats.unresolved).toBe(1);
  });

  it('should allow user writes when enabled', () => {
    const userInterceptor = createWriteInterceptor(ownership, violations, {
      allowUserWrites: true,
      whitelistRoles: new Set<AgentRole>([]),
    });
    const check = userInterceptor.checkWrite('user-1', 'north-star' as AgentRole, 'src/main.ts');
    expect(check.allowed).toBe(true);
  });

  it('should get stats', () => {
    interceptor.checkWrite('agent-1', 'spec-writer', 'src/main.ts');
    const stats = interceptor.getStats();
    expect(stats.totalAttempts).toBe(1);
    expect(stats.denied).toBe(1);
  });
});

describe('Guard Functions', () => {
  beforeEach(() => {
    resetGuard();
  });

  it('should initialize guard', () => {
    initGuard();
    const guard = getGuard();
    expect(guard).toBeDefined();
  });

  it('should return same guard instance', () => {
    initGuard();
    const guard1 = getGuard();
    const guard2 = getGuard();
    expect(guard1).toBe(guard2);
  });

  it('should reset guard', () => {
    initGuard();
    resetGuard();
    expect(getGuard()).toBeDefined();
  });

  it('should check ownership', () => {
    initGuard();
    const result = checkOwnership('code-gen', 'src/main.ts');
    expect(result).toBe(true);
  });

  it('should get file owner', () => {
    initGuard();
    const owner = getFileOwner('src/main.ts');
    expect(owner).toBe('code-gen');
  });

  it('should get violations', () => {
    initGuard();
    const violations = getViolations();
    expect(Array.isArray(violations)).toBe(true);
  });

  it('should get guard stats', () => {
    initGuard();
    const stats = getGuardStats();
    expect(stats).toHaveProperty('totalAttempts');
    expect(stats).toHaveProperty('denied');
    expect(stats).toHaveProperty('allowed');
  });
});

describe('ViolationTracker', () => {
  let tracker: ViolationTracker;

  beforeEach(() => {
    tracker = createViolationTracker();
  });

  it('should record violations', () => {
    const violation = tracker.record({
      agentId: 'agent-1',
      agentRole: 'spec-writer',
      filepath: 'src/main.ts',
      action: 'write_attempt_denied',
      reason: 'File owned by code-gen',
      timestamp: Date.now(),
    });
    expect(violation.id).toBeDefined();
    expect(violation.resolved).toBe(false);
  });

  it('should get all violations', () => {
    tracker.record({
      agentId: 'agent-1',
      agentRole: 'spec-writer',
      filepath: 'src/main.ts',
      action: 'write_attempt_denied',
      reason: 'Test',
      timestamp: Date.now(),
    });
    const violations = tracker.getViolations();
    expect(violations.length).toBe(1);
  });

  it('should resolve violations', () => {
    const violation = tracker.record({
      agentId: 'agent-1',
      agentRole: 'spec-writer',
      filepath: 'src/main.ts',
      action: 'write_attempt_denied',
      reason: 'Test',
      timestamp: Date.now(),
    });
    const resolved = tracker.resolve(violation.id);
    expect(resolved).toBe(true);
    expect(tracker.getUnresolved().length).toBe(0);
  });

  it('should get stats', () => {
    tracker.record({
      agentId: 'agent-1',
      agentRole: 'spec-writer',
      filepath: 'src/main.ts',
      action: 'write_attempt_denied',
      reason: 'Test',
      timestamp: Date.now(),
    });
    const stats = tracker.getStats();
    expect(stats.total).toBe(1);
    expect(stats.unresolved).toBe(1);
  });

  it('should clear violations', () => {
    tracker.record({
      agentId: 'agent-1',
      agentRole: 'spec-writer',
      filepath: 'src/main.ts',
      action: 'write_attempt_denied',
      reason: 'Test',
      timestamp: Date.now(),
    });
    tracker.clear();
    expect(tracker.count()).toBe(0);
  });
});
