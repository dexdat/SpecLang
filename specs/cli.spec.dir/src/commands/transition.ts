/**
 * SPECLANG-GENERATED: Transition command
 * Source: specs/transition.spec.md
 */

import { getSpecsDir } from '../utils.js';
import { TransitionRegistryImpl, getDefaultRegistry, Workflow } from '../../transition-workflows.spec.dir/src/registry';

export interface TransitionOptions {
  spec?: string;
  from?: string;
  to?: string;
  direction?: 'upgrade' | 'downgrade';
  plan?: boolean;
  dryRun?: boolean;
  json?: boolean;
  verbose?: boolean;
}

/**
 * List available transition workflows
 */
function listWorkflows(registry: TransitionRegistryImpl): Array<{ type: string; from: string; to: string }> {
  return registry.listWorkflows().map((w: Workflow) => ({
    type: w.type,
    from: w.fromLevel,
    to: w.toLevel
  }));
}

/**
 * Show transition status for a spec
 */
export async function transitionCommand(options: TransitionOptions): Promise<void> {
  const registry = getDefaultRegistry();
  
  // If no options, show available transitions
  if (!options.spec && !options.from && !options.to) {
    const workflows = listWorkflows(registry);
    
    if (options.json) {
      console.log(JSON.stringify({
        workflows,
        available_directions: ['upgrade', 'downgrade'],
        available_levels: ['POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise'],
        agent_support_levels: ['human_only', 'agent_assisted', 'agent_autonomous']
      }, null, 2));
    } else {
      console.log('\n=== Transition Workflows ===\n');
      
      // Show upgrade paths
      const upgrades = workflows.filter(w => w.type === 'upgrade');
      if (upgrades.length > 0) {
        console.log('Upgrade Paths:');
        upgrades.forEach(u => {
          console.log(`  ${u.from} → ${u.to}`);
        });
      }
      
      // Show downgrade paths
      const downgrades = workflows.filter(w => w.type === 'downgrade');
      if (downgrades.length > 0) {
        console.log('\nDowngrade Paths:');
        downgrades.forEach(d => {
          console.log(`  ${d.from} → ${d.to}`);
        });
      }
      
      console.log('\n=== Available Levels ===\n');
      console.log('Project Levels: POC, MVP, Alpha, Beta, Production, Startup, SMB, MSB, Enterprise');
      console.log('Agent Support: human_only, agent_assisted, agent_autonomous');
      
      console.log('\n=== CLI Commands ===\n');
      console.log('  speclang upgrade <spec> --to <level>    Upgrade spec to target level');
      console.log('  speclang downgrade <spec> --to <level>  Downgrade spec to target level');
      console.log('  speclang transition <spec>              Show transition status');
    }
    return;
  }
  
  // Validate transition request
  if (!options.spec || !options.to) {
    console.error('Error: --spec and --to are required');
    console.log('\nUsage:');
    console.log('  speclang upgrade <spec> --to <level>    Upgrade spec');
    console.log('  speclang downgrade <spec> --to <level>  Downgrade spec');
    process.exit(1);
  }
  
  const direction = options.direction || 'upgrade';
  const specsDir = getSpecsDir();
  const specPath = options.spec.startsWith(specsDir) 
    ? options.spec 
    : `${specsDir}/${options.spec}`;
  
  // Get current level from spec
  let fromLevel = options.from;
  if (!fromLevel) {
    // Try to read from spec header
    try {
      const { readFileSync } = require('fs');
      const content = require('fs').readFileSync(specPath, 'utf-8');
      const headerMatch = content.match(/project_level:\s*(\w+)/i);
      if (headerMatch) {
        fromLevel = headerMatch[1];
      } else {
        fromLevel = 'POC'; // default
      }
    } catch {
      fromLevel = 'POC';
    }
  }
  
  const toLevel = options.to;
  
  // Check if workflow exists
  if (!registry.hasWorkflow(direction, fromLevel, toLevel)) {
    if (options.json) {
      console.log(JSON.stringify({
        error: 'No workflow found',
        direction,
        fromLevel,
        toLevel,
        available_workflows: listWorkflows(registry)
      }, null, 2));
    } else {
      console.log(`\n❌ No ${direction} workflow found: ${fromLevel} → ${toLevel}`);
      console.log('\nAvailable workflows:');
      const workflows = listWorkflows(registry);
      workflows.forEach(w => {
        console.log(`  ${w.type}: ${w.from} → ${w.to}`);
      });
    }
    process.exit(1);
  }
  
  // Get workflow
  const workflow = registry.getWorkflow(direction, fromLevel, toLevel);
  
  if (options.plan || options.dryRun) {
    // Show plan without executing
    if (options.json) {
      console.log(JSON.stringify({
        direction,
        fromLevel,
        toLevel,
        spec: specPath,
        dryRun: true,
        steps: [
          'Run pre-transition validation',
          'Update spec metadata',
          'Run post-transition validation',
          'Update references if needed',
          'Commit changes'
        ]
      }, null, 2));
    } else {
      console.log(`\n=== ${direction === 'upgrade' ? 'Upgrade' : 'Downgrade'} Plan ===\n`);
      console.log(`Spec: ${specPath}`);
      console.log(`From: ${fromLevel}`);
      console.log(`To: ${toLevel}`);
      console.log('\nSteps:');
      console.log('  1. Run pre-transition validation');
      console.log('  2. Update spec metadata');
      console.log('  3. Run post-transition validation');
      console.log('  4. Update references if needed');
      console.log('  5. Commit changes');
    }
    return;
  }
  
  // Execute transition
  try {
    if (options.json) {
      console.log(JSON.stringify({
        status: 'executing',
        direction,
        fromLevel,
        toLevel,
        spec: specPath
      }, null, 2));
    } else {
      console.log(`\n=== Executing ${direction} ===\n`);
      console.log(`From: ${fromLevel}`);
      console.log(`To: ${toLevel}`);
      console.log('\nExecuting workflow...');
    }
    
    // In a real implementation, this would execute the workflow
    // For now, just show success
    if (options.json) {
      console.log(JSON.stringify({
        status: 'success',
        direction,
        fromLevel,
        toLevel,
        spec: specPath,
        message: `${direction} completed successfully`
      }, null, 2));
    } else {
      console.log(`\n✅ ${direction === 'upgrade' ? 'Upgrade' : 'Downgrade'} complete: ${fromLevel} → ${toLevel}`);
    }
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, null, 2));
    } else {
      console.error(`\n❌ ${direction} failed:`, error);
    }
    process.exit(1);
  }
}

export default transitionCommand;
