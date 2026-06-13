/**
 * Go codegen roundtrip test: spec block → Go file → go build
 * Verifies GoCodeGenerator produces compilable, runnable Go code.
 */
import { describe, it, expect } from 'vitest';
import { GoCodeGenerator, createGoCodeGenerator } from '../../src/compiler/go/generator';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Go Codegen Roundtrip', () => {
  it('should generate a Go struct that compiles with go build', () => {
    const gen = createGoCodeGenerator({
      packageName: 'main',
      addJsonTags: true,
      addConstructor: true,
      addInterfaces: false,
    });

    const block = {
      name: 'User',
      package: 'main',
      fields: [
        { name: 'ID', type: 'int' },
        { name: 'Email', type: 'string' },
        { name: 'Name', type: 'string' },
      ],
    };

    const result = gen.generate(block);

    // Verify output structure
    expect(result.package).toBe('main');
    expect(result.code).toContain('package main');
    expect(result.code).toContain('type User struct');
    expect(result.code).toContain('ID int');
    expect(result.code).toContain('Email string');
    expect(result.code).toContain('Name string');
    expect(result.code).toContain('func NewUser');
    expect(result.code).toContain('`json:"i_d"`');  // toSnakeCase('ID') → 'i_d'
    expect(result.code).toContain('`json:"email"`');
    expect(result.code).toContain('`json:"name"`');

    // Build full Go program
    const mainFunc = `
func main() {
\tu := NewUser(1, "test@example.com", "Test User")
\t_ = u
}`;
    const fullCode = result.code + mainFunc;

    // Write to temp and compile
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-go-test-'));
    const goFile = path.join(tmpDir, 'main.go');
    fs.writeFileSync(goFile, fullCode);

    try {
      execSync('go mod init test-output', { cwd: tmpDir, stdio: 'pipe' });
      execSync('go build -o user .', { cwd: tmpDir, stdio: 'pipe' });
      const binary = path.join(tmpDir, 'user');
      expect(fs.existsSync(binary)).toBe(true);

      // Verify it runs
      const output = execSync(binary, { encoding: 'utf-8', stdio: 'pipe' });
      // Should not crash — if main just assigns to _, no output expected
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should generate a struct with multiple field types', () => {
    const gen = createGoCodeGenerator({
      packageName: 'models',
      addJsonTags: true,
      addConstructor: true,
    });

    const block = {
      name: 'Product',
      package: 'models',
      fields: [
        { name: 'SKU', type: 'string' },
        { name: 'Price', type: 'float64' },
        { name: 'InStock', type: 'bool' },
        { name: 'Tags', type: '[]string' },
      ],
    };

    const result = gen.generate(block);

    expect(result.code).toContain('type Product struct');
    expect(result.code).toContain('SKU string');
    expect(result.code).toContain('Price float64');
    expect(result.code).toContain('InStock bool');
    expect(result.code).toContain('Tags []string');
    expect(result.code).toContain('func NewProduct');
  });
});
