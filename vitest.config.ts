import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 20_000,
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
