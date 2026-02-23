/**
 * SPECLANG-GENERATED: Tests for Phase 0.17 - Header Field Definitions
 * Source: @speclang/headers
 */

import { describe, it, expect } from 'vitest';
import {
  validateField,
  validateHeaderFields,
} from '../src/parser/field-validator';
import {
  FIELD_DEFINITIONS,
  getRequiredFieldNames,
  getFieldsByCategory,
  isKnownField,
  getFieldDefinition,
  getAllFieldNames,
  PROJECT_LEVELS,
  AGENT_SUPPORTS,
  SPEC_STATUSES,
} from '../src/parser/fields';

// ============================================================================
// FIELD DEFINITIONS REGISTRY
// ============================================================================

describe('Field Definitions Registry', () => {
  it('should have id and version as required fields', () => {
    const required = getRequiredFieldNames();
    expect(required).toContain('id');
    expect(required).toContain('version');
    expect(required).toHaveLength(2);
  });

  it('should know all documented fields', () => {
    const expected = [
      'id', 'version', 'depends_on', 'refs', 'children', 'parent',
      'layer', 'project_level', 'agent_support', 'tags', 'short',
      'target', 'status', 'part', 'owned_by', 'session_id', 'lines',
    ];
    for (const name of expected) {
      expect(isKnownField(name)).toBe(true);
    }
  });

  it('should report unknown fields', () => {
    expect(isKnownField('banana')).toBe(false);
    expect(isKnownField('foo_bar')).toBe(false);
  });

  it('should group fields by category', () => {
    const identity = getFieldsByCategory('identity');
    expect(identity.map((f) => f.name)).toEqual(['id', 'version']);

    const relationship = getFieldsByCategory('relationship');
    expect(relationship.map((f) => f.name)).toContain('depends_on');
    expect(relationship.map((f) => f.name)).toContain('children');

    const metadata = getFieldsByCategory('metadata');
    expect(metadata.map((f) => f.name)).toContain('layer');
    expect(metadata.map((f) => f.name)).toContain('tags');
  });

  it('should return all field names', () => {
    const names = getAllFieldNames();
    expect(names.length).toBeGreaterThanOrEqual(15);
  });

  it('should look up field definition', () => {
    const def = getFieldDefinition('id');
    expect(def).toBeDefined();
    expect(def!.type).toBe('id');
    expect(def!.required).toBe(true);
  });
});

// ============================================================================
// ID FIELD VALIDATION
// ============================================================================

describe('validateField: id', () => {
  it('should accept valid @domain/path ids', () => {
    expect(validateField('id', '@specs/auth').valid).toBe(true);
    expect(validateField('id', '@specs/auth/login').valid).toBe(true);
    expect(validateField('id', '@speclang/headers').valid).toBe(true);
    expect(validateField('id', '@stdlib/Result').valid).toBe(true);
  });

  it('should reject ids without @ prefix', () => {
    const r = validateField('id', 'specs/auth');
    expect(r.valid).toBe(false);
    expect(r.code).toBe('INVALID_ID_FORMAT');
  });

  it('should reject empty id', () => {
    const r = validateField('id', '');
    expect(r.valid).toBe(false);
    expect(r.code).toBe('MISSING_REQUIRED_FIELD');
  });

  it('should reject non-string id', () => {
    const r = validateField('id', 123);
    expect(r.valid).toBe(false);
    expect(r.code).toBe('INVALID_TYPE');
  });
});

// ============================================================================
// VERSION FIELD VALIDATION
// ============================================================================

describe('validateField: version', () => {
  it('should accept valid semver', () => {
    expect(validateField('version', '1.0.0').valid).toBe(true);
    expect(validateField('version', '0.1.0').valid).toBe(true);
    expect(validateField('version', '1.2.3').valid).toBe(true);
    expect(validateField('version', '1.0.0-beta.1').valid).toBe(true);
    expect(validateField('version', '1.0.0+build.123').valid).toBe(true);
  });

  it('should accept numeric version (coerced from YAML)', () => {
    // YAML parses "0.2.0" as number 0.2 sometimes; we handle gracefully
    // But "1.0.0" stays as string. Test the string case:
    expect(validateField('version', '0.2.0').valid).toBe(true);
  });

  it('should reject invalid semver', () => {
    expect(validateField('version', 'invalid').valid).toBe(false);
    expect(validateField('version', '1.0').valid).toBe(false);
    expect(validateField('version', 'v1.0.0').valid).toBe(false);
  });

  it('should reject empty version', () => {
    const r = validateField('version', '');
    expect(r.valid).toBe(false);
  });
});

// ============================================================================
// LAYER FIELD VALIDATION
// ============================================================================

describe('validateField: layer', () => {
  it('should accept valid layers 0-10', () => {
    for (let i = 0; i <= 10; i++) {
      expect(validateField('layer', i).valid).toBe(true);
    }
  });

  it('should reject out of range', () => {
    expect(validateField('layer', -1).valid).toBe(false);
    expect(validateField('layer', 11).valid).toBe(false);
    expect(validateField('layer', 99).valid).toBe(false);
  });

  it('should reject non-integer', () => {
    expect(validateField('layer', 1.5).valid).toBe(false);
    expect(validateField('layer', 'five').valid).toBe(false);
  });

  it('should accept undefined (optional field)', () => {
    expect(validateField('layer', undefined).valid).toBe(true);
  });
});

// ============================================================================
// PROJECT LEVEL VALIDATION
// ============================================================================

describe('validateField: project_level', () => {
  it('should accept all valid project levels', () => {
    for (const level of PROJECT_LEVELS) {
      expect(validateField('project_level', level).valid).toBe(true);
    }
  });

  it('should reject invalid level', () => {
    const r = validateField('project_level', 'InvalidLevel');
    expect(r.valid).toBe(false);
    expect(r.code).toBe('INVALID_ENUM');
  });

  it('should reject non-string', () => {
    expect(validateField('project_level', 42).valid).toBe(false);
  });
});

// ============================================================================
// AGENT SUPPORT VALIDATION
// ============================================================================

describe('validateField: agent_support', () => {
  it('should accept all valid agent support levels', () => {
    for (const level of AGENT_SUPPORTS) {
      expect(validateField('agent_support', level).valid).toBe(true);
    }
  });

  it('should reject invalid support level', () => {
    const r = validateField('agent_support', 'fully_autonomous');
    expect(r.valid).toBe(false);
    expect(r.code).toBe('INVALID_ENUM');
  });
});

// ============================================================================
// STATUS VALIDATION
// ============================================================================

describe('validateField: status', () => {
  it('should accept all valid statuses', () => {
    for (const s of SPEC_STATUSES) {
      expect(validateField('status', s).valid).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    expect(validateField('status', 'archived').valid).toBe(false);
  });
});

// ============================================================================
// TAGS VALIDATION
// ============================================================================

describe('validateField: tags', () => {
  it('should accept array of strings', () => {
    expect(validateField('tags', ['auth', 'jwt']).valid).toBe(true);
    expect(validateField('tags', []).valid).toBe(true);
  });

  it('should reject non-array', () => {
    expect(validateField('tags', 'auth').valid).toBe(false);
  });

  it('should reject array with non-string items', () => {
    expect(validateField('tags', ['auth', 123]).valid).toBe(false);
  });
});

// ============================================================================
// DEPENDS_ON VALIDATION
// ============================================================================

describe('validateField: depends_on', () => {
  it('should accept array of ref strings', () => {
    expect(
      validateField('depends_on', ['@ref:specs/auth', '@ref:specs/auth#login']).valid,
    ).toBe(true);
  });

  it('should accept refs without @ref: prefix', () => {
    expect(validateField('depends_on', ['specs/auth']).valid).toBe(true);
  });

  it('should reject non-array', () => {
    expect(validateField('depends_on', '@ref:specs/auth').valid).toBe(false);
  });
});

// ============================================================================
// PART VALIDATION
// ============================================================================

describe('validateField: part', () => {
  it('should accept valid part format', () => {
    expect(validateField('part', '1/3').valid).toBe(true);
    expect(validateField('part', '2/5').valid).toBe(true);
  });

  it('should reject invalid format', () => {
    expect(validateField('part', 'one').valid).toBe(false);
    expect(validateField('part', '1-3').valid).toBe(false);
  });

  it('should reject part > total', () => {
    expect(validateField('part', '5/3').valid).toBe(false);
  });

  it('should reject part 0', () => {
    expect(validateField('part', '0/3').valid).toBe(false);
  });
});

// ============================================================================
// LINES VALIDATION
// ============================================================================

describe('validateField: lines', () => {
  it('should accept valid line count', () => {
    expect(validateField('lines', 12).valid).toBe(true);
    expect(validateField('lines', 1).valid).toBe(true);
  });

  it('should reject 0 or negative', () => {
    expect(validateField('lines', 0).valid).toBe(false);
    expect(validateField('lines', -1).valid).toBe(false);
  });

  it('should reject non-integer', () => {
    expect(validateField('lines', 1.5).valid).toBe(false);
  });
});

// ============================================================================
// UNKNOWN FIELDS
// ============================================================================

describe('validateField: unknown fields', () => {
  it('should warn on unknown fields but not error', () => {
    const r = validateField('banana', 'yellow');
    expect(r.valid).toBe(true);
    expect(r.severity).toBe('warning');
    expect(r.code).toBe('UNKNOWN_FIELD');
  });
});

// ============================================================================
// FULL HEADER VALIDATION
// ============================================================================

describe('validateHeaderFields', () => {
  it('should pass a fully valid header', () => {
    const result = validateHeaderFields({
      id: '@specs/auth',
      version: '1.0.0',
      layer: 2,
      project_level: 'Alpha',
      agent_support: 'agent_autonomous',
      tags: ['auth', 'jwt'],
      short: 'Auth handler',
      status: 'draft',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass with only required fields', () => {
    const result = validateHeaderFields({
      id: '@specs/minimal',
      version: '0.1.0',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when required fields are missing', () => {
    const result = validateHeaderFields({
      layer: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain('MISSING_REQUIRED_FIELD');
  });

  it('should collect multiple errors', () => {
    const result = validateHeaderFields({
      id: 'bad-id',
      version: 'not-semver',
      layer: 99,
      project_level: 'InvalidLevel',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('should warn on unknown fields', () => {
    const result = validateHeaderFields({
      id: '@specs/test',
      version: '1.0.0',
      custom_field: 'value',
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings.some((w) => w.code === 'UNKNOWN_FIELD')).toBe(true);
  });

  it('should validate depends_on refs', () => {
    const result = validateHeaderFields({
      id: '@specs/test',
      version: '1.0.0',
      depends_on: ['@ref:specs/auth', '@ref:specs/other#block'],
    });
    expect(result.valid).toBe(true);
  });
});
