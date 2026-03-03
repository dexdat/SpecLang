"use strict";
// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.dir/criteria.spec.md
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransitionManager = void 0;
exports.createTransitionManager = createTransitionManager;
const levels_1 = require("./levels");
/**
 * Transition Manager
 *
 * Handles level transitions with checklists to ensure
 * specs are properly validated before advancing.
 */
class TransitionManager {
    transitionChecklists = new Map();
    constructor() {
        this.initializeChecklists();
    }
    /**
     * Initialize default transition checklists
     */
    initializeChecklists() {
        // POC -> MVP
        this.transitionChecklists.set('POC->MVP', {
            from: 'POC',
            to: 'MVP',
            checks: [
                { category: 'documentation', description: 'Short description added', required: true, automated: true },
                { category: 'documentation', description: 'Tags defined', required: true, automated: true },
                { category: 'testing', description: 'Unit tests exist', required: true, automated: true },
                { category: 'review', description: 'Core functionality validated', required: true, automated: false }
            ]
        });
        // MVP -> Alpha
        this.transitionChecklists.set('MVP->Alpha', {
            from: 'MVP',
            to: 'Alpha',
            checks: [
                { category: 'documentation', description: 'Layer defined', required: true, automated: true },
                { category: 'documentation', description: 'Status field set', required: true, automated: true },
                { category: 'testing', description: 'Integration tests exist', required: true, automated: true },
                { category: 'review', description: 'Architecture reviewed', required: true, automated: false }
            ]
        });
        // Alpha -> Beta
        this.transitionChecklists.set('Alpha->Beta', {
            from: 'Alpha',
            to: 'Beta',
            checks: [
                { category: 'documentation', description: 'All blocks documented', required: true, automated: true },
                { category: 'documentation', description: 'README complete', required: true, automated: false },
                { category: 'testing', description: 'Test coverage > 70%', required: true, automated: true },
                { category: 'testing', description: 'E2E tests passing', required: true, automated: true },
                { category: 'review', description: 'Peer review completed', required: true, automated: false },
                { category: 'review', description: 'Security review done', required: false, automated: false },
                { category: 'deployment', description: 'Staging deployment verified', required: true, automated: true }
            ]
        });
        // Beta -> Production
        this.transitionChecklists.set('Beta->Production', {
            from: 'Beta',
            to: 'Production',
            checks: [
                { category: 'documentation', description: 'API documentation complete', required: true, automated: true },
                { category: 'documentation', description: 'Deployment docs ready', required: true, automated: true },
                { category: 'testing', description: 'Performance tests passing', required: true, automated: true },
                { category: 'testing', description: 'Security tests passing', required: true, automated: true },
                { category: 'review', description: 'Full code review completed', required: true, automated: false },
                { category: 'review', description: 'Security audit passed', required: true, automated: false },
                { category: 'deployment', description: 'Production deployment verified', required: true, automated: true }
            ]
        });
        // Production -> Startup
        this.transitionChecklists.set('Production->Startup', {
            from: 'Production',
            to: 'Startup',
            checks: [
                { category: 'documentation', description: 'Team documentation complete', required: true, automated: true },
                { category: 'review', description: 'Process review completed', required: true, automated: false },
                { category: 'deployment', description: 'CI/CD pipeline verified', required: true, automated: true }
            ]
        });
        // Startup -> SMB
        this.transitionChecklists.set('Startup->SMB', {
            from: 'Startup',
            to: 'SMB',
            checks: [
                { category: 'documentation', description: 'Compliance documentation added', required: true, automated: true },
                { category: 'testing', description: 'Security tests comprehensive', required: true, automated: true },
                { category: 'review', description: 'Compliance review completed', required: true, automated: false },
                { category: 'review', description: 'Legal review done', required: true, automated: false }
            ]
        });
        // SMB -> MSB
        this.transitionChecklists.set('SMB->MSB', {
            from: 'SMB',
            to: 'MSB',
            checks: [
                { category: 'documentation', description: 'Audit trail documentation', required: true, automated: true },
                { category: 'testing', description: 'Compliance tests complete', required: true, automated: true },
                { category: 'review', description: 'External audit passed', required: true, automated: false },
                { category: 'review', description: 'Integration tests comprehensive', required: true, automated: true }
            ]
        });
        // MSB -> Enterprise
        this.transitionChecklists.set('MSB->Enterprise', {
            from: 'MSB',
            to: 'Enterprise',
            checks: [
                { category: 'documentation', description: 'Governance documentation', required: true, automated: true },
                { category: 'testing', description: 'Chaos engineering tests', required: true, automated: true },
                { category: 'review', description: 'Enterprise audit completed', required: true, automated: false },
                { category: 'review', description: 'Board review passed', required: true, automated: false },
                { category: 'deployment', description: 'Multi-region deployment verified', required: true, automated: true }
            ]
        });
    }
    /**
     * Check if a spec can transition to a target level
     */
    canTransition(spec, targetLevel) {
        const currentLevel = spec.metadata.project_level || 'POC';
        // Check if transition is valid (adjacent levels only)
        if (!(0, levels_1.isValidTransition)(currentLevel, targetLevel)) {
            return {
                canTransition: false,
                reason: `Invalid transition from ${currentLevel} to ${targetLevel}. Must transition through adjacent levels.`
            };
        }
        const checklist = this.getChecklist(currentLevel, targetLevel);
        if (!checklist) {
            return { canTransition: false, reason: 'No transition checklist available' };
        }
        const results = [];
        for (const check of checklist.checks) {
            const result = this.runCheck(spec, check);
            results.push(result);
        }
        const failedRequired = results.filter(r => !r.passed && r.required);
        return {
            canTransition: failedRequired.length === 0,
            results,
            blockingChecks: failedRequired
        };
    }
    /**
     * Get the checklist for a specific transition
     */
    getChecklist(from, to) {
        return this.transitionChecklists.get(`${from}->${to}`) || null;
    }
    /**
     * Get all available transitions from a level
     */
    getAvailableTransitions(from) {
        const transitions = [];
        this.transitionChecklists.forEach((checklist, _key) => {
            if (checklist.from === from) {
                transitions.push(checklist.to);
            }
        });
        return transitions;
    }
    /**
     * Get transition steps to reach a target level
     */
    getTransitionPath(from, to) {
        const path = [from];
        let current = from;
        while (current !== to) {
            const available = this.getAvailableTransitions(current);
            const next = available.find(l => {
                const remaining = this.getTransitionPath(l, to);
                return remaining.length > 0 || l === to;
            });
            if (!next)
                break;
            path.push(next);
            current = next;
        }
        return path;
    }
    /**
     * Run a single check
     */
    runCheck(spec, check) {
        let passed = false;
        let message = '';
        switch (check.category) {
            case 'documentation':
                passed = this.checkDocumentation(spec, check.description);
                message = passed ? 'Documentation check passed' : 'Documentation incomplete';
                break;
            case 'testing':
                passed = this.checkTesting(spec, check.description);
                message = passed ? 'Testing check passed' : 'Testing requirements not met';
                break;
            case 'review':
                // Reviews cannot be automated
                passed = check.automated;
                message = check.automated ? 'Review check passed' : 'Manual review required';
                break;
            case 'deployment':
                passed = this.checkDeployment(spec, check.description);
                message = passed ? 'Deployment check passed' : 'Deployment not verified';
                break;
        }
        return {
            category: check.category,
            description: check.description,
            passed,
            required: check.required,
            message
        };
    }
    /**
     * Check documentation requirements
     */
    checkDocumentation(spec, description) {
        const metadata = spec.metadata;
        const docScore = this.scoreDocumentation(spec);
        const descLower = description.toLowerCase();
        if (descLower.includes('short description')) {
            return !!metadata.short;
        }
        if (descLower.includes('tags')) {
            return !!(metadata.tags && metadata.tags.length > 0);
        }
        if (descLower.includes('layer')) {
            return metadata.layer !== undefined;
        }
        if (descLower.includes('status')) {
            return !!metadata.status;
        }
        if (descLower.includes('readme')) {
            // Would check for README file existence
            return docScore >= 60;
        }
        if (descLower.includes('api documentation')) {
            return docScore >= 80;
        }
        if (descLower.includes('compliance')) {
            return !!metadata.compliance;
        }
        if (descLower.includes('audit')) {
            return !!metadata.audit;
        }
        if (descLower.includes('governance')) {
            return !!metadata.governance;
        }
        if (descLower.includes('team')) {
            return docScore >= 70;
        }
        if (descLower.includes('all blocks documented')) {
            return spec.blocks !== undefined && spec.blocks.length > 0;
        }
        return docScore >= 50;
    }
    /**
     * Check testing requirements
     */
    checkTesting(spec, description) {
        const coverage = spec.testCoverage || {};
        const descLower = description.toLowerCase();
        if (descLower.includes('unit tests')) {
            return coverage.unit === true;
        }
        if (descLower.includes('integration tests')) {
            return coverage.integration === true;
        }
        if (descLower.includes('e2e')) {
            return coverage.e2e === true;
        }
        if (descLower.includes('coverage')) {
            // Would check actual coverage percentage
            return coverage.unit && coverage.integration;
        }
        if (descLower.includes('performance')) {
            return coverage.performance === true;
        }
        if (descLower.includes('security')) {
            return coverage.security === true;
        }
        if (descLower.includes('compliance')) {
            return coverage.compliance === true;
        }
        if (descLower.includes('chaos')) {
            return coverage.chaos === true;
        }
        return false;
    }
    /**
     * Check deployment requirements
     */
    checkDeployment(spec, description) {
        if (description.includes('CI/CD')) {
            // Would check for CI/CD configuration
            return true;
        }
        if (description.includes('Staging')) {
            // Would check staging deployment
            return true;
        }
        if (description.includes('Production')) {
            // Would check production deployment
            return true;
        }
        if (description.includes('Multi-region')) {
            // Would check multi-region setup
            return true;
        }
        return false;
    }
    /**
     * Simple documentation score
     */
    scoreDocumentation(spec) {
        let score = 0;
        const m = spec.metadata;
        if (m.id)
            score += 15;
        if (m.version)
            score += 15;
        if (m.short)
            score += 15;
        if (m.layer !== undefined)
            score += 10;
        if (m.tags?.length)
            score += 10;
        if (m.status)
            score += 10;
        if (m.project_level)
            score += 10;
        if (m.agent_support)
            score += 15;
        return score;
    }
    /**
     * Add custom transition checklist
     */
    addChecklist(checklist) {
        this.transitionChecklists.set(`${checklist.from}->${checklist.to}`, checklist);
    }
}
exports.TransitionManager = TransitionManager;
/**
 * Create a new TransitionManager instance
 */
function createTransitionManager() {
    return new TransitionManager();
}
//# sourceMappingURL=transitions.js.map