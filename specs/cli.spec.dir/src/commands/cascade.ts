/**
 * SPECLANG-GENERATED: Cascade command
 * Source: @speclang/mcp.cli
 */

import * as fs from 'fs';
import type { CoordinatorOptions } from 'cascade.spec.dir/src/coordinator/index.js';
import { loadIndex, getSpecsDir, getDatabase } from '../utils.js';

export interface CascadeOptions {
  json?: boolean;
  thinking?: CoordinatorOptions['thinking'];
}

interface CascadeState {
  active: boolean;
  currentSpec: string | null;
  triggeredAt: number | null;
  specs: string[];
  thinking?: CoordinatorOptions['thinking'];
}

/**
 * Get cascade state file path
 */
function getCascadeStatePath(): string {
  return '.speclang/cascade-state.json';
}

/**
 * Load cascade state
 */
function loadCascadeState(): CascadeState {
  const statePath = getCascadeStatePath();
  if (fs.existsSync(statePath)) {
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    } catch {
      // Invalid state
    }
  }
  return { active: false, currentSpec: null, triggeredAt: null, specs: [] };
}

/**
 * Save cascade state
 */
function saveCascadeState(state: CascadeState): void {
  const dir = '.speclang';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getCascadeStatePath(), JSON.stringify(state, null, 2));
}

/**
 * Cascade status command
 */
async function cascadeStatus(options: CascadeOptions): Promise<void> {
  const state = loadCascadeState();
  
  if (options.json) {
    console.log(JSON.stringify(state, null, 2));
  } else {
    console.log('=== Cascade Status ===\n');
    if (state.active) {
      console.log('Status: ACTIVE');
      console.log(`Current spec: ${state.currentSpec}`);
      console.log(`Triggered at: ${state.triggeredAt ? new Date(state.triggeredAt).toISOString() : 'N/A'}`);
      console.log(`\nAffected specs (${state.specs.length}):`);
      state.specs.forEach(s => console.log(`  - ${s}`));
    } else {
      console.log('Status: IDLE');
      console.log('No cascade is currently active');
    }
  }
}

/**
 * Cascade trigger command
 */
async function cascadeTrigger(specId: string, options: CascadeOptions): Promise<void> {
  const index = loadIndex();
  const spec = index.specs[specId];
  
  if (!spec) {
    console.error(`Spec not found: ${specId}`);
    process.exit(1);
  }
  
  // Get dependents (specs that depend on this one)
  const dependents = index.graph.dependents[specId] || [];
  
  const state: CascadeState = {
    active: true,
    currentSpec: specId,
    triggeredAt: Date.now(),
    specs: dependents,
    thinking: options.thinking
  };
  
  saveCascadeState(state);
  
  if (options.json) {
    console.log(JSON.stringify({
      triggered: true,
      specId,
      dependents: dependents.length,
      specs: dependents
    }, null, 2));
  } else {
    console.log('=== Cascade Triggered ===\n');
    console.log(`Spec: ${specId}`);
    console.log(`Dependents: ${dependents.length}`);
    console.log('\nAffected specs:');
    dependents.forEach(s => console.log(`  - ${s}`));
    console.log('\n✅ Cascade state saved');
  }
}

/**
 * Cascade abort command
 */
async function cascadeAbort(options: CascadeOptions): Promise<void> {
  const state = loadCascadeState();
  
  if (!state.active) {
    if (options.json) {
      console.log(JSON.stringify({ aborted: false, reason: 'No active cascade' }));
    } else {
      console.log('No active cascade to abort');
    }
    return;
  }
  
  state.active = false;
  state.currentSpec = null;
  saveCascadeState(state);
  
  if (options.json) {
    console.log(JSON.stringify({ aborted: true }));
  } else {
    console.log('✅ Cascade aborted');
  }
}

/**
 * Cascade command implementation
 */
export async function cascadeCommand(
  action: 'status' | 'trigger' | 'abort',
  specId: string | undefined,
  options: CascadeOptions
): Promise<void> {
  switch (action) {
    case 'status':
      await cascadeStatus(options);
      break;
    case 'trigger':
      if (!specId) {
        console.error('Error: spec-id required for trigger action');
        process.exit(1);
      }
      await cascadeTrigger(specId, options);
      break;
    case 'abort':
      await cascadeAbort(options);
      break;
    default:
      console.error(`Unknown cascade action: ${action}`);
      process.exit(1);
  }
}

export default cascadeCommand;
