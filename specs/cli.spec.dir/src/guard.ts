/**
 * Guard CLI Commands
 * 
 * SPECLANG-GENERATED
 */

import {
  getGuard,
  initGuard,
  getFileOwner,
  getViolations,
  getGuardStats,
  createOverride,
} from '../../guard';
import type { AgentRole } from '../../agents/types';
import { DEFAULT_RULES } from '../../guard/rules';

/**
 * Guard command options
 */
export interface GuardOptions {
  json?: boolean;
}

/**
 * Guard check options
 */
export interface GuardCheckOptions extends GuardOptions {
  agent?: string;
}

/**
 * Guard override options
 */
export interface GuardOverrideOptions extends GuardOptions {
  agent: string;
  reason: string;
  expires?: number;
}

/**
 * Guard violations options
 */
export interface GuardViolationsOptions extends GuardOptions {
  unresolved?: boolean;
  agent?: string;
}

/**
 * Guard rules options
 */
export interface GuardRulesOptions extends GuardOptions {
  agent?: string;
}

/**
 * Main guard command
 */
export async function guardCommand(
  action: string,
  filepath?: string,
  options: GuardOptions | GuardCheckOptions | GuardOverrideOptions | GuardViolationsOptions | GuardRulesOptions = {}
): Promise<void> {
  const opts = options as GuardOptions;
  
  switch (action) {
    case 'check':
      await guardCheck(filepath!, opts as GuardCheckOptions);
      break;
    case 'rules':
      await guardRules(opts as GuardRulesOptions);
      break;
    case 'violations':
      await guardViolations(opts as GuardViolationsOptions);
      break;
    case 'override':
      await guardOverride(filepath!, opts as GuardOverrideOptions);
      break;
    case 'stats':
      await guardStats(opts as GuardOptions);
      break;
    default:
      console.log('Available guard commands:');
      console.log('  speclang guard check <filepath>    - Check ownership of a file');
      console.log('  speclang guard rules               - List all ownership rules');
      console.log('  speclang guard violations          - Show violations');
      console.log('  speclang guard override <path>     - Override ownership');
      console.log('  speclang guard stats               - Show guard statistics');
  }
}

/**
 * Check ownership of a file
 */
async function guardCheck(filepath: string, options: GuardCheckOptions): Promise<void> {
  initGuard();
  
  const agent = (options.agent as AgentRole) || 'north-star';
  const owner = getFileOwner(filepath);
  const canWrite = getGuard().checkOwnership(agent, filepath);
  
  if (options.json) {
    console.log(JSON.stringify({
      filepath,
      agent,
      owner,
      allowed: canWrite.allowed,
      reason: canWrite.reason,
    }, null, 2));
  } else {
    console.log(`File: ${filepath}`);
    console.log(`Owner: ${owner || 'none'}`);
    console.log(`Agent: ${agent}`);
    console.log(`Can write: ${canWrite.allowed ? 'YES' : 'NO'}`);
    if (!canWrite.allowed) {
      console.log(`Reason: ${canWrite.reason}`);
    }
  }
}

/**
 * List ownership rules
 */
async function guardRules(options: GuardRulesOptions): Promise<void> {
  initGuard();
  
  const rules = getGuard().getRegistry().getRules();
  
  if (options.json) {
    console.log(JSON.stringify(rules, null, 2));
  } else {
    console.log('Ownership Rules:\n');
    for (const rule of rules) {
      if (options.agent && rule.agent !== options.agent) continue;
      console.log(`Agent: ${rule.agent} (priority: ${rule.priority})`);
      console.log(`  Description: ${rule.description}`);
      console.log(`  Patterns: ${rule.patterns.join(', ')}`);
      console.log();
    }
  }
}

/**
 * Show violations
 */
async function guardViolations(options: GuardViolationsOptions): Promise<void> {
  initGuard();
  
  const violations = options.unresolved 
    ? getViolations().getUnresolved()
    : getViolations().getAll();
  
  if (options.agent) {
    const filtered = violations.filter(v => v.agent === options.agent);
    
    if (options.json) {
      console.log(JSON.stringify(filtered, null, 2));
    } else {
      console.log(`Violations for agent ${options.agent}:\n`);
      for (const v of filtered) {
        console.log(`  ${v.filepath} - ${v.attemptedAction} - ${v.resolved ? 'resolved' : 'unresolved'}`);
      }
    }
  } else {
    if (options.json) {
      console.log(JSON.stringify(violations, null, 2));
    } else {
      const report = getViolations().export();
      console.log(`Total violations: ${report.total}`);
      console.log(`Unresolved: ${report.unresolved}`);
      console.log(`Resolved: ${report.resolved}`);
      console.log('\nBy agent:');
      for (const [agent, count] of Object.entries(report.byAgent)) {
        console.log(`  ${agent}: ${count}`);
      }
      console.log('\nRecent violations:');
      for (const v of report.recent) {
        console.log(`  ${v.agent} attempted ${v.attemptedAction} on ${v.filepath}`);
      }
    }
  }
}

/**
 * Override ownership
 */
async function guardOverride(filepath: string, options: GuardOverrideOptions): Promise<void> {
  initGuard();
  
  const assignedAgent = options.agent as AgentRole;
  const reason = options.reason || 'Manual override';
  
  const override = createOverride(
    filepath,
    assignedAgent,
    reason,
    'north-star',
    options.expires
  );
  
  getGuard().getRegistry().addOverride(override);
  
  if (options.json) {
    console.log(JSON.stringify({
      filepath,
      assignedAgent,
      reason,
      success: true,
    }, null, 2));
  } else {
    console.log(`Override created: ${filepath} -> ${assignedAgent}`);
    console.log(`Reason: ${reason}`);
  }
}

/**
 * Show guard statistics
 */
async function guardStats(options: GuardOptions): Promise<void> {
  initGuard();
  
  const stats = getGuardStats() as { totalChecks: number; allowed: number; blocked: number; violations: number; byAgent: Record<string, { allowed: number; blocked: number }> };
  
  if (options.json) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    console.log('Guard Statistics:\n');
    console.log(`Total checks: ${stats.totalChecks}`);
    console.log(`Allowed: ${stats.allowed}`);
    console.log(`Blocked: ${stats.blocked}`);
    console.log(`Violations: ${stats.violations}`);
    console.log('\nBy agent:');
    for (const [agent, data] of Object.entries(stats.byAgent)) {
      console.log(`  ${agent}: allowed=${data.allowed}, blocked=${data.blocked}`);
    }
  }
}
