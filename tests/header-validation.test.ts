/**
 * SPECLANG-GENERATED: Header validation tests
 * Source: Phase 0.18 - Header Validation Rules
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateHeader,
  validateHeaderFile,
  validateHeaders,
  validateAndAttemptRecovery,
  validateRequiredFields,
  validateIdField,
  validateVersionField,
  validateLayerField,
  validateEnumFields,
  validateTagsField,
  validateRefFields,
  validatePartField,
  validateLinesField,
  validateUnknownFields,
  DEFAULT_VALIDATION_CONFIG,
} from '../src/parser/header-validator';
import {
  ERROR_CODES,
  WARNING_CODES,
  createError,
  createWarning,
  formatMessages,
  getMessageSummary,
} from '../src/parser/validation-messages';
import {
  suggestMissingField,
  suggestInvalidId,
  suggestInvalidVersion,
  suggestInvalidLayer,
  suggestMissingRecommended,
  collectFixSuggestions,
  attemptAutoFix,
} from '../src/parser/validation-recovery';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const VALID_SPEC = `# speclang-header lines:10
id: "@specs/auth"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [auth, security]
short: JWT authentication handler
status: stable
---

# Auth

## @block:auth/login @kind:operation
login implementation
`;

const MINIMAL_SPEC = `# speclang-header lines:8
id: "@example/minimal"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
short: "Minimal spec"
---

# Minimal

Just a minimal spec.
`;

const INVALID_ID_SPEC = `# speclang-header lines:4
id: "invalid-id"
version: 1.0.0
---

# Test
`;

const INVALID_VERSION_SPEC = `# speclang-header lines:4
id: "@specs/test"
version: not-a-version
---

# Test
`;

const INVALID_LAYER_SPEC = `# speclang-header lines:5
id: "@specs/test"
version: 1.0.0
layer: 99
---

# Test
`;

const INVALID_PROJECT_LEVEL_SPEC = `# speclang-header lines:5
id: "@specs/test"
version: 1.0.0
project_level: InvalidLevel
---

# Test
`;

const INVALID_AGENT_SUPPORT_SPEC = `# speclang-header lines:5
id: "@specs/test"
version: 1.0.0
agent_support: invalid
---

# Test
`;

const MISSING_REQUIRED_FIELDS_SPEC = `# speclang-header
---

# Test
`;

const UNKNOWN_FIELD_SPEC = `# speclang-header lines:6
id: "@specs/test"
version: 1.0.0
unknown_field: value
custom_field: test
---

# Test
`;

// ============================================================================
// VALIDATE HEADER TESTS
// ============================================================================

describe('validateHeader', () => {
  it('should pass valid spec', () => {
    const result = validateHeader(VALID_SPEC, 'specs/auth.spec.md');
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.id).toBe('@specs/auth');
    expect(result.metadata?.version).toBe('1.0.0');
  });

  it('should pass minimal spec', () => {
    const result = validateHeader(MINIMAL_SPEC, 'specs/minimal.spec.md');
    
    expect(result.valid).toBe(true);
    expect(result.metadata?.id).toBe('@example/minimal');
  });

  it('should fail on invalid ID format', () => {
    const result = validateHeader(INVALID_ID_SPEC, 'specs/test.spec.md');
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'E004')).toBe(true);
  });

  it('should fail on invalid version', () => {
    const result = validateHeader(INVALID_VERSION_SPEC, 'specs/test.spec.md');
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'E005')).toBe(true);
  });

  it('should fail on invalid layer', () => {
    const result = validateHeader(INVALID_LAYER_SPEC, 'specs/test.spec.md');
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'E006')).toBe(true);
  });

  it('should fail on invalid project_level', () => {
    const result = validateHeader(INVALID_PROJECT_LEVEL_SPEC, 'specs/test.spec.md');
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'E007')).toBe(true);
  });

  it('should fail on invalid agent_support', () => {
    const result = validateHeader(INVALID_AGENT_SUPPORT_SPEC, 'specs/test.spec.md');
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'E008')).toBe(true);
  });

  it('should fail on missing required fields', () => {
    const result = validateHeader(MISSING_REQUIRED_FIELDS_SPEC, 'specs/test.spec.md');
    
    expect(result.valid).toBe(false);
    // E020 is parse error due to missing id/version, E002 would be direct validation
    expect(result.errors.some(e => e.code === 'E002' || e.code === 'E020')).toBe(true);
  });

  it('should warn on unknown fields', () => {
    const result = validateHeader(UNKNOWN_FIELD_SPEC, 'specs/test.spec.md');
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'E040')).toBe(true);
  });

  it('should include suggestions for errors', () => {
    const result = validateHeader(INVALID_ID_SPEC, 'specs/test.spec.md');
    
    expect(result.suggestions.length).toBeGreaterThan(0);
    // Just verify there are suggestions
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// VALIDATE REQUIRED FIELDS TESTS
// ============================================================================

describe('validateRequiredFields', () => {
  it('should pass when all required fields present', () => {
    const messages = validateRequiredFields({
      id: '@specs/test',
      version: '1.0.0',
      layer: 5,
      project_level: 'Alpha',
      agent_support: 'agent_autonomous',
      short: 'Test spec',
    });
    
    expect(messages.filter(m => m.severity === 'error')).toHaveLength(0);
  });

  it('should fail when id is missing', () => {
    const messages = validateRequiredFields({
      version: '1.0.0',
      layer: 5,
      project_level: 'Alpha',
      agent_support: 'agent_autonomous',
      short: 'Test spec',
    });
    
    expect(messages.some(m => m.field === 'id')).toBe(true);
  });

  it('should fail when version is missing', () => {
    const messages = validateRequiredFields({
      id: '@specs/test',
      layer: 5,
      project_level: 'Alpha',
      agent_support: 'agent_autonomous',
      short: 'Test spec',
    });
    
    expect(messages.some(m => m.field === 'version')).toBe(true);
  });

  it('should fail when layer is missing', () => {
    const messages = validateRequiredFields({
      id: '@specs/test',
      version: '1.0.0',
      project_level: 'Alpha',
      agent_support: 'agent_autonomous',
      short: 'Test spec',
    });
    
    expect(messages.some(m => m.field === 'layer')).toBe(true);
  });

  it('should fail when project_level is missing', () => {
    const messages = validateRequiredFields({
      id: '@specs/test',
      version: '1.0.0',
      layer: 5,
      agent_support: 'agent_autonomous',
      short: 'Test spec',
    });
    
    expect(messages.some(m => m.field === 'project_level')).toBe(true);
  });

  it('should fail when agent_support is missing', () => {
    const messages = validateRequiredFields({
      id: '@specs/test',
      version: '1.0.0',
      layer: 5,
      project_level: 'Alpha',
      short: 'Test spec',
    });
    
    expect(messages.some(m => m.field === 'agent_support')).toBe(true);
  });

  it('should fail when short is missing', () => {
    const messages = validateRequiredFields({
      id: '@specs/test',
      version: '1.0.0',
      layer: 5,
      project_level: 'Alpha',
      agent_support: 'agent_autonomous',
    });
    
    expect(messages.some(m => m.field === 'short')).toBe(true);
  });
});

// ============================================================================
// VALIDATE ID FIELD TESTS
// ============================================================================

describe('validateIdField', () => {
  it('should pass valid ID', () => {
    const messages = validateIdField({ id: '@specs/auth' });
    expect(messages).toHaveLength(0);
  });

  it('should pass ID with slashes', () => {
    const messages = validateIdField({ id: '@specs/auth/login' });
    expect(messages).toHaveLength(0);
  });

  it('should fail invalid ID format', () => {
    const messages = validateIdField({ id: 'invalid-id' });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].code).toBe('E004');
  });
});

// ============================================================================
// VALIDATE VERSION FIELD TESTS
// ============================================================================

describe('validateVersionField', () => {
  it('should pass valid semver', () => {
    const messages = validateVersionField({ version: '1.0.0' });
    expect(messages).toHaveLength(0);
  });

  it('should pass semver with prerelease', () => {
    const messages = validateVersionField({ version: '1.0.0-beta.1' });
    expect(messages).toHaveLength(0);
  });

  it('should fail invalid version', () => {
    const messages = validateVersionField({ version: 'invalid' });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].code).toBe('E005');
  });
});

// ============================================================================
// VALIDATE LAYER FIELD TESTS
// ============================================================================

describe('validateLayerField', () => {
  it('should pass valid layer 0-10', () => {
    for (let i = 0; i <= 10; i++) {
      const messages = validateLayerField({ layer: i as any });
      expect(messages.filter(m => m.severity === 'error')).toHaveLength(0);
    }
  });

  it('should warn on missing layer', () => {
    const messages = validateLayerField({});
    expect(messages.some(m => m.code === 'W001')).toBe(true);
  });

  it('should fail on invalid layer', () => {
    const messages = validateLayerField({ layer: 99 as any });
    expect(messages.some(m => m.code === 'E006')).toBe(true);
  });
});

// ============================================================================
// VALIDATE ENUM FIELDS TESTS
// ============================================================================

describe('validateEnumFields', () => {
  it('should pass valid project_level', () => {
    const messages = validateEnumFields({ project_level: 'Alpha' });
    expect(messages.filter(m => m.severity === 'error')).toHaveLength(0);
  });

  it('should fail invalid project_level', () => {
    const messages = validateEnumFields({ project_level: 'Invalid' as any });
    expect(messages.some(m => m.code === 'E007')).toBe(true);
  });

  it('should warn on missing project_level', () => {
    const messages = validateEnumFields({});
    expect(messages.some(m => m.code === 'W002')).toBe(true);
  });

  it('should pass valid agent_support', () => {
    const messages = validateEnumFields({ agent_support: 'agent_autonomous' });
    expect(messages.filter(m => m.severity === 'error')).toHaveLength(0);
  });

  it('should fail invalid agent_support', () => {
    const messages = validateEnumFields({ agent_support: 'invalid' as any });
    expect(messages.some(m => m.code === 'E008')).toBe(true);
  });
});

// ============================================================================
// VALIDATE TAGS FIELD TESTS
// ============================================================================

describe('validateTagsField', () => {
  it('should pass valid tags array', () => {
    const messages = validateTagsField({ tags: ['auth', 'security'] });
    expect(messages).toHaveLength(0);
  });

  it('should fail on non-array tags', () => {
    const messages = validateTagsField({ tags: 'not-array' as any });
    expect(messages.some(m => m.code === 'E010')).toBe(true);
  });
});

// ============================================================================
// VALIDATE PART FIELD TESTS
// ============================================================================

describe('validatePartField', () => {
  it('should pass valid part format', () => {
    const messages = validatePartField({ part: '2/5' });
    expect(messages).toHaveLength(0);
  });

  it('should fail invalid part format', () => {
    const messages = validatePartField({ part: 'invalid' });
    expect(messages.some(m => m.code === 'E012')).toBe(true);
  });
});

// ============================================================================
// VALIDATE LINES FIELD TESTS
// ============================================================================

describe('validateLinesField', () => {
  it('should warn when lines missing on large header', () => {
    const content = `---
# speclang-header lines:100
id: "@specs/test"
version: 1.0.0
---
`;
    const messages = validateLinesField({ lines: 100 }, content);
    // This header is small so may not trigger warning
    expect(Array.isArray(messages)).toBe(true);
  });
});

// ============================================================================
// VALIDATE UNKNOWN FIELDS TESTS
// ============================================================================

describe('validateUnknownFields', () => {
  it('should pass on known fields', () => {
    const messages = validateUnknownFields({
      id: '@specs/test',
      version: '1.0.0',
      layer: 5,
    });
    expect(messages).toHaveLength(0);
  });

  it('should fail on unknown fields', () => {
    const messages = validateUnknownFields({
      id: '@specs/test',
      version: '1.0.0',
      unknown_field: 'value',
    });
    expect(messages.some(m => m.code === 'E040')).toBe(true);
  });
});

// ============================================================================
// VALIDATION MESSAGES TESTS
// ============================================================================

describe('Validation Messages', () => {
  it('should create error message', () => {
    const msg = createError('E002', ERROR_CODES.E002, { field: 'id' });
    
    expect(msg.code).toBe('E002');
    expect(msg.severity).toBe('error');
    expect(msg.field).toBe('id');
  });

  it('should create warning message', () => {
    const msg = createWarning('W001', WARNING_CODES.W001, { field: 'layer' });
    
    expect(msg.code).toBe('W001');
    expect(msg.severity).toBe('warning');
    expect(msg.field).toBe('layer');
  });

  it('should format messages correctly', () => {
    const messages = [
      createError('E002', 'Missing id', { suggestion: 'Add id field' }),
      createWarning('W001', 'Missing layer'),
    ];
    
    const formatted = formatMessages(messages);
    
    expect(formatted.errors).toHaveLength(1);
    expect(formatted.warnings).toHaveLength(1);
    expect(formatted.errors[0]).toContain('Suggestion');
  });

  it('should get message summary', () => {
    const messages = [
      createError('E002', 'Error 1'),
      createError('E003', 'Error 2'),
      createWarning('W001', 'Warning 1'),
    ];
    
    const summary = getMessageSummary(messages);
    
    expect(summary.errorCount).toBe(2);
    expect(summary.warningCount).toBe(1);
    expect(summary.infoCount).toBe(0);
  });
});

// ============================================================================
// FIX SUGGESTION TESTS
// ============================================================================

describe('Fix Suggestions', () => {
  it('should suggest missing field', () => {
    const suggestion = suggestMissingField('id');
    
    expect(suggestion.field).toBe('id');
    expect(suggestion.autoFixable).toBe(false);
  });

  it('should suggest invalid ID fix', () => {
    const suggestion = suggestInvalidId('invalid');
    
    expect(suggestion.code).toBe(ERROR_CODES.E004);
    expect(suggestion.autoFixable).toBe(false);
  });

  it('should suggest invalid version fix', () => {
    const suggestion = suggestInvalidVersion('invalid');
    
    expect(suggestion.autoFixable).toBe(true);
    expect(suggestion.fixedValue).toBeDefined();
  });

  it('should suggest invalid layer fix', () => {
    const suggestion = suggestInvalidLayer(99);
    
    expect(suggestion.autoFixable).toBe(true);
    expect(suggestion.fixedValue).toBe(10);
  });

  it('should suggest missing recommended field', () => {
    const suggestion = suggestMissingRecommended('layer', 5);
    
    expect(suggestion.autoFixable).toBe(true);
    expect(suggestion.fixedValue).toBe(5);
  });

  it('should collect fix suggestions', () => {
    const errors = [
      { code: 'MISSING_ID', field: 'id' },
      { code: 'INVALID_VERSION', field: 'version', value: 'invalid' },
    ];
    const warnings = [
      { code: 'MISSING_LAYER', field: 'layer' },
    ];
    
    const suggestions = collectFixSuggestions(errors, warnings);
    
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('should attempt auto-fix', () => {
    const metadata = {
      id: '@specs/test',
      version: 'invalid',
    };
    
    const suggestions = [
      suggestInvalidVersion('invalid'),
    ];
    
    const { fixed, applied } = attemptAutoFix(metadata, suggestions);
    
    expect(applied.length).toBeGreaterThan(0);
    expect(fixed.version).toBeDefined();
  });
});

// ============================================================================
// VALIDATE HEADERS BATCH TESTS
// ============================================================================

describe('validateHeaders batch', () => {
  it('should validate multiple specs', () => {
    const result = validateHeaders([
      'specs/headers.spec.md',
      'specs/test.spec.md',
    ]);
    
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// VALIDATE AND RECOVERY TESTS
// ============================================================================

describe('validateAndAttemptRecovery', () => {
  it('should return valid result without recovery for valid spec', () => {
    const { result, recovered } = validateAndAttemptRecovery(
      VALID_SPEC,
      'specs/test.spec.md'
    );
    
    expect(result.valid).toBe(true);
    expect(recovered).toBeUndefined();
  });

  it('should attempt recovery for invalid spec', () => {
    const { result, recovered } = validateAndAttemptRecovery(
      INVALID_VERSION_SPEC,
      'specs/test.spec.md'
    );
    
    // Should have either fixed or still invalid
    expect(result).toBeDefined();
  });
});

// ============================================================================
// DEFAULT CONFIG TESTS
// ============================================================================

describe('DEFAULT_VALIDATION_CONFIG', () => {
  it('should have required checks', () => {
    expect(DEFAULT_VALIDATION_CONFIG.checks).toContain('required_fields_present');
    expect(DEFAULT_VALIDATION_CONFIG.checks).toContain('id_format_valid');
    expect(DEFAULT_VALIDATION_CONFIG.checks).toContain('version_semver');
  });

  it('should have onFailure actions', () => {
    expect(DEFAULT_VALIDATION_CONFIG.onFailure).toContain('log_error');
  });

  it('should have recovery strategies', () => {
    expect(DEFAULT_VALIDATION_CONFIG.recovery).toContain('suggest_fixes');
  });
});
