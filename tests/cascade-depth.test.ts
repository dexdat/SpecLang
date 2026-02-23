// SPECLANG-GENERATED: Phase 0.20 - Cascade Depth and Cycle Detection
// DO NOT EDIT MANUALLY
// Source: docs/prompts/phase-0.20-cascade-depth.md

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { 
  CascadeDepthManager, 
  DepthTracker, 
  CycleDetector, 
  ConvergenceDetector,
  DepthConfig,
  DEFAULT_DEPTH_CONFIG
} from '../src/cascade/depth/index.js';

// Test configuration
const TEST_CONFIG: Partial<DepthConfig> = {
  max_depth: 5,
  max_files_per_cascade: 10,
  max_duration_ms: 60000, // 1 minute
  quiet_period_ms: 100    // 100ms for fast testing
};

describe('DepthTracker', () => {
  let tracker: DepthTracker;

  beforeEach(() => {
    tracker = new DepthTracker(TEST_CONFIG);
  });

  test('should start a cascade with depth 0', () => {
    tracker.startCascade('test-cascade-1');
    const state = tracker.getState();
    
    expect(state).not.toBeNull();
    expect(state!.cascade_id).toBe('test-cascade-1');
    expect(state!.current_depth).toBe(0);
    expect(state!.files_changed).toBe(0);
  });

  test('should increment depth on each file change', () => {
    tracker.startCascade('test-cascade-2');
    
    const result1 = tracker.increment('file1.ts', 'agent1');
    expect(result1.depth).toBe(1);
    expect(result1.files_changed).toBe(1);
    expect(result1.shouldPause).toBe(false);
    
    const result2 = tracker.increment('file2.ts', 'agent1');
    expect(result2.depth).toBe(2);
    expect(result2.files_changed).toBe(2);
  });

  test('should pause at max depth', () => {
    tracker.startCascade('test-cascade-3');
    
    // Go to max depth
    for (let i = 0; i < 5; i++) {
      tracker.increment(`file${i}.ts`, 'agent1');
    }
    
    const result = tracker.increment('file5.ts', 'agent1');
    expect(result.shouldPause).toBe(true);
    expect(result.warnings).toContain('Max depth reached: 5');
  });

  test('should pause at max files', () => {
    tracker.startCascade('test-cascade-4');
    
    // Go to max files
    for (let i = 0; i < 10; i++) {
      tracker.increment(`file${i}.ts`, 'agent1');
    }
    
    const result = tracker.increment('file10.ts', 'agent1');
    expect(result.shouldPause).toBe(true);
    expect(result.warnings).toContain('Max files changed: 10');
  });

  test('should throw error when no cascade is active', () => {
    expect(() => {
      tracker.increment('file.ts', 'agent1');
    }).toThrow('No active cascade');
  });

  test('should reset state', () => {
    tracker.startCascade('test-cascade-5');
    tracker.increment('file1.ts', 'agent1');
    
    tracker.reset();
    
    expect(tracker.getState()).toBeNull();
  });
});

describe('CycleDetector', () => {
  let detector: CycleDetector;

  beforeEach(() => {
    detector = new CycleDetector({ max_repeats: 3, max_pattern_length: 3 });
  });

  test('should not detect cycle initially', () => {
    const result = detector.recordEdit('file1.ts');
    expect(result.hasCycle).toBe(false);
  });

  test('should detect repeated file edits', () => {
    detector.recordEdit('file1.ts');
    detector.recordEdit('file1.ts');
    detector.recordEdit('file1.ts');
    
    const result = detector.checkForCycles();
    expect(result.hasCycle).toBe(true);
    expect(result.cycleFile).toBe('file1.ts');
    expect(result.reasons).toContain('File file1.ts edited 3 times');
  });

  test('should detect repeating pattern', () => {
    // Create a repeating pattern: A -> B -> A -> B
    detector.recordEdit('a.ts');
    detector.recordEdit('b.ts');
    detector.recordEdit('a.ts');
    detector.recordEdit('b.ts');
    
    const result = detector.checkForCycles();
    expect(result.hasCycle).toBe(true);
    expect(result.reasons.some(r => r.includes('Pattern detected'))).toBe(true);
  });

  test('should reset state', () => {
    detector.recordEdit('file1.ts');
    detector.recordEdit('file1.ts');
    detector.recordEdit('file1.ts');
    
    detector.reset();
    
    const result = detector.checkForCycles();
    expect(result.hasCycle).toBe(false);
  });

  test('should track edit counts', () => {
    detector.recordEdit('file1.ts');
    detector.recordEdit('file1.ts');
    detector.recordEdit('file2.ts');
    
    expect(detector.getEditCount('file1.ts')).toBe(2);
    expect(detector.getEditCount('file2.ts')).toBe(1);
    expect(detector.getEditCount('file3.ts')).toBe(0);
  });
});

describe('ConvergenceDetector', () => {
  let detector: ConvergenceDetector;

  beforeEach(() => {
    detector = new ConvergenceDetector(50); // 50ms for fast testing
  });

  afterEach(() => {
    detector.reset();
  });

  test('should not converge with no activity', () => {
    const status = detector.checkConvergence();
    expect(status.converged).toBe(false);
    expect(status.reason).toBe('no_activity');
  });

  test('should not converge immediately after activity', () => {
    detector.recordActivity();
    
    const status = detector.checkConvergence();
    expect(status.converged).toBe(false);
    expect(status.reason).toBe('still_active');
  });

  test('should converge after quiet period', async () => {
    let converged = false;
    detector.onConvergeCallback(() => {
      converged = true;
    });
    
    detector.recordActivity();
    
    // Wait for quiet period to elapse
    await new Promise(resolve => setTimeout(resolve, 60));
    
    // Check should now be converged
    const status = detector.checkConvergence();
    expect(status.converged).toBe(true);
    expect(status.reason).toBe('quiet_period_elapsed');
  });

  test('should reset timer on new activity', async () => {
    detector.recordActivity();
    
    // Wait a bit but not long enough
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // New activity resets timer
    detector.recordActivity();
    
    // Wait again
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // Should still not be converged
    const status = detector.checkConvergence();
    expect(status.converged).toBe(false);
  });
});

describe('CascadeDepthManager', () => {
  let manager: CascadeDepthManager;
  const stateDir = '.speclang-test';

  beforeEach(() => {
    // Clean up test state directory
    if (fs.existsSync(stateDir)) {
      fs.rmSync(stateDir, { recursive: true });
    }
    manager = new CascadeDepthManager({
      ...TEST_CONFIG,
      quiet_period_ms: 50
    });
    manager.setStateDir(stateDir);
  });

  afterEach(() => {
    manager.reset();
    // Clean up test state directory
    if (fs.existsSync(stateDir)) {
      fs.rmSync(stateDir, { recursive: true });
    }
  });

  test('should start a cascade', () => {
    manager.startCascade('cascade-1');
    
    const status = manager.getStatus();
    expect(status.active).toBe(true);
    expect(status.state).not.toBeNull();
    expect(status.state!.cascade_id).toBe('cascade-1');
  });

  test('should allow file changes within limits', () => {
    manager.startCascade('cascade-2');
    
    const result1 = manager.onFileChange('file1.ts', 'agent1');
    expect(result1.allowed).toBe(true);
    expect(result1.current_depth).toBe(1);
    
    const result2 = manager.onFileChange('file2.ts', 'agent2');
    expect(result2.allowed).toBe(true);
    expect(result2.current_depth).toBe(2);
  });

  test('should reject when limit reached', () => {
    manager.startCascade('cascade-3');
    
    // Fill up to limit
    for (let i = 0; i < 5; i++) {
      manager.onFileChange(`file${i}.ts`, 'agent1');
    }
    
    const result = manager.onFileChange('file5.ts', 'agent1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('limit_reached');
  });

  test('should detect cycles and reject further changes', () => {
    const customManager = new CascadeDepthManager({
      max_depth: 10,
      max_files_per_cascade: 10,
      max_duration_ms: 60000,
      quiet_period_ms: 50
    });
    customManager.setStateDir(stateDir);
    
    customManager.startCascade('cascade-4');
    
    // Edit same file multiple times - cycle should be detected
    const result1 = customManager.onFileChange('file1.ts', 'agent1');
    expect(result1.allowed).toBe(true);
    expect(result1.current_depth).toBe(1);
    
    const result2 = customManager.onFileChange('file1.ts', 'agent1');
    expect(result2.allowed).toBe(true); // Still allowed, count = 2 < 3
    expect(result2.current_depth).toBe(2);
    
    const result3 = customManager.onFileChange('file1.ts', 'agent1');
    expect(result3.allowed).toBe(false); // Cycle detected!
    expect(result3.reason).toBe('cycle_detected');
    
    const status = customManager.getStatus();
    expect(status.state?.current_depth).toBe(2); // Stopped at 2
  });

  test('should track convergence', async () => {
    manager.startCascade('cascade-5');
    
    // Record some activity
    manager.onFileChange('file1.ts', 'agent1');
    
    // Wait for quiet period
    await new Promise(resolve => setTimeout(resolve, 60));
    
    const status = manager.getStatus();
    expect(status.convergence.converged).toBe(true);
  });

  test('should persist state on convergence', async () => {
    manager.startCascade('cascade-6');
    
    manager.onFileChange('file1.ts', 'agent1');
    manager.onFileChange('file2.ts', 'agent2');
    
    // Wait for convergence
    await new Promise(resolve => setTimeout(resolve, 60));
    
    // State file should exist
    const stateFile = path.join(stateDir, 'cascade_state.json');
    expect(fs.existsSync(stateFile)).toBe(true);
    
    const stateData = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    expect(stateData.cascade_id).toBe('cascade-6');
    expect(stateData.depth_history.length).toBe(2);
  });
});

describe('Integration: Full cascade flow', () => {
  test('should handle complete cascade flow', () => {
    const manager = new CascadeDepthManager({
      max_depth: 10,
      max_files_per_cascade: 100,
      max_duration_ms: 60000,
      quiet_period_ms: 100
    });
    
    // Start cascade
    manager.startCascade('full-cascade-test');
    
    // Simulate cascade flow from spec
    const flow = [
      { file: 'project.scl', agent: 'user', depth: 1 },
      { file: 'specs/auth.scl', agent: 'spec-writer', depth: 2 },
      { file: 'specs/auth/entities.scl', agent: 'spec-writer', depth: 3 },
      { file: 'specs/auth/operations.scl', agent: 'spec-writer', depth: 4 },
      { file: 'generated/auth.go.spec', agent: 'code-gen', depth: 5 },
      { file: 'generated/go/auth.go', agent: 'code-gen', depth: 6 },
      { file: 'tests/auth.test.spec.scl', agent: 'test-writer', depth: 7 },
      { file: 'tests/auth_test.go', agent: 'test-writer', depth: 8 },
    ];
    
    for (const step of flow) {
      const result = manager.onFileChange(step.file, step.agent);
      expect(result.allowed).toBe(true);
      expect(result.current_depth).toBe(step.depth);
    }
    
    const status = manager.getStatus();
    expect(status.state?.current_depth).toBe(8);
    expect(status.state?.files_changed).toBe(8);
  });
});
