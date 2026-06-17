import { describe, it, expect, beforeEach } from 'vitest';
import { ContextManager } from '../../src/swarm/session-persistence';

describe('ContextManager', () => {
  let cm: ContextManager;

  beforeEach(() => {
    cm = new ContextManager(8000);
  });

  describe('buildColdStart', () => {
    it('should build context with full content and deps', () => {
      const state = cm.buildColdStart('/specs/foo.spec.md', '# Foo Spec\n\ncontent here', ['/specs/bar.spec.md']);

      expect(state.tier).toBe('cold');
      expect(state.currentContent).toContain('/specs/foo.spec.md');
      expect(state.currentContent).toContain('# Foo Spec\n\ncontent here');
      expect(state.currentContent).toContain('/specs/bar.spec.md');
      expect(state.history).toEqual([]);
      expect(state.diffPatterns).toEqual([]);
      expect(state.deps).toEqual(['/specs/bar.spec.md']);
    });

    it('should handle empty deps', () => {
      const state = cm.buildColdStart('/specs/foo.spec.md', 'content', []);

      expect(state.currentContent).not.toContain('Dependencies');
      expect(state.deps).toEqual([]);
    });

    it('should handle empty content', () => {
      const state = cm.buildColdStart('/specs/empty.spec.md', '', ['dep1']);

      expect(state.currentContent).toContain('/specs/empty.spec.md');
      expect(state.deps).toEqual(['dep1']);
    });
  });

  describe('buildWarmUpdate', () => {
    it('should deliver diff and preserve existing context', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'original content', []);
      const diff = '--- a/foo\n+++ b/foo\n@@ -1 +1 @@\n-original content\n+updated content';
      const { content, state } = cm.buildWarmUpdate(cold, diff);

      expect(state.tier).toBe('warm');
      expect(content).toContain('original content');
      expect(content).toContain(diff);
      expect(state.history).toHaveLength(1);
      expect(state.history[0]).toBe(cold.currentContent);
      expect(state.diffPatterns).toHaveLength(1);
      expect(state.diffPatterns[0]).toBe(diff);
    });

    it('should accumulate history across multiple warm updates', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'v1', []);
      const { state: warm1 } = cm.buildWarmUpdate(cold, 'diff1');
      const { state: warm2 } = cm.buildWarmUpdate(warm1, 'diff2');

      expect(warm2.history).toHaveLength(2);
      expect(warm2.diffPatterns).toEqual(['diff1', 'diff2']);
    });
  });

  describe('buildCompactUpdate', () => {
    it('should summarize history on context overflow', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'x'.repeat(200), ['dep-a']);
      const warmed = cm.buildWarmUpdate(cold, 'diff-1').state;
      const { content, state } = cm.buildCompactUpdate(warmed, 'diff-2');

      expect(state.tier).toBe('compact');
      expect(content).toContain('Compact Session State');
      expect(content).toContain('Total updates applied: 2');
      expect(content).toContain('Latest Change');
      expect(content).toContain('diff-2');
      expect(content).toContain('dep-a');
    });

    it('should preserve dep information in summary', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', ['dep-a', 'dep-b']);
      const warmed = cm.buildWarmUpdate(cold, 'diff').state;
      const { content } = cm.buildCompactUpdate(warmed, 'diff2');

      expect(content).toContain('dep-a');
      expect(content).toContain('dep-b');
    });

    it('should handle compaction when context > 8000 chars', () => {
      const longContent = 'content\n'.repeat(2000);
      const cold = cm.buildColdStart('/specs/long.spec.md', longContent, []);
      expect(cold.currentContent.length).toBeGreaterThan(8000);

      const warmed = cm.buildWarmUpdate(cold, 'another diff').state;
      const { content, state } = cm.buildCompactUpdate(warmed, 'final diff');

      expect(state.tier).toBe('compact');
      expect(content.length).toBeLessThan(cold.currentContent.length);
    });
  });

  describe('buildSelfServeUpdate', () => {
    it('should send only file names when compaction still overflows', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'x'.repeat(1000), []);
      const warmed = cm.buildWarmUpdate(cold, 'diff --git a/foo.ts b/foo.ts\n--- a/foo.ts\n+++ b/foo.ts').state;
      const compacted = cm.buildCompactUpdate(warmed, 'diff --git a/bar.ts b/bar.ts').state;
      const { content, state } = cm.buildSelfServeUpdate(compacted, 'diff --git a/baz.ts b/baz.ts');

      expect(state.tier).toBe('self-serve');
      expect(content).toContain('Self-Serve Update');
      expect(content).toContain('a/baz.ts');
      expect(content).toContain('read()');
    });

    it('should handle diff without git headers gracefully', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      const warmed = cm.buildWarmUpdate(cold, 'plain diff text').state;
      const { content } = cm.buildSelfServeUpdate(warmed, 'plain diff text');

      expect(content).toContain('(unknown)');
    });
  });

  describe('selectTier', () => {
    it('should return warm after cold start', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'small content', []);
      const tier = cm.selectTier(cold);

      expect(tier).toBe('warm');
    });

    it('should return warm when context is small', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'small', []);
      const warmState = cm.buildWarmUpdate(cold, 'diff').state;

      expect(cm.selectTier(warmState)).toBe('warm');
    });

    it('should return compact when context is medium', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'x'.repeat(4500), []);
      const warmState = cm.buildWarmUpdate(cold, 'diff').state;

      const tier = cm.selectTier(warmState);
      expect(tier).toBe('compact');
    });

    it('should return self-serve when context exceeds threshold', () => {
      const largeContent = 'x'.repeat(7000);
      const cold = cm.buildColdStart('/specs/foo.spec.md', largeContent, []);
      const warmed = cm.buildWarmUpdate(cold, 'another diff').state;
      const tier = cm.selectTier(warmed);

      expect(tier).toBe('self-serve');
    });

    it('should progress: cold -> warm -> compact -> self-serve as context grows', () => {
      let state = cm.buildColdStart('/specs/foo.spec.md', 'small', []);
      expect(cm.selectTier(state)).toBe('warm');

      state = cm.buildWarmUpdate(state, 'diff').state;
      expect(cm.selectTier(state)).toBe('warm');

      const bigState = cm.buildColdStart('/specs/bar.spec.md', 'x'.repeat(5000), []);
      const warmed = cm.buildWarmUpdate(bigState, 'diff').state;
      expect(cm.selectTier(warmed)).toBe('compact');

      const hugeContent = 'x'.repeat(7000);
      const hugeState = cm.buildColdStart('/specs/baz.spec.md', hugeContent, []);
      const hugeWarmed = cm.buildWarmUpdate(hugeState, 'diff').state;
      expect(cm.selectTier(hugeWarmed)).toBe('self-serve');
    });
  });

  describe('isFlapping', () => {
    it('should return true when same diff pattern repeats 3+ times', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      const { state: s1 } = cm.buildWarmUpdate(cold, 'same-diff');
      const { state: s2 } = cm.buildWarmUpdate(s1, 'same-diff');
      const { state: s3 } = cm.buildWarmUpdate(s2, 'same-diff');

      expect(cm.isFlapping(s3)).toBe(true);
    });

    it('should return false when diff patterns are different', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      const { state: s1 } = cm.buildWarmUpdate(cold, 'diff-a');
      const { state: s2 } = cm.buildWarmUpdate(s1, 'diff-b');
      const { state: s3 } = cm.buildWarmUpdate(s2, 'diff-c');

      expect(cm.isFlapping(s3)).toBe(false);
    });

    it('should return false with fewer than 3 diffs', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      const { state: s1 } = cm.buildWarmUpdate(cold, 'diff');

      expect(cm.isFlapping(s1)).toBe(false);
    });

    it('should not trigger for exactly 2 repetitions', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      const { state: s1 } = cm.buildWarmUpdate(cold, 'same-diff');
      const { state: s2 } = cm.buildWarmUpdate(s1, 'same-diff');

      expect(cm.isFlapping(s2)).toBe(false);
    });

    it('should increment flappingEvents stat', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      const { state: s1 } = cm.buildWarmUpdate(cold, 'flap');
      const { state: s2 } = cm.buildWarmUpdate(s1, 'flap');
      const { state: s3 } = cm.buildWarmUpdate(s2, 'flap');

      expect(cm.isFlapping(s3)).toBe(true);
      expect(cm.getStats().flappingEvents).toBe(1);
    });
  });

  describe('shouldCloseOnConvergence', () => {
    it('should return false for cold start', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);

      expect(cm.shouldCloseOnConvergence(cold, 5000)).toBe(false);
    });

    it('should return false with fewer than 3 diff patterns', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      const { state: s1 } = cm.buildWarmUpdate(cold, 'diff-a');
      const { state: s2 } = cm.buildWarmUpdate(s1, 'diff-b');

      expect(s2.diffPatterns.length).toBe(2);
      expect(cm.shouldCloseOnConvergence(s2, 5000)).toBe(false);
    });

    it('should return true when same diff pattern repeats 3 times (converged)', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      const { state: s1 } = cm.buildWarmUpdate(cold, 'same-diff');
      const { state: s2 } = cm.buildWarmUpdate(s1, 'same-diff');
      const { state: s3 } = cm.buildWarmUpdate(s2, 'same-diff');

      expect(cm.shouldCloseOnConvergence(s3, 5000)).toBe(true);
    });

    it('should return false when diffs are all different', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      const { state: s1 } = cm.buildWarmUpdate(cold, 'diff-a');
      const { state: s2 } = cm.buildWarmUpdate(s1, 'diff-b');
      const { state: s3 } = cm.buildWarmUpdate(s2, 'diff-c');

      expect(cm.shouldCloseOnConvergence(s3, 5000)).toBe(false);
    });

    it('should increment convergences stat', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      const { state: s1 } = cm.buildWarmUpdate(cold, 'converging');
      const { state: s2 } = cm.buildWarmUpdate(s1, 'converging');
      const { state: s3 } = cm.buildWarmUpdate(s2, 'converging');

      expect(cm.shouldCloseOnConvergence(s3, 5000)).toBe(true);
      expect(cm.getStats().convergences).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should start with all zeros', () => {
      const stats = cm.getStats();
      expect(stats.coldStarts).toBe(0);
      expect(stats.warmReuses).toBe(0);
      expect(stats.compactions).toBe(0);
      expect(stats.selfServe).toBe(0);
      expect(stats.flappingEvents).toBe(0);
      expect(stats.convergences).toBe(0);
    });

    it('should track cold starts', () => {
      cm.buildColdStart('/specs/a.spec.md', 'a', []);
      cm.buildColdStart('/specs/b.spec.md', 'b', []);
      expect(cm.getStats().coldStarts).toBe(2);
    });

    it('should track all session types', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'content', []);
      cm.buildWarmUpdate(cold, 'diff1');

      const cold2 = cm.buildColdStart('/specs/bar.spec.md', 'x'.repeat(1000), []);
      const w = cm.buildWarmUpdate(cold2, 'diff').state;
      cm.buildCompactUpdate(w, 'diff2');

      const cold3 = cm.buildColdStart('/specs/baz.spec.md', 'content', []);
      const w2 = cm.buildWarmUpdate(cold3, 'diff').state;
      cm.buildSelfServeUpdate(w2, 'diff --git a/x.ts b/x.ts');

      const stats = cm.getStats();
      expect(stats.coldStarts).toBe(3);
      expect(stats.warmReuses).toBe(3);
      expect(stats.compactions).toBe(1);
      expect(stats.selfServe).toBe(1);
    });
  });

  describe('full context lifecycle', () => {
    it('should simulate multi-tier progression', () => {
      const cold = cm.buildColdStart('/specs/foo.spec.md', 'initial content', ['dep-a']);
      expect(cold.tier).toBe('cold');
      expect(cm.selectTier(cold)).toBe('warm');

      const { state: warm } = cm.buildWarmUpdate(cold, 'first change');
      expect(warm.tier).toBe('warm');
      expect(warm.history).toHaveLength(1);

      const { state: warm2 } = cm.buildWarmUpdate(warm, 'second change');
      expect(warm2.history).toHaveLength(2);

      const { content: compactContent, state: compact } = cm.buildCompactUpdate(warm2, 'big change');
      expect(compact.tier).toBe('compact');
      expect(compactContent).toContain('Compact Session State');

      const { content: selfServeContent, state: selfServe } = cm.buildSelfServeUpdate(compact, 'diff --git a/final.ts b/final.ts');
      expect(selfServe.tier).toBe('self-serve');
      expect(selfServeContent).toContain('a/final.ts');
    });
  });
});
