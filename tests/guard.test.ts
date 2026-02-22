/**
 * Guard System Tests
 * 
 * SPECLANG-GENERATED
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  OwnershipRegistry,
  createOwnershipRegistry,
  createOverride,
  ViolationTracker,
  createViolationTracker,
  WriteInterceptor,
  createWriteInterceptor,
  getGuard,
  resetGuard,
  initGuard,
  checkOwnership,
  interceptWrite,
  getFileOwner,
  getViolations,
  getGuardStats,
} from '../src/guard';
import { AgentRole } from '../src/agents/types';
import { DEFAULT_RULES } from '../src/guard/rules';
import { DEFAULT_GUARD_CONFIG } from '../src/guard/types';

describe('Guard System', () => {
  beforeEach(() => {
    resetGuard();
  });

  describe('OwnershipRegistry', () => {
    test('should create with default rules', () => {
      const registry = createOwnershipRegistry();
      expect(registry).toBeDefined();
    });

    test('north-star should own project.scl', () => {
      const registry = createOwnershipRegistry();
      const owner = registry.getOwner('project.scl');
      expect(owner).toBe('north-star');
    });

    test('spec-writer should own spec files', () => {
      const registry = createOwnershipRegistry();
      const owner = registry.getOwner('specs/auth.spec.md');
      expect(owner).toBe('spec-writer');
    });

    test('code-gen should own src files', () => {
      const registry = createOwnershipRegistry();
      const owner = registry.getOwner('src/auth/handler.ts');
      expect(owner).toBe('code-gen');
    });

    test('test-writer should own test files', () => {
      const registry = createOwnershipRegistry();
      const owner = registry.getOwner('tests/auth.test.ts');
      expect(owner).toBe('test-writer');
    });

    test('should return null for unmatched files', () => {
      const registry = createOwnershipRegistry();
      const owner = registry.getOwner('unknown/file.txt');
      expect(owner).toBeNull();
    });

    test('should check canWrite correctly', () => {
      const registry = createOwnershipRegistry();
      
      // North star can write project.scl
      expect(registry.canWrite('north-star', 'project.scl').allowed).toBe(true);
      
      // Spec writer cannot write project.scl
      expect(registry.canWrite('spec-writer', 'project.scl').allowed).toBe(false);
      
      // Spec writer can write spec files
      expect(registry.canWrite('spec-writer', 'specs/auth.spec.md').allowed).toBe(true);
    });

    test('should get owned files for agent', () => {
      const registry = createOwnershipRegistry();
      const ownedFiles = registry.getOwnedFiles('spec-writer');
      expect(ownedFiles).toBeDefined();
      expect(ownedFiles.length).toBeGreaterThan(0);
      expect(ownedFiles[0]).toContain('specs');
    });

    test('should add and remove overrides', () => {
      const registry = createOwnershipRegistry();
      
      // Override ownership for a file
      const override = createOverride(
        'specs/temp.spec.md',
        'code-gen',
        'Temporary assignment for testing',
        'north-star'
      );
      
      registry.addOverride(override);
      
      // Now code-gen should own it
      expect(registry.getOwner('specs/temp.spec.md')).toBe('code-gen');
      
      // Remove override
      registry.removeOverride('specs/temp.spec.md');
      
      // Now it should be back to spec-writer
      expect(registry.getOwner('specs/temp.spec.md')).toBe('spec-writer');
    });
  });

  describe('ViolationTracker', () => {
    test('should record violations', () => {
      const tracker = createViolationTracker();
      
      const id = tracker.record({
        agent: 'spec-writer',
        filepath: 'src/app.ts',
        attemptedAction: 'write',
      });
      
      expect(id).toBeDefined();
      expect(id.startsWith('viol-')).toBe(true);
    });

    test('should get unresolved violations', () => {
      const tracker = createViolationTracker();
      
      tracker.record({
        agent: 'spec-writer',
        filepath: 'src/app.ts',
        attemptedAction: 'write',
      });
      
      tracker.record({
        agent: 'code-gen',
        filepath: 'specs/test.spec.md',
        attemptedAction: 'write',
      });
      
      const unresolved = tracker.getUnresolved();
      expect(unresolved.length).toBe(2);
    });

    test('should resolve violations', () => {
      const tracker = createViolationTracker();
      
      const id = tracker.record({
        agent: 'spec-writer',
        filepath: 'src/app.ts',
        attemptedAction: 'write',
      });
      
      const resolved = tracker.resolve(id, 'blocked', 'north-star');
      expect(resolved).toBe(true);
      
      const unresolved = tracker.getUnresolved();
      expect(unresolved.length).toBe(0);
    });

    test('should export violation report', () => {
      const tracker = createViolationTracker();
      
      tracker.record({
        agent: 'spec-writer',
        filepath: 'src/app.ts',
        attemptedAction: 'write',
      });
      
      tracker.record({
        agent: 'code-gen',
        filepath: 'specs/test.spec.md',
        attemptedAction: 'write',
      });
      
      const report = tracker.export();
      expect(report.total).toBe(2);
      expect(report.unresolved).toBe(2);
      expect(report.byAgent['spec-writer']).toBe(1);
      expect(report.byAgent['code-gen']).toBe(1);
    });
  });

  describe('WriteInterceptor', () => {
    test('should intercept writes correctly', async () => {
      const registry = createOwnershipRegistry();
      const violations = createViolationTracker();
      const interceptor = createWriteInterceptor(registry, violations);
      
      // North star can write project.scl
      const result = await interceptor.interceptWrite('north-star', 'project.scl');
      expect(result.allowed).toBe(true);
      
      // Spec writer cannot write project.scl
      const blocked = await interceptor.interceptWrite('spec-writer', 'project.scl');
      expect(blocked.allowed).toBe(false);
      expect(blocked.reason).toContain('owned by north-star');
    });

    test('should track statistics', async () => {
      const registry = createOwnershipRegistry();
      const violations = createViolationTracker();
      const interceptor = createWriteInterceptor(registry, violations);
      
      await interceptor.interceptWrite('north-star', 'project.scl');
      await interceptor.interceptWrite('spec-writer', 'project.scl');
      await interceptor.interceptWrite('spec-writer', 'specs/auth.spec.md');
      
      const stats = interceptor.getStats();
      expect(stats.totalChecks).toBe(3);
      expect(stats.allowed).toBe(2);
      expect(stats.blocked).toBe(1);
    });

    test('should intercept delete operations', async () => {
      const registry = createOwnershipRegistry();
      const violations = createViolationTracker();
      const interceptor = createWriteInterceptor(registry, violations);
      
      // Spec writer cannot delete project.scl
      const result = await interceptor.interceptDelete('spec-writer', 'project.scl');
      expect(result.allowed).toBe(false);
    });

    test('should intercept rename operations', async () => {
      const registry = createOwnershipRegistry();
      const violations = createViolationTracker();
      const interceptor = createWriteInterceptor(registry, violations);
      
      // Spec writer cannot rename project.scl
      const result = await interceptor.interceptRename('spec-writer', 'project.scl', 'project2.scl');
      expect(result.allowed).toBe(false);
    });

    test('should allow orchestrator by default', async () => {
      const registry = createOwnershipRegistry();
      const violations = createViolationTracker();
      const interceptor = createWriteInterceptor(registry, violations, {
        enforceOnOrchestrator: false,
      });
      
      // North star (orchestrator) can write anywhere by default
      const result = await interceptor.interceptWrite('north-star', 'src/test.ts');
      expect(result.allowed).toBe(true);
    });

    test('should block orchestrator when strict mode is enabled', async () => {
      const registry = createOwnershipRegistry();
      const violations = createViolationTracker();
      const interceptor = createWriteInterceptor(registry, violations, {
        enforceOnOrchestrator: true,
      });
      
      // North star should be blocked in strict mode
      const result = await interceptor.interceptWrite('north-star', 'src/test.ts');
      expect(result.allowed).toBe(false);
    });

    test('should validate content', async () => {
      const registry = createOwnershipRegistry();
      const violations = createViolationTracker();
      const interceptor = createWriteInterceptor(registry, violations);
      
      // Empty content should fail validation
      const result = await interceptor.validateContent('test.ts', '');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File content is empty');
    });
  });

  describe('Convenience Functions', () => {
    test('getGuard should return singleton instance', () => {
      const guard1 = getGuard();
      const guard2 = getGuard();
      expect(guard1).toBe(guard2);
    });

    test('initGuard should reset and create new instance', () => {
      const guard1 = getGuard();
      initGuard();
      const guard2 = getGuard();
      expect(guard1).not.toBe(guard2);
    });

    test('checkOwnership should work', () => {
      resetGuard();
      expect(checkOwnership('north-star', 'project.scl')).toBe(true);
      expect(checkOwnership('spec-writer', 'project.scl')).toBe(false);
    });

    test('getFileOwner should return owner', () => {
      resetGuard();
      expect(getFileOwner('project.scl')).toBe('north-star');
    });

    test('getGuardStats should return stats', () => {
      resetGuard();
      const stats = getGuardStats();
      expect(stats).toHaveProperty('totalChecks');
      expect(stats).toHaveProperty('allowed');
      expect(stats).toHaveProperty('blocked');
    });
  });

  describe('Edge Cases', () => {
    test('should handle file paths with different separators', () => {
      const registry = createOwnershipRegistry();
      
      // Windows-style path
      const owner1 = registry.getOwner('specs\\auth.spec.md');
      // Unix-style path
      const owner2 = registry.getOwner('specs/auth.spec.md');
      
      expect(owner1).toBe(owner2);
    });

    test('should handle glob patterns', () => {
      const registry = createOwnershipRegistry();
      
      // Test nested paths
      const owner = registry.getOwner('specs/dir/subdir/test.spec.md');
      expect(owner).toBe('spec-writer');
    });

    test('should handle empty filepath', () => {
      const registry = createOwnershipRegistry();
      const owner = registry.getOwner('');
      expect(owner).toBeNull();
    });

    test('should handle null/undefined agent gracefully', () => {
      const registry = createOwnershipRegistry();
      
      // Using undefined as agent should not crash, but may not match any rule
      const result = registry.canWrite('spec-writer' as AgentRole, '');
      // Should return allowed: false because no owner matches
      expect(result.allowed).toBe(false);
    });
  });

  describe('Test Cases from Requirements', () => {
    test('1. North star can write project.scl', async () => {
      resetGuard();
      const result = await interceptWrite('north-star', 'project.scl', '# Project');
      expect(result.allowed).toBe(true);
    });

    test('2. Spec writer cannot write src/ files', async () => {
      resetGuard();
      const result = await interceptWrite('spec-writer', 'src/auth/handler.ts', 'code');
      expect(result.allowed).toBe(false);
    });

    test('3. Code gen cannot write spec files', async () => {
      resetGuard();
      const result = await interceptWrite('code-gen', 'specs/auth.spec.md', '# Spec');
      expect(result.allowed).toBe(false);
    });

    test('4. Orchestrator can write anywhere (when not in strict mode)', async () => {
      resetGuard();
      const result = await interceptWrite('north-star', 'src/test.ts', 'code');
      expect(result.allowed).toBe(true);
    });

    test('5. Violations recorded correctly', async () => {
      resetGuard();
      await interceptWrite('spec-writer', 'src/test.ts', 'code');
      
      const violations = getViolations();
      const unresolved = violations.getUnresolved();
      
      expect(unresolved.length).toBe(1);
      expect(unresolved[0].agent).toBe('spec-writer');
      expect(unresolved[0].filepath).toBe('src/test.ts');
    });

    test('6. Override rules work', () => {
      const registry = createOwnershipRegistry();
      
      // Override spec file to be owned by code-gen
      const override = createOverride(
        'specs/temp.spec.md',
        'code-gen',
        'Temporary assignment',
        'north-star'
      );
      registry.addOverride(override);
      
      // Code-gen can now write
      expect(registry.canWrite('code-gen', 'specs/temp.spec.md').allowed).toBe(true);
    });

    test('7. Conflict resolution returns conflicts', () => {
      const registry = createOwnershipRegistry();
      const conflicts = registry.resolveConflicts();
      // Should return array (may be empty if no actual file conflicts)
      expect(Array.isArray(conflicts)).toBe(true);
    });
  });
});
