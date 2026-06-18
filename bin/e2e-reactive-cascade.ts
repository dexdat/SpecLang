#!/usr/bin/env node
/**
 * Prove reactive cascade: start daemon, make live edits, watch cascades fire.
 * Usage: npx tsx bin/e2e-reactive-cascade.ts
 */

import { SpeclangDaemon } from '../.speclang/daemon.spec.ts';
import { CascadeRouter } from '../.speclang/cascade-router.spec.ts';
import { checkPiAgentHealth } from '../.speclang/cascade-router.spec.ts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function main() {
  console.log('═══ Reactive Cascade Test ═══\n');

  const health = await checkPiAgentHealth();
  if (!health.ok) { console.log('Pi SDK not available:', health.reason); process.exit(1); }
  console.log('[✓] Pi Agent SDK ready');

  // Create project
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-reactive-'));
  fs.writeFileSync(path.join(tmpDir, 'project.scl'), `# speclang-header lines:5
id: "@northstar/test"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
short: "Reactive Test"
---
# Test Project
`);
  fs.mkdirSync(path.join(tmpDir, 'specs'));
  console.log(`[✓] Project: ${tmpDir}`);

  // Start daemon watching the project
  const daemon = new SpeclangDaemon(tmpDir + '/specs/', 10000); // 10s convergence
  const router = new CascadeRouter(daemon);
  
  let cascadeCount = 0;
  router.on('completed', (e: any) => {
    cascadeCount++;
    console.log(`  ✓ Cascade #${cascadeCount}: ${e.stage} on ${path.basename(e.specPath)}`);
  });

  await daemon.start();
  console.log('[✓] Daemon watching specs/');

  // Write first spec — this should trigger a cascade
  console.log('\n[1] Writing specs/hello.spec.ts.md...');
  fs.writeFileSync(path.join(tmpDir, 'specs/hello.spec.ts.md'), `# speclang-header lines:8
id: "@specs/test/hello"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [test]
targetLang: ts
short: "Hello World"
---

# Hello World

## Implementation

\`\`\`ts
export function hello(): string {
  return "Hello from SpecLang!";
}
\`\`\`
`);

  // Wait for cascade to fire
  await new Promise(r => setTimeout(r, 15000));

  // Edit the spec — should trigger another cascade
  console.log('\n[2] Editing specs/hello.spec.ts.md...');
  const specPath = path.join(tmpDir, 'specs/hello.spec.ts.md');
  let content = fs.readFileSync(specPath, 'utf-8');
  content = content.replace('Hello from SpecLang!', 'Hello REACTIVE SpecLang!');
  fs.writeFileSync(specPath, content);

  // Wait for second cascade
  await new Promise(r => setTimeout(r, 15000));

  // Create a new spec that depends on hello
  console.log('\n[3] Writing specs/goodbye.spec.ts.md (depends on hello)...');
  fs.writeFileSync(path.join(tmpDir, 'specs/goodbye.spec.ts.md'), `# speclang-header lines:9
id: "@specs/test/goodbye"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [test]
targetLang: ts
short: "Goodbye World"
depends_on:
  - "@ref:specs/test/hello"
---

# Goodbye World

## Implementation

\`\`\`ts
export function goodbye(): string {
  return "Goodbye from SpecLang!";
}
\`\`\`
`);

  // Wait for cascade
  await new Promise(r => setTimeout(r, 15000));

  // Stop daemon
  daemon.stop();
  
  // Results
  console.log(`\n═══ Results ═══`);
  console.log(`Cascades fired: ${cascadeCount}`);
  const files: string[] = [];
  function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full); else files.push(full);
    }
  }
  walk(tmpDir);
  console.log(`Files (${files.length}):`);
  for (const f of files) console.log(`  ${path.relative(tmpDir, f)}`);

  // Check generated code
  const assembledDir = path.join(process.cwd(), '.speclang', 'assembled');
  if (fs.existsSync(assembledDir)) {
    const generated = fs.readdirSync(assembledDir).filter(f => f.includes('hello') || f.includes('goodbye'));
    console.log(`\nGenerated in assembled/:`);
    for (const f of generated) {
      const full = path.join(assembledDir, f);
      console.log(`  ${f} (${fs.statSync(full).size}B)`);
    }
  }

  console.log(`\nProject: ${tmpDir}`);
  console.log(`Inspect: ls -la ${tmpDir}/specs/`);
}

main().catch(err => { console.error(err); process.exit(1); });
