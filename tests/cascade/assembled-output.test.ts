import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const ASSEMBLED_DIR = join(process.cwd(), '.speclang', 'assembled');

function getCodeFiles(): string[] {
  if (!existsSync(ASSEMBLED_DIR)) return [];
  return readdirSync(ASSEMBLED_DIR)
    .filter(f => f.endsWith('.code.ts'))
    .map(f => join(ASSEMBLED_DIR, f));
}

describe('cascade-trace: assembled output format', () => {
  describe('file discovery', () => {
    it('reports files found without crashing when zero code.ts files exist', () => {
      const files = getCodeFiles();
      expect(Array.isArray(files)).toBe(true);
    });
  });

  describe('spec trace header', () => {
    it('every .code.ts file begins with // spec:trace spec=<path>#<section>', () => {
      const files = getCodeFiles();
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        expect(content).toMatch(/^\/\/ spec:trace spec=.+#/);
      }
    });
  });

  describe('generated marker', () => {
    it('every .code.ts file contains generated DO NOT EDIT marker in first 5 lines', () => {
      const files = getCodeFiles();
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const firstLines = content.split('\n').slice(0, 5).join('\n');
        expect(firstLines).toContain('// spec:generated DO NOT EDIT');
      }
    });
  });

  describe('no template variables', () => {
    it('no .code.ts file contains unexpanded template markers', () => {
      const files = getCodeFiles();
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/\{\{[^}]*\}\}/);
        expect(content).not.toMatch(/__VARS__/);
        expect(content).not.toMatch(/\$\{[A-Z_][A-Z0-9_]*\}/);
      }
    });
  });

  // preProcessSpec tests skipped — the cascade-router.spec.ts assembled output
  // and preProcessSpec function were planned but never implemented.
  // Restore when the assembler pipeline generates this file.
  describe.skip('preProcessSpec function', () => {
    const specPath = join(process.cwd(), '.speclang', 'cascade-router.spec.ts');

    it('preProcessSpec is declared in cascade-router.spec.ts', () => {
      expect(existsSync(specPath)).toBe(true);
      const content = readFileSync(specPath, 'utf-8');
      expect(content).toMatch(/async function preProcessSpec\(/);
    });

    it('preProcessSpec accepts (specPath, targetLang, projectRoot) params', () => {
      const content = readFileSync(specPath, 'utf-8');
      expect(content).toMatch(
        /async function preProcessSpec\(specPath: string, targetLang: string, projectRoot: string\)/
      );
    });
  });
});
