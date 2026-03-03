"use strict";
/**
 * Generated from specs/deployment.spec.md
 * DO NOT EDIT MANUALLY
 * Source: @block:deploy/selection, @block:deploy/recommend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_COMPARISON = exports.PERFORMANCE_METRICS = exports.MODE_RECOMMENDATION = exports.DEFAULT_DEPLOYMENT_CONFIG = exports.DEFAULT_SCALE_THRESHOLDS = exports.MODE_SELECTION = void 0;
/**
 * Default mode selections
 */
exports.MODE_SELECTION = {
    command: 'speclang init --mode=light|enterprise',
    light: {
        description: 'Minimal setup',
        processes: 1,
        fileWatcher: 'OpenCode native',
        features: ['basic cascade', 'convergence', 'commit'],
    },
    enterprise: {
        description: 'Full observability',
        processes: 2,
        fileWatcher: 'dedicated inotify daemon',
        features: ['queue visibility', 'worktrees', 'agent control', 'compliance'],
    },
};
/**
 * Default scale thresholds
 */
exports.DEFAULT_SCALE_THRESHOLDS = {
    files: 500,
    agents: 20,
};
/**
 * Default deployment configuration
 */
exports.DEFAULT_DEPLOYMENT_CONFIG = {
    mode: 'light',
    scaleThresholds: exports.DEFAULT_SCALE_THRESHOLDS,
    light: {},
};
/**
 * Default mode recommendations
 */
exports.MODE_RECOMMENDATION = {
    useLightWhen: [
        'Solo developer',
        '<500 spec files',
        '<20 concurrent agents',
        'No compliance requirements',
        'Quick prototyping',
    ],
    useEnterpriseWhen: [
        'Multiple developers',
        '500+ spec files',
        '20+ concurrent agents',
        'Compliance requirements (SOC2, etc.)',
        'Need queue visibility',
        'Need worktree isolation',
        'Production/enterprise projects',
    ],
};
/**
 * Performance metrics by mode
 */
exports.PERFORMANCE_METRICS = {
    light: {
        eventLatency: '~100ms',
        maxFiles: '~500',
        maxAgents: '~20',
        memory: '+50MB',
        processes: 1,
        startupTime: '~2s',
    },
    enterprise: {
        eventLatency: '~10ms',
        maxFiles: '10k+',
        maxAgents: '100+',
        memory: '+100MB',
        processes: 2,
        startupTime: '~3s',
    },
};
/**
 * Feature comparison between modes
 */
exports.FEATURE_COMPARISON = {
    light: {
        fileWatching: 'OpenCode native',
        processes: 1,
        queueVisibility: false,
        worktreeIsolation: false,
        agentControl: 'Basic',
        scale: '<500 files',
        teamSize: 'Solo/small',
        compliance: false,
        setupComplexity: 'Low',
    },
    enterprise: {
        fileWatching: 'Dedicated inotify',
        processes: 2,
        queueVisibility: true,
        worktreeIsolation: true,
        agentControl: 'Full',
        scale: '500+ files',
        teamSize: 'Multiple teams',
        compliance: true,
        setupComplexity: 'Medium',
    },
};
//# sourceMappingURL=modes.js.map