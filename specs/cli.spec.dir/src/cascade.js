"use strict";
/**
 * SPECLANG-GENERATED: Cascade command
 * Source: @speclang/mcp.cli
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cascadeCommand = cascadeCommand;
const fs = __importStar(require("fs"));
const utils_js_1 = require("../utils.js");
/**
 * Get cascade state file path
 */
function getCascadeStatePath() {
    return '.speclang/cascade-state.json';
}
/**
 * Load cascade state
 */
function loadCascadeState() {
    const statePath = getCascadeStatePath();
    if (fs.existsSync(statePath)) {
        try {
            return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        }
        catch {
            // Invalid state
        }
    }
    return { active: false, currentSpec: null, triggeredAt: null, specs: [] };
}
/**
 * Save cascade state
 */
function saveCascadeState(state) {
    const dir = '.speclang';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getCascadeStatePath(), JSON.stringify(state, null, 2));
}
/**
 * Cascade status command
 */
async function cascadeStatus(options) {
    const state = loadCascadeState();
    if (options.json) {
        console.log(JSON.stringify(state, null, 2));
    }
    else {
        console.log('=== Cascade Status ===\n');
        if (state.active) {
            console.log('Status: ACTIVE');
            console.log(`Current spec: ${state.currentSpec}`);
            console.log(`Triggered at: ${state.triggeredAt ? new Date(state.triggeredAt).toISOString() : 'N/A'}`);
            console.log(`\nAffected specs (${state.specs.length}):`);
            state.specs.forEach(s => console.log(`  - ${s}`));
        }
        else {
            console.log('Status: IDLE');
            console.log('No cascade is currently active');
        }
    }
}
/**
 * Cascade trigger command
 */
async function cascadeTrigger(specId, options) {
    const index = (0, utils_js_1.loadIndex)();
    const spec = index.specs[specId];
    if (!spec) {
        console.error(`Spec not found: ${specId}`);
        process.exit(1);
    }
    // Get dependents (specs that depend on this one)
    const dependents = index.graph.dependents[specId] || [];
    const state = {
        active: true,
        currentSpec: specId,
        triggeredAt: Date.now(),
        specs: dependents
    };
    saveCascadeState(state);
    if (options.json) {
        console.log(JSON.stringify({
            triggered: true,
            specId,
            dependents: dependents.length,
            specs: dependents
        }, null, 2));
    }
    else {
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
async function cascadeAbort(options) {
    const state = loadCascadeState();
    if (!state.active) {
        if (options.json) {
            console.log(JSON.stringify({ aborted: false, reason: 'No active cascade' }));
        }
        else {
            console.log('No active cascade to abort');
        }
        return;
    }
    state.active = false;
    state.currentSpec = null;
    saveCascadeState(state);
    if (options.json) {
        console.log(JSON.stringify({ aborted: true }));
    }
    else {
        console.log('✅ Cascade aborted');
    }
}
/**
 * Cascade command implementation
 */
async function cascadeCommand(action, specId, options) {
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
exports.default = cascadeCommand;
//# sourceMappingURL=cascade.js.map