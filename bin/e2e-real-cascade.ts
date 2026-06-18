#!/usr/bin/env node
/**
 * Real E2E Cascade — fires actual Pi Agent sessions against a test project.
 * Usage: npx tsx bin/e2e-real-cascade.ts
 */

import { CascadeRouter } from '../.speclang/cascade-router.spec.ts';
import { checkPiAgentHealth } from '../.speclang/cascade-router.spec.ts';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const PROJECT_SCL = `# speclang-header lines:8
id: "@northstar/url-shortener"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [northstar, demo]
short: "URL Shortener Service"
---

# URL Shortener Service

A simple URL shortener with create, redirect, and list endpoints.
Built with Express.js + TypeScript.
`;

const API_SPEC = `# speclang-header lines:12
id: "@specs/url-shortener/api"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [api, express, typescript]
short: "URL Shortener API"
targetLang: ts
depends_on:
  - "@ref:specs/url-shortener/store"
---

# URL Shortener API

## Implementation

\`\`\`ts
import express from 'express';
import { createStore, type UrlStore } from './store';

const app = express();
app.use(express.json());
const store: UrlStore = createStore();

app.post('/api/urls', (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'url is required' });
  try { new URL(url); } catch { return res.status(400).json({ error: 'invalid url' }); }
  res.status(201).json(store.create(url));
});

app.get('/:code', (req, res) => {
  const entry = store.get(req.params.code);
  if (!entry) return res.status(404).json({ error: 'not found' });
  res.redirect(301, entry.url);
});

app.get('/api/urls', (_req, res) => { res.json(store.list()); });

export { app };
\`\`\`
`;

const STORE_SPEC = `# speclang-header lines:10
id: "@specs/url-shortener/store"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [store, typescript]
targetLang: ts
short: "URL Store"
---

# URL Store

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
  return {
    create(url: string): UrlEntry {
      const code = crypto.randomBytes(4).toString('hex');
      const entry: UrlEntry = { code, url, createdAt: new Date().toISOString(), clicks: 0 };
      entries.set(code, entry);
      return entry;
    },
    get(code: string): UrlEntry | undefined { return entries.get(code); },
    list(): UrlEntry[] { return Array.from(entries.values()); },
  };
}
\`\`\`
`;

async function main() {
  console.log('═══ SpecLang Real E2E Cascade ═══\n');

  // 1. Check Pi SDK
  console.log('[1] Pi Agent SDK...');
  const health = await checkPiAgentHealth();
  console.log(`    ${health.ok ? '✅ READY' : '❌ ' + health.reason}`);
  if (!health.ok) { console.log('Cannot run without Pi SDK.'); process.exit(1); }

  // 2. Create project
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-e2e-'));
  fs.writeFileSync(path.join(tmpDir, 'project.scl'), PROJECT_SCL);
  fs.mkdirSync(path.join(tmpDir, 'specs'));
  fs.writeFileSync(path.join(tmpDir, 'specs/store.spec.ts.md'), STORE_SPEC);
  fs.writeFileSync(path.join(tmpDir, 'specs/api.spec.ts.md'), API_SPEC);
  console.log(`[2] Project: ${tmpDir}`);

  // 3. Create router
  console.log('[3] CascadeRouter...');
  const daemon = new EventEmitter();
  (daemon as any).getProjectRoot = () => tmpDir;
  const router = new CascadeRouter(daemon as any);
  
  let completed = 0, errors = 0;
  router.on('started', (e: any) => console.log(`  ▶ ${e.stage}: ${path.basename(e.specPath)}`));
  router.on('completed', (e: any) => { completed++; console.log(`  ✓ ${e.stage} done`); });
  router.on('error', (e: any) => { errors++; console.log(`  ✗ ${e.stage} error: ${e.error}`); });

  // 4. Trigger
  console.log('[4] Triggering cascade...');
  daemon.emit('file_change', {
    path: path.join(tmpDir, 'specs/store.spec.ts.md'),
    kind: 'create',
    dependentSpecs: [path.join(tmpDir, 'specs/api.spec.ts.md')],
    timestamp: Date.now(),
  });

  // 5. Wait
  console.log('[5] Waiting...');
  const startTime = Date.now();
  const maxWait = 180000;
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      const running = (router as any).runningSessions || 0;
      if (running === 0) { clearInterval(check); setTimeout(resolve, 2000); }
      if (Date.now() - startTime > maxWait) { clearInterval(check); resolve(); }
    }, 1000);
  });

  // 6. Results
  console.log(`\n═══ Results ═══`);
  console.log(`Completed: ${completed} | Errors: ${errors}`);
  
  const allFiles: string[] = [];
  function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full); else allFiles.push(full);
    }
  }
  walk(tmpDir);
  console.log(`\nFiles (${allFiles.length}):`);
  for (const f of allFiles) console.log(`  ${path.relative(tmpDir, f)} (${fs.statSync(f).size}B)`);

  const codeFiles = allFiles.filter(f => /\.(ts|py|go|js)$/.test(f) && !f.includes('specs/'));
  console.log(`\n═══ Verdict ═══`);
  if (completed > 0 && codeFiles.length > 0) {
    console.log('✅ REAL E2E PASSED — cascade fired, code generated');
    for (const f of codeFiles) console.log(`   GEN: ${path.relative(tmpDir, f)}`);
  } else if (completed > 0) {
    console.log('⚠ Sessions ran but no code files found');
  } else {
    console.log('❌ No sessions completed');
  }
  console.log(`\nProject: ${tmpDir}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
