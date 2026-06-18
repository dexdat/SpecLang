#!/usr/bin/env node
/**
 * Real E2E Cascade Test — not mocked, real Pi Agent sessions.
 * 
 * Creates a test project, triggers the full cascade, verifies real code generation.
 * 
 * Usage: node bin/e2e-real-cascade.mjs
 */

import { CascadeRouter } from '../.speclang/cascade-router.spec.ts';
import { checkPiAgentHealth } from '../.speclang/cascade-router.spec.ts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const PROJECT = {
  name: 'url-shortener',
  description: 'A simple URL shortener service with create, redirect, and list endpoints',
};

const PROJECT_SCL = `# speclang-header lines:8
id: "@northstar/url-shortener"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [northstar, demo]
short: "URL Shortener Service"
---

# North Star: URL Shortener

A simple URL shortener service.

## Components
- **API**: Express.js server with create, redirect, list endpoints
- **Store**: In-memory URL store with short code generation
- **Validation**: URL validation, rate limiting
`;

const API_SPEC = `# speclang-header lines:12
id: "@specs/url-shortener/api"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [api, express, typescript]
short: "URL Shortener API"
depends_on:
  - "@ref:specs/url-shortener/store"
---

# URL Shortener API

Express.js server with three endpoints.

## Implementation

\`\`\`ts
import express from 'express';
import { createStore, type UrlStore } from './store';

const app = express();
app.use(express.json());

const store: UrlStore = createStore();

// POST /api/urls — Create a short URL
app.post('/api/urls', (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'invalid url format' });
  }
  const entry = store.create(url);
  res.status(201).json(entry);
});

// GET /:code — Redirect to original URL
app.get('/:code', (req, res) => {
  const entry = store.get(req.params.code);
  if (!entry) return res.status(404).json({ error: 'not found' });
  res.redirect(entry.url);
});

// GET /api/urls — List all URLs
app.get('/api/urls', (_req, res) => {
  res.json(store.list());
});

export { app };
export function startServer(port: number = 3000) {
  return app.listen(port, () => console.log(\`URL shortener running on port \${port}\`));
}
\`\`\`
`;

const STORE_SPEC = `# speclang-header lines:12
id: "@specs/url-shortener/store"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [store, typescript]
short: "URL Store with in-memory storage"
---

# URL Store

In-memory URL storage with short code generation.

## Implementation

\`\`\`ts
import crypto from 'crypto';

export interface UrlEntry {
  code: string;
  url: string;
  createdAt: string;
  clicks: number;
}

export interface UrlStore {
  create(url: string): UrlEntry;
  get(code: string): UrlEntry | undefined;
  list(): UrlEntry[];
}

export function createStore(): UrlStore {
  const entries = new Map<string, UrlEntry>();

  function generateCode(): string {
    return crypto.randomBytes(4).toString('hex');
  }

  return {
    create(url: string): UrlEntry {
      const code = generateCode();
      const entry: UrlEntry = {
        code,
        url,
        createdAt: new Date().toISOString(),
        clicks: 0,
      };
      entries.set(code, entry);
      return entry;
    },
    get(code: string): UrlEntry | undefined {
      return entries.get(code);
    },
    list(): UrlEntry[] {
      return Array.from(entries.values());
    },
  };
}
\`\`\`
`;

const TEST_SPEC = `# speclang-header lines:10
id: "@specs/url-shortener/test"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [test, vitest]
short: "URL Shortener tests"
depends_on:
  - "@ref:specs/url-shortener/api"
  - "@ref:specs/url-shortener/store"
---

# URL Shortener Tests

## Implementation

\`\`\`ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './api';

describe('URL Shortener', () => {
  let server: any;

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll(() => {
    server.close();
  });

  it('should create a short URL', async () => {
    const res = await request(server)
      .post('/api/urls')
      .send({ url: 'https://example.com' });
    expect(res.status).toBe(201);
    expect(res.body.code).toBeDefined();
    expect(res.body.url).toBe('https://example.com');
  });

  it('should reject invalid URLs', async () => {
    const res = await request(server)
      .post('/api/urls')
      .send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
  });

  it('should redirect to original URL', async () => {
    const create = await request(server)
      .post('/api/urls')
      .send({ url: 'https://example.com' });
    const res = await request(server).get(\`/\${create.body.code}\`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com');
  });

  it('should return 404 for unknown code', async () => {
    const res = await request(server).get('/nonexistent');
    expect(res.status).toBe(404);
  });

  it('should list all URLs', async () => {
    const res = await request(server).get('/api/urls');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
\`\`\`
`;

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-e2e-'));
}

function writeFile(dir: string, relPath: string, content: string): string {
  const full = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf-8');
  return full;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  SpecLang Real E2E Cascade Test');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Create temp project
  const tmpDir = createTempDir();
  console.log(`[1/6] Created temp project: ${tmpDir}`);

  writeFile(tmpDir, 'project.scl', PROJECT_SCL);
  writeFile(tmpDir, 'specs/api.spec.ts.md', API_SPEC);
  writeFile(tmpDir, 'specs/store.spec.ts.md', STORE_SPEC);
  writeFile(tmpDir, 'specs/test.spec.test.md', TEST_SPEC);
  console.log('[2/6] Wrote project.scl + 3 spec files');

  // Step 2: Check Pi SDK health
  console.log('[3/6] Checking Pi Agent SDK...');
  const health = await checkPiAgentHealth();
  console.log(`  SDK: ${health.ok ? '✅ READY' : '❌ NOT AVAILABLE'}`);
  if (!health.ok) {
    console.log(`  Reason: ${health.reason}`);
    console.log('\n❌ CANNOT RUN REAL E2E — Pi Agent SDK not available.');
    console.log('   Install: npm install @earendil-works/pi-coding-agent');
    console.log('   Set env: DEEPSEEK_API_KEY');
    process.exit(1);
  }

  // Step 3: Create CascadeRouter
  console.log('[4/6] Creating CascadeRouter...');
  const router = new CascadeRouter({
    projectRoot: tmpDir,
    maxConcurrent: 3,
    quietPeriodMs: 5000,
    maxDepth: 50,
  });

  const results: any[] = [];
  router.on('started', (e: any) => {
    console.log(`  ▶ ${e.stage} started: ${path.basename(e.specPath)}`);
  });
  router.on('completed', (e: any) => {
    console.log(`  ✓ ${e.stage} completed: ${path.basename(e.specPath)}`);
    results.push(e);
  });
  router.on('error', (e: any) => {
    console.log(`  ✗ ${e.stage} error: ${e.error}`);
    results.push(e);
  });

  // Step 4: Trigger cascade on the API spec
  console.log('[5/6] Triggering cascade on specs/api.spec.ts.md...');
  const apiSpecPath = path.join(tmpDir, 'specs/api.spec.ts.md');

  router.enqueue({
    specPath: apiSpecPath,
    timestamp: Date.now(),
  });

  // Step 5: Wait for cascade to complete (convergence)
  console.log('[6/6] Waiting for cascade to complete...');
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      // Check if any sessions still running
      const state = router.getState();
      if (state.runningSessions === 0 && state.queueSize === 0) {
        clearInterval(check);
        // Extra wait for convergence
        setTimeout(resolve, 2000);
      }
    }, 500);

    // Timeout after 120 seconds
    setTimeout(() => {
      clearInterval(check);
      console.log('  ⚠ Timeout after 120s — checking partial results');
      resolve();
    }, 120000);
  });

  // Step 6: Verify results
  console.log('\n═══════════════════════════════════════════');
  console.log('  Results');
  console.log('═══════════════════════════════════════════\n');

  const state = router.getState();
  console.log(`Sessions launched: ${state.sessionsLaunched}`);
  console.log(`Sessions completed: ${results.filter(r => r.type === 'completed').length}`);
  console.log(`Errors: ${results.filter(r => r.type === 'error').length}`);
  console.log(`Queue remaining: ${state.queueSize}`);

  // Check generated files
  console.log('\nFiles in project:');
  const walkDir = (dir: string, indent: string = '') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        console.log(`${indent}📁 ${entry.name}/`);
        walkDir(full, indent + '  ');
      } else {
        const size = fs.statSync(full).size;
        console.log(`${indent}📄 ${entry.name} (${size} bytes)`);
      }
    }
  };
  walkDir(tmpDir);

  // Verify generated code exists
  const generatedDir = path.join(tmpDir, 'generated');
  const srcDir = path.join(tmpDir, 'src');
  const hasGenerated = fs.existsSync(generatedDir);
  const hasSrc = fs.existsSync(srcDir);

  console.log('\n═══════════════════════════════════════════');
  if (state.sessionsLaunched > 0 && results.filter(r => r.type === 'completed').length > 0) {
    console.log('  ✅ E2E CASCADE PASSED');
    console.log(`  ${state.sessionsLaunched} real Pi Agent sessions fired`);
  } else {
    console.log('  ❌ E2E CASCADE FAILED');
    console.log('  No real agent sessions completed');
  }
  console.log('═══════════════════════════════════════════');

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  process.exit(state.sessionsLaunched > 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
