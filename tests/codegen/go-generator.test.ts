/**
 * SPECLANG-GENERATED: Go generator tests
 * Source: @speclang/compiler.spec.dir/go
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GoGenerator, createGoGenerator } from '../../src/compiler/targets/go';
import { mapGoType, getGoZeroValue } from '../../src/compiler/go/types';
import { isStdlibPackage, isBuiltinType } from '../../src/compiler/go/builtins';

describe('GoGenerator', () => {
  let generator: GoGenerator;

  beforeEach(() => {
    generator = createGoGenerator({ packageName: 'auth' });
  });

  describe('generateStruct', () => {
    it('should generate struct with basic types', () => {
      const result = generator.generateStruct('User', [
        { name: 'id', type: 'UUID' },
        { name: 'email', type: 'String' },
        { name: 'name', type: 'String' },
      ]);

      expect(result).toContain('type User struct');
      expect(result).toContain('ID');
      expect(result).toContain('uuid.UUID');
      expect(result).toContain('Email');
      expect(result).toContain('string');
    });

    it('should generate struct with JSON tags', () => {
      const result = generator.generateStruct('User', [
        { name: 'id', type: 'String', jsonName: 'user_id' },
      ]);

      expect(result).toContain('`json:"user_id"`');
    });

    it('should handle optional fields with omitempty', () => {
      const result = generator.generateStruct('User', [
        { name: 'nickname', type: 'String', optional: true },
      ]);

      expect(result).toContain('`json:"nickname,omitempty"`');
    });

    it('should handle array types', () => {
      const result = generator.generateStruct('User', [
        { name: 'roles', type: 'Array<String>' },
      ]);

      expect(result).toContain('[]string');
    });

    it('should handle map types', () => {
      const result = generator.generateStruct('User', [
        { name: 'metadata', type: 'Map<String,String>' },
      ]);

      expect(result).toContain('map[string]string');
    });

    it('should handle optional pointer types', () => {
      const result = generator.generateStruct('User', [
        { name: 'bio', type: 'Optional<String>' },
      ]);

      expect(result).toContain('*string');
    });

    it('should handle time types with imports', () => {
      const result = generator.generateStruct('User', [
        { name: 'createdAt', type: 'DateTime' },
      ]);

      expect(result).toContain('time.Time');
    });
  });

  describe('generateInterface', () => {
    it('should generate interface with methods', () => {
      const result = generator.generateInterface('UserRepository', [
        { name: 'FindByID', params: 'id string', returns: '(*User, error)' },
        { name: 'Save', params: 'user *User', returns: 'error' },
      ]);

      expect(result).toContain('type UserRepository interface');
      expect(result).toContain('FindByID');
      expect(result).toContain('Save');
    });
  });

  describe('generateFunction', () => {
    it('should generate standalone function', () => {
      const result = generator.generateFunction(
        'Greet',
        'name string',
        'string',
        '  return "Hello, " + name'
      );

      expect(result).toContain('func greet(name string) (string)');
      expect(result).toContain('return "Hello, " + name');
    });

    it('should generate method with receiver', () => {
      const result = generator.generateFunction(
        'Greet',
        'name string',
        'string',
        '  return "Hello, " + name',
        'User'
      );

      expect(result).toContain('func (r *User) greet');
    });
  });

  describe('generateEnum', () => {
    it('should generate enum with iota', () => {
      const result = generator.generateEnum('UserRole', [
        'Admin',
        'User',
        'Guest',
      ]);

      expect(result).toContain('type UserRole int');
      expect(result).toContain('ADMIN UserRole = iota');
      expect(result).toContain('USER');
      expect(result).toContain('GUEST');
    });
  });
  });

  describe('formatImports', () => {
    it('should group stdlib and third-party imports', () => {
      generator.generateStruct('User', [
        { name: 'id', type: 'UUID' },
        { name: 'createdAt', type: 'DateTime' },
      ]);

      const imports = generator.formatImports();
      expect(imports).toContain('"time"');
      expect(imports).toContain('"github.com/google/uuid"');
    });

    it('should return empty', () => {
      generator.generateStruct('User', [
        { name: 'name', type: 'String' },
      ]);

      const imports = generator.formatImports();
      expect(imports).toBe('');
    });
  });

  describe('fileHeader', () => {
    it('should generate file header with package', () => {
      const header = generator.fileHeader('specs/auth/user.go.spec', 'auth');
      expect(header).toContain('package auth');
      expect(header).toContain('specs/auth/user.go.spec');
    });
  });

  describe('mapType', () => {
    it('should map String to string', () => {
      expect(generator.mapType('String')).toBe('string');
    });

    it('should map Int to int', () => {
      expect(generator.mapType('Int')).toBe('int');
    });

    it('should map Bool to bool', () => {
      expect(generator.mapType('Bool')).toBe('bool');
    });

    it('should map Array<String> to []string', () => {
      expect(generator.mapType('Array<String>')).toBe('[]string');
    });

    it('should map Optional<String> to *string', () => {
      expect(generator.mapType('Optional<String>')).toBe('*string');
    });

    it('should map Map<String,Int> to map[string]int', () => {
      expect(generator.mapType('Map<String,Int>')).toBe('map[string]int');
    });
  });
});

describe('mapGoType', () => {
  it('should return type and imports for UUID', () => {
    const result = mapGoType('UUID');
    expect(result.type).toBe('uuid.UUID');
    expect(result.imports).toContain('github.com/google/uuid');
  });

  it('should return type and imports for DateTime', () => {
    const result = mapGoType('DateTime');
    expect(result.type).toBe('time.Time');
    expect(result.imports).toContain('time');
  });

  it('should handle nested generics', () => {
    const result = mapGoType('Array<Array<Int>>');
    expect(result.type).toBe('[][]int');
  });
});

describe('getGoZeroValue', () => {
  it('should return zero value for String', () => {
    expect(getGoZeroValue('String')).toBe('""');
  });

  it('should return zero value for Int', () => {
    expect(getGoZeroValue('Int')).toBe('0');
  });

  it('should return nil for arrays', () => {
    expect(getGoZeroValue('Array<String>')).toBe('nil');
  });

  it('should return nil for maps', () => {
    expect(getGoZeroValue('Map<String,Int>')).toBe('nil');
  });
});

describe('isStdlibPackage', () => {
  it('should recognize stdlib packages', () => {
    expect(isStdlibPackage('time')).toBe(true);
    expect(isStdlibPackage('fmt')).toBe(true);
    expect(isStdlibPackage('encoding/json')).toBe(true);
  });

  it('should reject third-party packages', () => {
    expect(isStdlibPackage('github.com/google/uuid')).toBe(false);
  });
});

describe('isBuiltinType', () => {
  it('should recognize builtin types', () => {
    expect(isBuiltinType('int')).toBe(true);
    expect(isBuiltinType('string')).toBe(true);
    expect(isBuiltinType('bool')).toBe(true);
  });

  it('should reject non-builtin types', () => {
    expect(isBuiltinType('uuid.UUID')).toBe(false);
    expect(isBuiltinType('User')).toBe(false);
  });
});
