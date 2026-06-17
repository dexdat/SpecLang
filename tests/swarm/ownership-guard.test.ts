import { describe, it, expect, beforeEach } from 'vitest';
import {
  OwnershipRegistry,
  createOwnershipRegistry,
} from '../../src/agents/ownership';
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
} from '../../src/agents/interceptor';
import { ViolationTracker, createViolationTracker } from '../../src/agents/violations';
import { AgentRole, OwnershipRule } from '../../src/agents/types';

describe('OwnershipGuard Integration', () => {
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

  it('CodeGen writes to CodeGen-owned file should be allowed', () => {
    const check = interceptor.checkWrite('agent-1', 'code-gen', 'src/main.ts');
    expect(check.allowed).toBe(true);
    expect(check.owner).toBe('code-gen');
  });

  it('SpecWriter writes to CodeGen-owned file should be blocked with correct owner', () => {
    const check = interceptor.checkWrite('agent-1', 'spec-writer', 'src/main.ts');
    expect(check.allowed).toBe(false);
    expect(check.owner).toBe('code-gen');
    expect(check.reason).toContain('code-gen');
  });

  it('Write to unowned file should be blocked with no ownership rule reason', () => {
    const check = interceptor.checkWrite('agent-1', 'code-gen', 'Makefile');
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('No ownership rule matches this file');
  });

  it('Denied writes should be recorded as violations', () => {
    interceptor.checkWrite('agent-1', 'spec-writer', 'src/main.ts');
    interceptor.checkWrite('agent-1', 'code-gen', 'Makefile');

    const allViolations = violations.getViolations();
    expect(allViolations.length).toBe(2);

    const mainViolation = violations.getByFile('src/main.ts');
    expect(mainViolation.length).toBe(1);
    expect(mainViolation[0].action).toBe('write_attempt_denied');
    expect(mainViolation[0].reason).toContain('code-gen');

    const makefileViolation = violations.getByFile('Makefile');
    expect(makefileViolation.length).toBe(1);
    expect(makefileViolation[0].reason).toBe('No ownership rule matches this file');
  });

  it('Stats should track totalAttempts, denied, and allowed counts', () => {
    expect(interceptor.getStats()).toEqual({
      totalAttempts: 0,
      denied: 0,
      allowed: 0,
    });

    interceptor.checkWrite('agent-1', 'code-gen', 'src/main.ts');
    interceptor.checkWrite('agent-1', 'spec-writer', 'src/main.ts');
    interceptor.checkWrite('agent-1', 'code-gen', 'Makefile');

    const stats = interceptor.getStats();
    expect(stats.totalAttempts).toBe(2);
    expect(stats.denied).toBe(2);
    expect(stats.allowed).toBe(0);
  });

  it('SpecWriter writes to SpecWriter-owned file should be allowed', () => {
    const check = interceptor.checkWrite('agent-1', 'spec-writer', 'specs/core.spec.md');
    expect(check.allowed).toBe(true);
    expect(check.owner).toBe('spec-writer');
  });

  it('Guard singleton functions work with integration flow', () => {
    initGuard(ownership, violations, { allowUserWrites: false });
    const guard = getGuard();
    expect(guard).toBeDefined();

    expect(getFileOwner('src/main.ts')).toBe('code-gen');
    expect(getFileOwner('Makefile')).toBeNull();

    expect(checkOwnership('code-gen', 'src/main.ts')).toBe(true);
    expect(checkOwnership('spec-writer', 'src/main.ts')).toBe(false);

    expect(Array.isArray(getViolations())).toBe(true);

    const stats = getGuardStats();
    expect(stats).toHaveProperty('totalAttempts');
    expect(stats).toHaveProperty('denied');
    expect(stats).toHaveProperty('allowed');
  });
});
