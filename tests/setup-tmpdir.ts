/**
 * Vitest global setup — redirect os.tmpdir() to project-local .tmp/
 *
 * This prevents EDQUOT failures when /tmp is full (30G tmpfs, shared system).
 * Tests call os.tmpdir() which reads TMPDIR env var, falling back to /tmp.
 * By setting TMPDIR before tests run, all temp files land in .tmp/ instead.
 *
 * Also patches os.tmpdir() to ensure consistency even if TMPDIR is not set
 * in the test environment.
 */
import { join, resolve } from 'path';
import { mkdirSync } from 'fs';

const PROJECT_TMP = join(process.cwd(), '.tmp');

// Ensure the directory exists
mkdirSync(PROJECT_TMP, { recursive: true });

// Set TMPDIR so os.tmpdir() returns our project-local dir
// This covers tests using os.tmpdir(), fs.mkdtempSync(path.join(os.tmpdir(), ...))
if (!process.env.SPECLANG_PRESERVE_TMPDIR) {
  process.env.TMPDIR = PROJECT_TMP;
}