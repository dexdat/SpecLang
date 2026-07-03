// SPECLANG-GENERATED: UI Testing - Vitest Configuration
// Source: @speclang/ui.testing
// CI-002: Redirect TMPDIR to project-local .tmp/ to avoid /tmp EDQUOT

import { defineConfig } from 'vitest/config';
import { join } from 'path';
import { mkdirSync } from 'fs';

// Set TMPDIR before any compilation or worker spawning happens.
// /tmp is a 30G tmpfs shared across the system and can hit EDQUOT.
// .tmp/ is project-local, gitignored, and on a 1.8T disk with 500G free.
const projectTmp = join(process.cwd(), '.tmp');
mkdirSync(projectTmp, { recursive: true });
process.env.TMPDIR = projectTmp;

export default defineConfig({
  // Redirect Vite's transform cache to project-local .vite-cache/
  cacheDir: join(process.cwd(), '.tmp', 'vite-cache'),
  test: {
    environment: 'node',
    globals: true,
    globalSetup: ['tests/global-setup.ts'],
    setupFiles: ['tests/setup-tmpdir.ts'],
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