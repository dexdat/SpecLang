// SPECLANG-GENERATED: UI Testing - Vitest Configuration
// DO NOT EDIT MANUALLY
// Source: @speclang/ui.testing

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 15000,
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx'
    ],
    exclude: [
      'tests/e2e/**/*.spec.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/dashboard/**'
      ]
    }
  }
});
