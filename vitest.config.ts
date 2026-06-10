import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
      'specs/sortix/*-test.spec.ts',
    ],
    exclude: [
      'tests/e2e/**/*.spec.ts',
      'node_modules/**',
      'dist/**',
    ],
  },
});
