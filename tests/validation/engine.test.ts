/**
 * SPECLANG-GENERATED: Validation engine tests
 * Source: @speclang/validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationEngine, getEngine, resetEngine } from '../../src/validation/engine';
import { ValidationReporter } from '../../src/validation/reporter';
import type { ParsedSpec } from '../../src/parser/types';

describe('Validation Engine', () => {
  beforeEach(() => {
    resetEngine();
  });

  describe('Basic Validation', () => {
    it('should validate a valid spec', async () => {
      const spec: ParsedSpec = {
        filepath: 'specs/test.spec.md',
        headerLines: 12,
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          layer: 5,
          project_level: 'Alpha',
          agent_support: 'agent_autonomous',
          tags: ['test'],
          short: 'Test spec',
        },
        content: '# Content',
        blocks: [],
        references: [],
        headerRaw: '# speclang-header lines:12\nid: @specs/test\nversion: 1.0.0\nlayer: 5\nproject_level: Alpha\nagent_support: agent_autonomous\ntags: [test]\nshort: Test spec\n---\n',
      };

      const engine = new ValidationEngine();
      const report = await engine.validate(spec);

      expect(report.passed).toBe(true);
      expect(report.errors).toHaveLength(0);
    });

    it('should detect errors in invalid spec', async () => {
      const spec: ParsedSpec = {
        filepath: 'specs/test.spec.md',
        headerLines: 12,
        metadata: {
          id: 'invalid-id',
          version: '',
        },
        content: '# Content',
        blocks: [],
        references: [],
        headerRaw: '# speclang-header lines:12\nid: invalid-id\nversion: \n---\n',
      };

      const engine = new ValidationEngine();
      const report = await engine.validate(spec);

      expect(report.passed).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
    });

    it('should include warnings when present', async () => {
      const spec: ParsedSpec = {
        filepath: 'specs/test.spec.md',
        headerLines: 12,
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          agent_support: 'agent_autonomous',
          layer: 5,
          project_level: 'Alpha',
          tags: [],
          short: 'Test',
        },
        content: 'This is TBD content.',
        blocks: [],
        references: [],
        headerRaw: '# speclang-header lines:12\nid: @specs/test\nversion: 1.0.0\nagent_support: agent_autonomous\nlayer: 5\nproject_level: Alpha\ntags: []\nshort: Test\n---\n',
      };

      const engine = new ValidationEngine();
      const report = await engine.validate(spec);

      expect(report.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple specs', async () => {
      const specs: ParsedSpec[] = [
        {
          filepath: 'specs/valid.spec.md',
          headerLines: 12,
          metadata: {
            id: '@specs/valid',
            version: '1.0.0',
            layer: 5,
            project_level: 'Alpha',
            agent_support: 'agent_autonomous',
            tags: ['test'],
            short: 'Valid spec',
          },
          content: '# Content',
          blocks: [],
          references: [],
          headerRaw: '# speclang-header lines:12\nid: @specs/valid\nversion: 1.0.0\nlayer: 5\nproject_level: Alpha\nagent_support: agent_autonomous\ntags: [test]\nshort: Valid spec\n---\n',
        },
        {
          filepath: 'specs/invalid.spec.md',
          headerLines: 12,
          metadata: {
            id: '',
            version: '',
          },
          content: '# Content',
          blocks: [],
          references: [],
          headerRaw: '# speclang-header lines:12\n---\n',
        },
      ];

      const engine = new ValidationEngine();
      const reports = await engine.validateAll(specs);

      expect(reports).toHaveLength(2);
      expect(reports[0].passed).toBe(true);
      expect(reports[1].passed).toBe(false);
    });

    it('should produce batch report with summary', async () => {
      const specs: ParsedSpec[] = [
        {
          filepath: 'specs/valid.spec.md',
          headerLines: 12,
          metadata: {
            id: '@specs/valid',
            version: '1.0.0',
            layer: 5,
            project_level: 'Alpha',
            agent_support: 'agent_autonomous',
            tags: ['test'],
            short: 'Valid spec',
          },
          content: '# Content',
          blocks: [],
          references: [],
          headerRaw: '# speclang-header lines:12\nid: @specs/valid\nversion: 1.0.0\nlayer: 5\nproject_level: Alpha\nagent_support: agent_autonomous\ntags: [test]\nshort: Valid spec\n---\n',
        },
      ];

      const engine = new ValidationEngine();
      const batch = await engine.validateBatch(specs);

      expect(batch.summary.total).toBe(1);
      expect(batch.summary.passed).toBe(1);
      expect(batch.summary.failed).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should apply strict mode', async () => {
      const spec: ParsedSpec = {
        filepath: 'specs/test.spec.md',
        headerLines: 12,
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          agent_support: 'agent_autonomous',
          layer: 5,
          project_level: 'Alpha',
          tags: [],
          short: 'Test',
        },
        content: '# Content',
        blocks: [],
        references: [],
        headerRaw: '',
      };

      // Without strict mode
      const engineNormal = new ValidationEngine();
      const reportNormal = await engineNormal.validate(spec);
      expect(reportNormal.warnings.length).toBeGreaterThan(0);

      // With strict mode
      const engineStrict = new ValidationEngine({ strict: true });
      const reportStrict = await engineStrict.validate(spec);
      expect(reportStrict.errors.length).toBeGreaterThan(reportNormal.errors.length);
    });

    it('should allow custom rules', async () => {
      const engine = new ValidationEngine();
      
      const customRule = {
        id: '@validation/custom-test',
        name: 'Custom Test Rule',
        level: 'error' as const,
        check: () => [
          {
            rule: '@validation/custom-test',
            level: 'error' as const,
            location: { file: 'test', line: 1 },
            message: 'Custom rule triggered',
          },
        ],
      };

      engine.addRule(customRule);
      
      const spec: ParsedSpec = {
        filepath: 'specs/test.spec.md',
        headerLines: 12,
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
        },
        content: '# Content',
        blocks: [],
        references: [],
        headerRaw: '# speclang-header lines:12\nid: @specs/test\nversion: 1.0.0\n---\n',
      };

      const report = await engine.validate(spec);
      const customErrors = report.errors.filter(e => e.rule === '@validation/custom-test');
      expect(customErrors.length).toBe(1);
    });
  });

  describe('Configuration', () => {
    it('should apply strict mode', async () => {
      const spec: ParsedSpec = {
        filepath: 'specs/test.spec.md',
        headerLines: 12,
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          agent_support: 'agent_autonomous',
          layer: 5,
          project_level: 'Alpha',
          tags: [],
          short: 'Test',
        },
        content: '# Content',
        blocks: [],
        references: [],
        headerRaw: '# speclang-header lines:12\nid: @specs/test\nversion: 1.0.0\nagent_support: agent_autonomous\nlayer: 5\nproject_level: Alpha\ntags: []\nshort: Test\n---\n',
      };

      // Without strict mode
      const engineNormal = new ValidationEngine();
      const reportNormal = await engineNormal.validate(spec);
      expect(reportNormal.warnings.length).toBeGreaterThan(0);

      // With strict mode
      const engineStrict = new ValidationEngine({ strict: true });
      const reportStrict = await engineStrict.validate(spec);
      expect(reportStrict.errors.length).toBeGreaterThan(reportNormal.errors.length);
    });
  });

  describe('Reporter', () => {
    it('should format a passed report', () => {
      const reporter = new ValidationReporter();
      
      const report = {
        file: 'specs/test.spec.md',
        errors: [],
        warnings: [],
        passed: true,
        timestamp: new Date(),
      };

      const output = reporter.format(report);
      expect(output).toContain('✓ Passed');
    });

    it('should format a failed report', () => {
      const reporter = new ValidationReporter();
      
      const report = {
        file: 'specs/test.spec.md',
        errors: [
          {
            rule: '@validation/id',
            level: 'error' as const,
            location: { file: 'specs/test.spec.md', line: 'header' as const },
            message: 'ID must start with @',
          },
        ],
        warnings: [],
        passed: false,
        timestamp: new Date(),
      };

      const output = reporter.format(report);
      expect(output).toContain('✗ Failed');
      expect(output).toContain('ID must start with @');
    });

    it('should include suggestions in verbose mode', () => {
      const reporter = new ValidationReporter(true);
      
      const report = {
        file: 'specs/test.spec.md',
        errors: [
          {
            rule: '@validation/id',
            level: 'error' as const,
            location: { file: 'specs/test.spec.md', line: 'header' as const },
            message: 'ID must start with @',
            suggestion: 'Format: @domain/path',
          },
        ],
        warnings: [],
        passed: false,
        timestamp: new Date(),
      };

      const output = reporter.format(report);
      expect(output).toContain('💡');
      expect(output).toContain('Format: @domain/path');
    });
  });

  describe('Global Engine', () => {
    it('should get global engine instance', () => {
      const engine1 = getEngine();
      const engine2 = getEngine();
      
      expect(engine1).toBe(engine2);
    });

    it('should reset global engine', () => {
      const engine1 = getEngine();
      resetEngine();
      const engine2 = getEngine();
      
      expect(engine1).not.toBe(engine2);
    });
  });
});
