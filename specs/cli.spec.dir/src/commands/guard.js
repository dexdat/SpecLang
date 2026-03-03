"use strict";
/**
 * Guard CLI Commands
 *
 * SPECLANG-GENERATED
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardCommand = guardCommand;
const src_1 = require("../../../guard.spec.dir/src");
/**
 * Main guard command
 */
async function guardCommand(action, filepath, options = {}) {
    const opts = options;
    switch (action) {
        case 'check':
            await guardCheck(filepath, opts);
            break;
        case 'rules':
            await guardRules(opts);
            break;
        case 'violations':
            await guardViolations(opts);
            break;
        case 'override':
            await guardOverride(filepath, opts);
            break;
        case 'stats':
            await guardStats(opts);
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
async function guardCheck(filepath, options) {
    (0, src_1.initGuard)();
    const agent = options.agent || 'north-star';
    const owner = (0, src_1.getFileOwner)(filepath);
    const canWrite = (0, src_1.getGuard)().checkOwnership(agent, filepath);
    if (options.json) {
        console.log(JSON.stringify({
            filepath,
            agent,
            owner,
            allowed: canWrite.allowed,
            reason: canWrite.reason,
        }, null, 2));
    }
    else {
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
async function guardRules(options) {
    (0, src_1.initGuard)();
    const rules = (0, src_1.getGuard)().getRegistry().getRules();
    if (options.json) {
        console.log(JSON.stringify(rules, null, 2));
    }
    else {
        console.log('Ownership Rules:\n');
        for (const rule of rules) {
            if (options.agent && rule.agent !== options.agent)
                continue;
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
async function guardViolations(options) {
    (0, src_1.initGuard)();
    const violations = options.unresolved
        ? (0, src_1.getViolations)().getUnresolved()
        : (0, src_1.getViolations)().getAll();
    if (options.agent) {
        const filtered = violations.filter(v => v.agent === options.agent);
        if (options.json) {
            console.log(JSON.stringify(filtered, null, 2));
        }
        else {
            console.log(`Violations for agent ${options.agent}:\n`);
            for (const v of filtered) {
                console.log(`  ${v.filepath} - ${v.attemptedAction} - ${v.resolved ? 'resolved' : 'unresolved'}`);
            }
        }
    }
    else {
        if (options.json) {
            console.log(JSON.stringify(violations, null, 2));
        }
        else {
            const report = (0, src_1.getViolations)().export();
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
async function guardOverride(filepath, options) {
    (0, src_1.initGuard)();
    const assignedAgent = options.agent;
    const reason = options.reason || 'Manual override';
    const override = (0, src_1.createOverride)(filepath, assignedAgent, reason, 'north-star', options.expires);
    (0, src_1.getGuard)().getRegistry().addOverride(override);
    if (options.json) {
        console.log(JSON.stringify({
            filepath,
            assignedAgent,
            reason,
            success: true,
        }, null, 2));
    }
    else {
        console.log(`Override created: ${filepath} -> ${assignedAgent}`);
        console.log(`Reason: ${reason}`);
    }
}
/**
 * Show guard statistics
 */
async function guardStats(options) {
    (0, src_1.initGuard)();
    const stats = (0, src_1.getGuardStats)();
    if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
    }
    else {
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
//# sourceMappingURL=guard.js.map